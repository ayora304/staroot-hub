import { apiFetch, apiUpload, isNetworkError } from '../../../core/api/client'
import { ENDPOINTS } from '../../../core/api/endpoints'
import { readCache } from '../../../core/offline/db'
import { outboxStore, syncEngine, SyncError, type HandlerContext, type OutboxItem } from '../../../core/offline'
import type { CapturedPhoto } from '../../../core/evidence/types'
import type { InventoryItem, Movement, MovementInput } from '../types'

export const INVENTORY_OUTBOX = { movement: 'inventory.movement' } as const
async function cached<T>(userId: string, kind: string, group: string, fetcher: () => Promise<T>): Promise<T> {
  try { const result = await fetcher(); await readCache.set(userId, kind, group, result); return result }
  catch (error) { if (!isNetworkError(error)) throw error; const value = await readCache.get<T>(`${userId}:${kind}:${group}`); if (value !== null) return value; throw error }
}
export function listItems(userId: string, signal?: AbortSignal) {
  return cached(userId, 'inventory-items', 'active', async () => (await apiFetch<{ items: InventoryItem[] }>(ENDPOINTS.inventoryItems, { signal })).items)
}
export async function listMovements(userId: string, signal?: AbortSignal) {
  return cached(userId, 'inventory-movements', 'all', async () => {
    const { items } = await apiFetch<{ items: Movement[] }>(ENDPOINTS.inventoryMovements, { signal })
    const queue = await outboxStore.list()
    const queued = new Set(queue.filter((row) => row.type === INVENTORY_OUTBOX.movement).map((row) => row.id))
    const previous = await readCache.get<Movement[]>(`${userId}:inventory-movements:all`) ?? []
    return [...previous.filter((row) => queued.has(row.client_id)), ...items.filter((row) => !queued.has(row.client_id))]
  })
}
export async function getCached<T>(userId: string, kind: string, group: string) { return readCache.get<T>(`${userId}:${kind}:${group}`) }
function photoMetadata(photos: CapturedPhoto[]) {
  return photos.map(({ id, captured_at_client, gps_lat, gps_lng, gps_accuracy_m }) => ({ id, captured_at_client, gps_lat, gps_lng, gps_accuracy_m }))
}
export async function queueMovement(input: MovementInput, item: InventoryItem, userId: string) {
  const id = crypto.randomUUID()
  const meta = photoMetadata(input.photos)
  const { photos, ...fields } = input
  const movement: Movement = {
    $id: id, $createdAt: new Date().toISOString(), client_id: id, item_id: item.$id, item_name: item.name,
    type: input.type, quantity: input.quantity, from_location: input.from_location, to_location: input.to_location,
    custodian_id: input.custodian_id, project_id: input.project_id, note: input.note,
    occurred_at_client: input.occurred_at_client, recorded_by: userId, photo_ids: photos.map((photo) => photo.id),
    local_status: 'pending', photos: photos.map((photo) => ({ $id: photo.id, client_id: photo.id, file_id: photo.id, owner_collection: 'movements', captured_at_client: photo.captured_at_client, gps_lat: photo.gps_lat, gps_lng: photo.gps_lng, gps_accuracy_m: photo.gps_accuracy_m, verification: 'unverified', reasons: ['pending_server_check'], uploaded_by: userId })),
  }
  const delta = input.type === 'dispatch' ? -input.quantity : input.quantity
  const updatedItem = { ...item, quantity_on_hand: Math.max(0, item.quantity_on_hand + delta), version: item.version + 1 }
  await readCache.set(userId, 'inventory-items', 'active', ((await readCache.get<InventoryItem[]>(`${userId}:inventory-items:active`)) ?? []).map((row) => row.$id === item.$id ? updatedItem : row))
  const cachedRows = await readCache.get<Movement[]>(`${userId}:inventory-movements:all`) ?? []
  await readCache.set(userId, 'inventory-movements', 'all', [movement, ...cachedRows])
  await syncEngine.enqueue({ id, userId, type: INVENTORY_OUTBOX.movement, payload: { ...fields, photos: meta, client_id: id }, blobs: photos.map((photo) => ({ id: photo.id, blob: photo.blob })) })
  return movement
}
async function uploadPhotos(item: OutboxItem, ctx: HandlerContext, raw: unknown) {
  if (!Array.isArray(raw)) return []
  const photos: Array<Record<string, unknown>> = []
  for (const value of raw as Array<Record<string, unknown>>) {
    const blob = await ctx.getBlob(String(value.id))
    if (!blob) throw new SyncError('fatal', 'A queued movement photo is missing from this device.')
    await apiUpload(ENDPOINTS.sitePhotos, blob, { uploadId: String(value.id), fileName: `${item.id}-${value.id}.jpg`, metadata: { ...value, owner_collection: 'movements' } })
    photos.push(value)
  }
  return photos
}
export function registerInventoryHandlers() {
  syncEngine.registerHandler(INVENTORY_OUTBOX.movement, async (item, ctx) => {
    const payload = item.payload as Record<string, unknown>
    const photos = await uploadPhotos(item, ctx, payload.photos)
    await apiFetch(ENDPOINTS.inventoryMovements, { method: 'POST', body: { ...payload, photos } })
  })
}

import { z } from 'zod'
import type { Movement } from '../../src/modules/inventory/types'
import { assertCsrf, authenticate } from '../_lib/auth'
import { handler, HttpError, readJson, send } from '../_lib/http'
import { createMovementInTransaction, findMovement, getInventoryItemInTransaction, inventoryTransaction, isInventoryConflict, listInventoryItems, listMovements, listMovementsForCustodian, listProfilesByIds, updateInventoryItemInTransaction } from '../_lib/inventoryRepo'
import { listPhotosByOwner } from '../_lib/siteRepo'
import { recordPhotos } from '../_lib/sitePhotos'
import { requireAccess } from '../_lib/rbac'

const photoSchema = z.object({ id: z.string().uuid(), captured_at_client: z.string().datetime(), gps_lat: z.number().min(-90).max(90).nullable(), gps_lng: z.number().min(-180).max(180).nullable(), gps_accuracy_m: z.number().min(0).max(100_000).nullable() })
const movementSchema = z.object({ client_id: z.string().uuid(), item_id: z.string().min(1), type: z.enum(['dispatch', 'receipt', 'return', 'adjustment']), quantity: z.number().int().positive().max(100_000), base_version: z.number().int().positive(), from_location: z.string().trim().max(120).optional(), to_location: z.string().trim().max(120).optional(), custodian_id: z.string().optional(), project_id: z.string().optional(), note: z.string().trim().max(1000).optional(), occurred_at_client: z.string().datetime(), photos: z.array(photoSchema).max(3) })
function matchesMovement(row: Movement, input: ReturnType<typeof movementSchema.parse>, userId: string) {
  return row.recorded_by === userId && row.item_id === input.item_id && row.type === input.type && row.quantity === input.quantity &&
    (row.from_location ?? null) === (input.from_location ?? null) && (row.to_location ?? null) === (input.to_location ?? null) &&
    (row.custodian_id ?? null) === (input.custodian_id ?? null) && (row.project_id ?? null) === (input.project_id ?? null) &&
    (row.note ?? null) === (input.note ?? null) && row.occurred_at_client === input.occurred_at_client &&
    JSON.stringify(row.photo_ids ?? []) === JSON.stringify(input.photos.map((photo) => photo.id))
}

export default handler(async (req, res) => {
  const ctx = await authenticate(req)
  if (req.method === 'GET') {
    const scope = await requireAccess(ctx, 'inventory', 'read')
    const url = new URL(req.url ?? '/', 'http://local')
    const rawType = url.searchParams.get('type')
    if (rawType && !['dispatch', 'receipt', 'return', 'adjustment'].includes(rawType)) throw new HttpError(400, 'Invalid movement type', 'validation')
    const rows = await listMovements({ itemId: url.searchParams.get('item_id') ?? undefined, custodianId: url.searchParams.get('custodian_id') ?? undefined, type: rawType ?? undefined })
    const profiles = scope === 'all' ? [] : await listProfilesByIds([...new Set(rows.flatMap((row) => [row.recorded_by, row.custodian_id].filter((id): id is string => Boolean(id))))])
    const departmentOf = (id?: string | null) => profiles.find((profile) => profile.user_id === id)?.department
    const items = rows.filter((row) => scope === 'all' || (scope === 'own'
      ? row.recorded_by === ctx.userId || row.custodian_id === ctx.userId
      : departmentOf(row.recorded_by) === ctx.profile.department || departmentOf(row.custodian_id) === ctx.profile.department))
    const photoRows = await listPhotosByOwner('movements', items.map((row) => row.$id))
    const photosByMovement = new Map<string, typeof photoRows>()
    for (const photo of photoRows) if (photo.owner_id) photosByMovement.set(photo.owner_id, [...(photosByMovement.get(photo.owner_id) ?? []), photo])
    const catalog = await listInventoryItems()
    const names = new Map(catalog.map((item) => [item.$id, item.name]))
    return send(res, 200, { items: items.map((row) => ({ ...row, item_name: names.get(row.item_id), photos: photosByMovement.get(row.$id) ?? [] })) })
  }
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  assertCsrf(req)
  const scope = await requireAccess(ctx, 'inventory', 'write')
  const input = movementSchema.parse(await readJson(req))
  const replay = await findMovement(input.client_id)
  if (replay) {
    if (!matchesMovement(replay, input, ctx.userId)) throw new HttpError(409, 'Movement ID is already in use', 'conflict')
    const photos = await recordPhotos(ctx.userId, 'movements', replay.$id, input.photos)
    return send(res, 200, { movement: { ...replay, photos }, replay: true })
  }
  if (input.type === 'dispatch' && !input.custodian_id) throw new HttpError(400, 'Choose the receiving custodian', 'validation')
  if (input.type === 'return' && !input.custodian_id) throw new HttpError(400, 'Choose the custodian returning this asset', 'validation')
  if (input.type === 'adjustment' && !ctx.profile.is_admin) throw new HttpError(403, 'Only administrators can adjust stock', 'forbidden')
  if (scope === 'own' && input.custodian_id && input.custodian_id !== ctx.userId) throw new HttpError(403, 'You can only record custody for yourself', 'forbidden')
  if (input.custodian_id) {
    const profile = (await listProfilesByIds([input.custodian_id]))[0]
    if (!profile?.active) throw new HttpError(400, 'Choose an active staff custodian', 'validation')
    if (scope === 'department' && profile.department !== ctx.profile.department) throw new HttpError(403, 'Custodian is outside your department', 'forbidden')
  }
  if (input.type === 'return' && input.custodian_id) {
    const ledger = await listMovementsForCustodian(input.item_id, input.custodian_id)
    const held = ledger.reduce((sum, row) => sum + (row.type === 'dispatch' ? row.quantity : row.type === 'return' ? -row.quantity : 0), 0)
    if (held < input.quantity) throw new HttpError(409, 'Return quantity exceeds the recorded custody balance.', 'custody_conflict')
  }
  for (const photo of input.photos) {
    const { assertPhotoAccess } = await import('../_lib/siteRepo')
    try { await assertPhotoAccess(photo.id, ctx.userId) } catch { throw new HttpError(400, 'A movement photo is missing or belongs to another user', 'photo_missing') }
  }
  let movement: Movement | null
  try {
    movement = await inventoryTransaction(async (tx) => {
      const item = await getInventoryItemInTransaction(input.item_id, tx)
      if (!item.active) throw new HttpError(404, 'Inventory item not found', 'not_found')
      if (input.type === 'return' && item.kind !== 'returnable') throw new HttpError(400, 'Consumable items cannot be returned', 'validation')
      if (item.version !== input.base_version) throw new HttpError(409, 'Stock changed on another device. Refresh and retry this movement.', 'conflict')
      const delta = input.type === 'dispatch' ? -input.quantity : input.quantity
      const quantity = item.quantity_on_hand + delta
      if (quantity < 0) throw new HttpError(409, 'There is not enough stock for this dispatch.', 'insufficient_stock')
      const created = await createMovementInTransaction(input.client_id, {
        client_id: input.client_id, item_id: input.item_id, type: input.type, quantity: input.quantity,
        ...(input.from_location ? { from_location: input.from_location } : {}), ...(input.to_location ? { to_location: input.to_location } : {}),
        ...(input.custodian_id ? { custodian_id: input.custodian_id } : {}), ...(input.project_id ? { project_id: input.project_id } : {}),
        ...(input.note ? { note: input.note } : {}), photo_ids: input.photos.map((photo) => photo.id),
        occurred_at_client: input.occurred_at_client, recorded_by: ctx.userId,
      }, tx)
      await updateInventoryItemInTransaction(item.$id, { quantity_on_hand: quantity, version: item.version + 1 }, tx)
      return created as unknown as Movement
    })
  } catch (error) {
    if (isInventoryConflict(error)) {
      const duplicate = await findMovement(input.client_id)
      if (duplicate && matchesMovement(duplicate, input, ctx.userId)) {
        const photos = await recordPhotos(ctx.userId, 'movements', duplicate.$id, input.photos)
        return send(res, 200, { movement: { ...duplicate, photos }, replay: true })
      }
      throw new HttpError(409, 'Stock changed or movement ID was already used. Refresh before retrying.', 'conflict')
    }
    throw error
  }
  if (!movement) throw new HttpError(500, 'Movement could not be recorded', 'internal')
  const photos = await recordPhotos(ctx.userId, 'movements', movement.$id, input.photos)
  send(res, 201, { movement: { ...movement, photos }, replay: false })
})

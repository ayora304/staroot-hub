import { apiFetch, apiUpload } from '../../../core/api/client'
import { ENDPOINTS } from '../../../core/api/endpoints'
import { readCache } from '../../../core/offline/db'
import { isNetworkError } from '../../../core/api/client'
import { outboxStore, syncEngine, SyncError, type HandlerContext, type OutboxItem } from '../../../core/offline'
import type { CapturedPhoto, Contractor, ReportSnapshot, SiteLog, SiteProject, SiteReport } from '../types'

export const SITE_OUTBOX = { log: 'site.log', update: 'site.log.update', report: 'site.report' } as const
async function getOrFetch<T>(userId: string, kind: string, group: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const value = await fetcher()
    await readCache.set(userId, kind, group, value)
    return value
  } catch (error) {
    if (!isNetworkError(error)) throw error
    const cached = await readCache.get<T>(`${userId}:${kind}:${group}`)
    if (cached !== null) return cached
    throw error
  }
}

export function listProjects(userId: string, signal?: AbortSignal) {
  return getOrFetch(userId, 'site-projects', 'active', async () => {
    const { items } = await apiFetch<{ items: SiteProject[] }>(ENDPOINTS.siteProjects, { signal })
    return items
  })
}

export function listContractors(userId: string, projectId: string, signal?: AbortSignal) {
  return getOrFetch(userId, 'site-contractors', projectId, async () => {
    const { items } = await apiFetch<{ items: Contractor[] }>(`${ENDPOINTS.siteContractors}?project_id=${encodeURIComponent(projectId)}`, { signal })
    return items
  })
}

export function listLogs(userId: string, projectId: string, signal?: AbortSignal) {
  return getOrFetch(userId, 'site-logs', projectId, async () => {
    const { items } = await apiFetch<{ items: SiteLog[] }>(`${ENDPOINTS.siteLogs}?project_id=${encodeURIComponent(projectId)}`, { signal })
    const queue = await outboxStore.list()
    const queuedIds = new Set(queue.filter((item) => item.userId === userId && item.type === SITE_OUTBOX.log).map((item) => item.id))
    const cached = await readCache.get<SiteLog[]>(`${userId}:site-logs:${projectId}`) ?? []
    const optimistic = cached.filter((row) => queuedIds.has(row.client_id))
    return [...optimistic, ...items.filter((row) => !queuedIds.has(row.client_id))]
  })
}

export function listReports(userId: string, signal?: AbortSignal) {
  return getOrFetch(userId, 'site-reports', 'all', async () => {
    const { items } = await apiFetch<{ items: SiteReport[] }>(ENDPOINTS.siteReports, { signal })
    const queue = await outboxStore.list()
    const queuedIds = new Set(queue.filter((item) => item.userId === userId && item.type === SITE_OUTBOX.report).map((item) => item.id))
    const cached = await readCache.get<SiteReport[]>(`${userId}:site-reports:all`) ?? []
    const optimistic = cached.filter((row) => queuedIds.has(row.client_id))
    return [...optimistic, ...items.filter((row) => !queuedIds.has(row.client_id))]
  })
}

export async function getCached<T>(userId: string, kind: string, group = 'all') {
  return readCache.get<T>(`${userId}:${kind}:${group}`)
}

export async function changePendingReport(report: SiteReport, userId: string, change: { action: 'approve' } | { action: 'edit'; title: string; report_date: string; snapshot: ReportSnapshot }) {
  if (report.local_status || !report.$updatedAt) throw new Error('Wait for this report to sync before editing or approving it.')
  const result = await apiFetch<{ report: SiteReport }>(ENDPOINTS.siteReports, { method: 'PUT', body: { ...change, report_id: report.$id, base_updated_at: report.$updatedAt } })
  const updated = { ...result.report, photos: report.photos }
  const cached = await getCached<SiteReport[]>(userId, 'site-reports') ?? []
  await readCache.set(userId, 'site-reports', 'all', cached.map((item) => item.$id === updated.$id ? updated : item))
  return updated
}

async function appendCached<T>(userId: string, kind: string, group: string, row: T) {
  const rows = await readCache.get<T[]>(`${userId}:${kind}:${group}`) ?? []
  await readCache.set(userId, kind, group, [row, ...rows])
}

export async function queueSiteLog(input: Omit<SiteLog, '$id' | '$createdAt' | '$updatedAt' | 'client_id' | 'engineer_id' | 'photo_ids' | 'local_status' | 'photos'>, engineerId: string, photos: CapturedPhoto[]) {
  const id = crypto.randomUUID()
  const payload = {
    ...input,
    photos: photos.map(({ id: photoId, captured_at_client, gps_lat, gps_lng, gps_accuracy_m }) => ({ id: photoId, captured_at_client, gps_lat, gps_lng, gps_accuracy_m })),
  }
  const optimistic: SiteLog = {
    ...input, $id: id, $createdAt: new Date().toISOString(), client_id: id,
    engineer_id: engineerId, photo_ids: photos.map((p) => p.id), local_status: 'pending',
    photos: photos.map((photo) => ({
      $id: photo.id, client_id: photo.id, file_id: photo.id, owner_collection: 'site_logs',
      captured_at_client: photo.captured_at_client, gps_lat: photo.gps_lat, gps_lng: photo.gps_lng,
      gps_accuracy_m: photo.gps_accuracy_m, verification: 'unverified', reasons: ['pending_server_check'], uploaded_by: engineerId,
    })),
  }
  await appendCached(engineerId, 'site-logs', input.project_id, optimistic)
  await syncEngine.enqueue({
    id, userId: engineerId, type: SITE_OUTBOX.log, payload,
    blobs: photos.map((photo) => ({ id: photo.id, blob: photo.blob })),
  })
  return optimistic
}

export async function queueSiteLogUpdate(log: SiteLog, changes: Pick<SiteLog, 'work_done' | 'materials_used' | 'blockers' | 'status' | 'progress_pct'>, userId: string) {
  if (!log.$updatedAt) throw new Error('This log is not synced yet and cannot be edited.')
  const id = crypto.randomUUID()
  const optimistic = { ...log, ...changes, local_status: 'pending' as const }
  const cached = await readCache.get<SiteLog[]>(`${userId}:site-logs:${log.project_id}`) ?? []
  await readCache.set(userId, 'site-logs', log.project_id, cached.map((item) => item.$id === log.$id ? optimistic : item))
  await syncEngine.enqueue({
    id, userId, type: SITE_OUTBOX.update,
    payload: { log_id: log.$id, base_updated_at: log.$updatedAt, ...changes },
  })
  return optimistic
}

export async function queueSiteReport(input: { title: string; report_date: string; author_name: string; snapshot: ReportSnapshot }, authorId: string, photos: CapturedPhoto[]) {
  const id = crypto.randomUUID()
  const photoMetadata = photos.map(({ id: photoId, captured_at_client, gps_lat, gps_lng, gps_accuracy_m }) => ({ id: photoId, captured_at_client, gps_lat, gps_lng, gps_accuracy_m }))
  const report: SiteReport = {
    $id: id, $createdAt: new Date().toISOString(), client_id: id,
    title: input.title, report_date: input.report_date, author_id: authorId,
    author_name: input.author_name, schema_version: 1,
    snapshot: JSON.stringify(input.snapshot), status: 'pending', local_status: 'pending',
    photos: photos.map((photo) => ({
      $id: photo.id, client_id: photo.id, file_id: photo.id, owner_collection: 'reports',
      captured_at_client: photo.captured_at_client, gps_lat: photo.gps_lat, gps_lng: photo.gps_lng,
      gps_accuracy_m: photo.gps_accuracy_m, verification: 'unverified', reasons: ['pending_server_check'], uploaded_by: authorId,
    })),
  }
  await appendCached(authorId, 'site-reports', 'all', report)
  await syncEngine.enqueue({
    id, userId: authorId, type: SITE_OUTBOX.report,
    payload: { title: input.title, report_date: input.report_date, snapshot: input.snapshot, photos: photoMetadata },
    blobs: photos.map((photo) => ({ id: photo.id, blob: photo.blob })),
  })
  return report
}

interface PhotoMeta { id: string; captured_at_client: string; gps_lat: number | null; gps_lng: number | null; gps_accuracy_m: number | null }

async function uploadPhotos(item: OutboxItem, ctx: HandlerContext, raw: unknown, owner: 'site_logs' | 'reports'): Promise<PhotoMeta[]> {
  if (!Array.isArray(raw)) return []
  const photos: PhotoMeta[] = []
  for (const value of raw) {
    const meta = value as PhotoMeta
    const blob = await ctx.getBlob(meta.id)
    if (!blob) throw new SyncError('fatal', 'A queued site photo is missing from this device.')
    await apiUpload(ENDPOINTS.sitePhotos, blob, {
      uploadId: meta.id, fileName: `${item.id}-${meta.id}.jpg`,
      metadata: { ...meta, owner_collection: owner },
    })
    photos.push(meta)
  }
  return photos
}

export function registerSiteHandlers() {
  syncEngine.registerHandler(SITE_OUTBOX.log, async (item, ctx) => {
    const payload = item.payload as Record<string, unknown>
    const photos = await uploadPhotos(item, ctx, payload.photos, 'site_logs')
    const { photos: _photos, ...fields } = payload
    await apiFetch(ENDPOINTS.siteLogs, { method: 'POST', body: { ...fields, photos, client_id: item.id } })
  })
  syncEngine.registerHandler(SITE_OUTBOX.report, async (item, ctx) => {
    const payload = item.payload as Record<string, unknown>
    const photos = await uploadPhotos(item, ctx, payload.photos, 'reports')
    const { photos: _photos, author_name: _authorName, ...fields } = payload
    await apiFetch(ENDPOINTS.siteReports, { method: 'POST', body: { ...fields, photos, client_id: item.id } })
  })
  syncEngine.registerHandler(SITE_OUTBOX.update, async (item) => {
    await apiFetch(ENDPOINTS.siteLogs, { method: 'PUT', body: { ...(item.payload as Record<string, unknown>), client_id: item.id } })
  })
}

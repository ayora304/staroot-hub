import { canAccessRecord } from '../../src/core/rbac/permissions'
import type { Scope } from '../../src/core/rbac/roles'
import { assertCsrf, authenticate } from '../_lib/auth'
import { handler, HttpError, readJson, send } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'
import { assertPhotoAccess, createLog, findLogByClientId, findPhotoByClientId, getContractor, getLog, getProject, isConflict, listLogs, listPhotosByOwner, listProfilesByIds, updateContractorProgress, updateLog } from '../_lib/siteRepo'
import { createLogSchema, updateLogSchema } from '../_lib/siteSchemas'
import type { PhotoRecord, SiteLog } from '../../src/modules/site-progress/types'
import { recordPhotos } from '../_lib/sitePhotos'

function visible(scope: Scope, ctx: Awaited<ReturnType<typeof authenticate>>, log: SiteLog, department?: string) {
  return canAccessRecord(scope, { userId: ctx.userId, department: ctx.profile.department }, {
    ownerId: log.engineer_id,
    department: department === ctx.profile.department ? ctx.profile.department : undefined,
  })
}

function matchesLog(log: SiteLog, input: ReturnType<typeof createLogSchema.parse>) {
  return log.project_id === input.project_id && log.contractor_id === input.contractor_id && log.log_date === input.log_date &&
    log.work_done === input.work_done && (log.materials_used ?? null) === (input.materials_used ?? null) &&
    (log.blockers ?? null) === (input.blockers ?? null) && log.status === input.status &&
    (log.progress_pct ?? null) === (input.progress_pct ?? null) &&
    JSON.stringify(log.photo_ids ?? []) === JSON.stringify(input.photos.map((photo) => photo.id))
}

export default handler(async (req, res) => {
  const ctx = await authenticate(req)
  if (req.method === 'GET') {
    const scope = await requireAccess(ctx, 'site', 'read')
    const projectId = new URL(req.url ?? '/', 'http://local').searchParams.get('project_id')
    if (!projectId) throw new HttpError(400, 'Choose a project', 'validation')
    if (!await getProject(projectId)) throw new HttpError(404, 'Project not found', 'not_found')
    const rows = await listLogs(projectId)
    const profiles = scope === 'department'
      ? await listProfilesByIds([...new Set(rows.map((log) => log.engineer_id))])
      : []
    const items = rows.filter((log) => visible(scope, ctx, log, profiles.find((p) => p.user_id === log.engineer_id)?.department))
    const photos = await listPhotosByOwner('site_logs', items.map((log) => log.$id))
    const byLog = new Map<string, PhotoRecord[]>()
    for (const photo of photos) {
      if (!photo.owner_id || (scope !== 'all' && photo.uploaded_by !== ctx.userId && !items.some((item) => item.$id === photo.owner_id))) continue
      byLog.set(photo.owner_id, [...(byLog.get(photo.owner_id) ?? []), photo])
    }
    send(res, 200, { items: items.map((log) => ({ ...log, photos: byLog.get(log.$id) ?? [] })) })
    return
  }
  if (req.method === 'POST') {
    assertCsrf(req)
    await requireAccess(ctx, 'site', 'write')
    const input = createLogSchema.parse(await readJson(req))
    const replay = await findLogByClientId(input.client_id)
    if (replay) {
      if (replay.engineer_id !== ctx.userId || !matchesLog(replay, input)) throw new HttpError(409, 'Log ID is already in use', 'conflict')
      const photos = await recordPhotos(ctx.userId, 'site_logs', replay.$id, input.photos)
      if (input.progress_pct != null) await updateContractorProgress(replay.contractor_id, input.progress_pct)
      send(res, 200, { log: { ...replay, photos }, replay: true })
      return
    }
    const project = await getProject(input.project_id)
    const contractor = await getContractor(input.contractor_id)
    if (!project || project.status !== 'active' || !contractor || !contractor.active || contractor.project_id !== input.project_id) throw new HttpError(400, 'Choose an active contractor assigned to this project', 'validation')
    for (const meta of input.photos) {
      const photo = await findPhotoByClientId(meta.id)
      if (photo && (photo.owner_collection !== 'site_logs' || photo.uploaded_by !== ctx.userId)) throw new HttpError(409, 'Photo is already attached to another site record', 'conflict')
      if (photo?.owner_id) throw new HttpError(409, 'Photo is already attached to another site record', 'conflict')
      try { await assertPhotoAccess(meta.id, ctx.userId) }
      catch { throw new HttpError(400, 'A queued photo is missing or belongs to another user', 'photo_missing') }
    }
    try {
      const log = await createLog({
        client_id: input.client_id, project_id: input.project_id, contractor_id: input.contractor_id,
        log_date: input.log_date, work_done: input.work_done,
        ...(input.materials_used !== undefined ? { materials_used: input.materials_used } : {}),
        ...(input.blockers !== undefined ? { blockers: input.blockers } : {}),
        status: input.status, ...(input.progress_pct != null ? { progress_pct: input.progress_pct } : {}),
        photo_ids: input.photos.map((p) => p.id), engineer_id: ctx.userId,
      })
      const photos = await recordPhotos(ctx.userId, 'site_logs', log.$id, input.photos)
      if (input.progress_pct != null) await updateContractorProgress(contractor.$id, input.progress_pct)
      send(res, 200, { log: { ...log, photos }, replay: false })
    } catch (e) {
      if (!isConflict(e)) throw e
      const again = await findLogByClientId(input.client_id)
      if (again?.engineer_id === ctx.userId && matchesLog(again, input)) {
        const photos = await recordPhotos(ctx.userId, 'site_logs', again.$id, input.photos)
        if (input.progress_pct != null) await updateContractorProgress(again.contractor_id, input.progress_pct)
        return send(res, 200, { log: { ...again, photos }, replay: true })
      }
      throw new HttpError(409, 'Log ID is already in use', 'conflict')
    }
    return
  }
  if (req.method === 'PUT') {
    assertCsrf(req)
    const scope = await requireAccess(ctx, 'site', 'write')
    const input = updateLogSchema.parse(await readJson(req))
    const current = await getLog(input.log_id)
    if (!current || !visible(scope, ctx, current, ctx.profile.department)) throw new HttpError(404, 'Log not found', 'not_found')
    if (current.engineer_id !== ctx.userId || Date.now() - Date.parse(current.$createdAt) > 24 * 60 * 60 * 1000) throw new HttpError(403, 'Only the author can edit a log during the first 24 hours', 'forbidden')
    const { client_id: _clientId, log_id: _logId, base_updated_at: _base, ...changes } = input
    if (current.$updatedAt !== input.base_updated_at) {
      const alreadyApplied = Object.entries(changes).every(([key, value]) => (current as unknown as Record<string, unknown>)[key] === value)
      if (alreadyApplied) {
        if (changes.progress_pct != null) await updateContractorProgress(current.contractor_id, changes.progress_pct)
        send(res, 200, { log: current, replay: true }); return
      }
      throw new HttpError(409, 'This log changed on another device. Refresh it before editing.', 'conflict')
    }
    const updated = await updateLog(current.$id, changes)
    if (changes.progress_pct != null) await updateContractorProgress(current.contractor_id, changes.progress_pct)
    send(res, 200, { log: updated })
    return
  }
  throw new HttpError(405, 'Method not allowed', 'method')
})

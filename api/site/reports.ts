import { canAccessRecord } from '../../src/core/rbac/permissions'
import type { Scope } from '../../src/core/rbac/roles'
import { assertCsrf, authenticate } from '../_lib/auth'
import { handler, HttpError, readJson, send } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'
import { assertPhotoAccess, createReport, findPhotoByClientId, findReportByClientId, getProject, isConflict, listProfilesByIds, listReports, listPhotosByOwner } from '../_lib/siteRepo'
import { createReportSchema } from '../_lib/siteSchemas'
import type { SiteReport } from '../../src/modules/site-progress/types'
import { recordPhotos } from '../_lib/sitePhotos'

function visible(scope: Scope, ctx: Awaited<ReturnType<typeof authenticate>>, report: SiteReport, department?: string) {
  return canAccessRecord(scope, { userId: ctx.userId, department: ctx.profile.department }, {
    ownerId: report.author_id,
    department: department === ctx.profile.department ? ctx.profile.department : undefined,
  })
}

function matchesReport(report: SiteReport, input: ReturnType<typeof createReportSchema.parse>) {
  return report.title === input.title && report.report_date === input.report_date && report.snapshot === JSON.stringify(input.snapshot)
}

export default handler(async (req, res) => {
  const ctx = await authenticate(req)
  if (req.method === 'GET') {
    const scope = await requireAccess(ctx, 'site', 'read')
    const rows = await listReports()
    const profiles = scope === 'department' ? await listProfilesByIds([...new Set(rows.map((report) => report.author_id))]) : []
    const items = rows.filter((report) => visible(scope, ctx, report, profiles.find((p) => p.user_id === report.author_id)?.department))
    const photos = await listPhotosByOwner('reports', items.map((report) => report.$id))
    send(res, 200, { items: items.map((report) => ({ ...report, photos: photos.filter((photo) => photo.owner_id === report.$id) })) })
    return
  }
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  assertCsrf(req)
  await requireAccess(ctx, 'site', 'write')
  const input = createReportSchema.parse(await readJson(req))
  const existing = await findReportByClientId(input.client_id)
  const referenced = new Set(input.snapshot.projects.flatMap((project) => project.sections.flatMap((section) => section.photo_ids)))
  const uploaded = new Set(input.photos.map((photo) => photo.id))
  if (referenced.size !== uploaded.size || [...referenced].some((id) => !uploaded.has(id))) throw new HttpError(400, 'Report photo list does not match the snapshot', 'validation')
  for (const meta of input.photos) {
    const photo = await findPhotoByClientId(meta.id)
    if (photo && (photo.uploaded_by !== ctx.userId || photo.owner_collection !== 'reports' || (photo.owner_id && photo.owner_id !== (existing?.$id ?? input.client_id)))) throw new HttpError(409, 'Photo is already attached to another report', 'conflict')
    try { await assertPhotoAccess(meta.id, ctx.userId) }
    catch { throw new HttpError(400, 'A report photo is missing or belongs to another user', 'photo_missing') }
  }
  if (existing) {
    if (existing.author_id !== ctx.userId || !matchesReport(existing, input)) throw new HttpError(409, 'Report ID is already in use', 'conflict')
    const photos = await recordPhotos(ctx.userId, 'reports', existing.$id, input.photos)
    send(res, 200, { report: { ...existing, photos }, replay: true })
    return
  }
  for (const part of input.snapshot.projects) {
    const project = await getProject(part.project_id)
    if (!project || project.status !== 'active' || project.name !== part.project_name) throw new HttpError(400, 'A report project is no longer active', 'validation')
  }
  try {
    const report = await createReport({
      client_id: input.client_id, title: input.title, report_date: input.report_date,
      author_id: ctx.userId, author_name: ctx.profile.display_name,
      schema_version: 1, snapshot: JSON.stringify(input.snapshot), status: 'published',
    })
    const photos = await recordPhotos(ctx.userId, 'reports', report.$id, input.photos)
    send(res, 200, { report: { ...report, photos }, replay: false })
  } catch (e) {
    if (!isConflict(e)) throw e
    const replay = await findReportByClientId(input.client_id)
    if (replay?.author_id === ctx.userId && matchesReport(replay, input)) {
      const photos = await recordPhotos(ctx.userId, 'reports', replay.$id, input.photos)
      return send(res, 200, { report: { ...replay, photos }, replay: true })
    }
    throw new HttpError(409, 'Report ID is already in use', 'conflict')
  }
})

import { Storage } from 'node-appwrite'
import { canAccessRecord } from '../../src/core/rbac/permissions'
import type { Scope } from '../../src/core/rbac/roles'
import { adminClient } from '../_lib/appwrite'
import { authenticate } from '../_lib/auth'
import { handler, HttpError } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'
import { findPhotoByClientId, getLog, getReport, listProfilesByIds } from '../_lib/siteRepo'

export default handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  const scope = await requireAccess(ctx, 'site', 'read')
  const params = new URL(req.url ?? '/', 'http://local').searchParams
  const fileId = params.get('file_id')
  const ownerId = params.get('owner_id')
  const owner = params.get('owner_collection')
  if (!fileId || !ownerId || (owner !== 'site_logs' && owner !== 'reports')) throw new HttpError(400, 'Photo reference is required', 'validation')
  const photo = await findPhotoByClientId(fileId)
  if (!photo || photo.file_id !== fileId || photo.owner_id !== ownerId || photo.owner_collection !== owner) throw new HttpError(404, 'Photo not found', 'not_found')
  const allowed = async (ownerScope: Scope, author: string, department?: string) => canAccessRecord(ownerScope, { userId: ctx.userId, department: ctx.profile.department }, { ownerId: author, department: department === ctx.profile.department ? ctx.profile.department : undefined })
  if (owner === 'site_logs') {
    const log = await getLog(ownerId)
    if (!log || !log.photo_ids.includes(fileId)) throw new HttpError(404, 'Photo not found', 'not_found')
    let department: string | undefined
    if (scope === 'department') department = (await listProfilesByIds([log.engineer_id]))[0]?.department
    if (!await allowed(scope, log.engineer_id, department)) throw new HttpError(404, 'Photo not found', 'not_found')
  } else {
    const report = await getReport(ownerId)
    if (!report) throw new HttpError(404, 'Photo not found', 'not_found')
    let department: string | undefined
    if (scope === 'department') department = (await listProfilesByIds([report.author_id]))[0]?.department
    if (!await allowed(scope, report.author_id, department)) throw new HttpError(404, 'Photo not found', 'not_found')
    const snapshot = JSON.parse(report.snapshot) as { projects?: Array<{ sections?: Array<{ photo_ids?: string[] }> }> }
    if (!snapshot.projects?.some((p) => p.sections?.some((s) => s.photo_ids?.includes(fileId)))) throw new HttpError(404, 'Photo not found', 'not_found')
  }
  const bucket = process.env.APPWRITE_BUCKET_PROOFS
  if (!bucket) throw new HttpError(500, 'Photo storage is not configured', 'misconfigured')
  const bytes = await new Storage(adminClient()).getFileView(bucket, fileId)
  res.statusCode = 200
  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Cache-Control', 'private, no-store')
  res.end(Buffer.from(bytes))
})

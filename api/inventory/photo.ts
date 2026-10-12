import { Storage } from 'node-appwrite'
import { adminClient } from '../_lib/appwrite'
import { authenticate } from '../_lib/auth'
import { handler, HttpError } from '../_lib/http'
import { getMovement } from '../_lib/inventoryRepo'
import { findPhotoByClientId, listProfilesByIds } from '../_lib/siteRepo'
import { requireAccess } from '../_lib/rbac'

export default handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  const scope = await requireAccess(ctx, 'inventory', 'read')
  const params = new URL(req.url ?? '/', 'http://local').searchParams
  const fileId = params.get('file_id'), ownerId = params.get('owner_id')
  if (!fileId || !ownerId) throw new HttpError(400, 'Photo reference is required', 'validation')
  const photo = await findPhotoByClientId(fileId)
  if (!photo || photo.file_id !== fileId || photo.owner_id !== ownerId || photo.owner_collection !== 'movements') throw new HttpError(404, 'Photo not found', 'not_found')
  const movement = await getMovement(ownerId)
  if (!movement || !movement.photo_ids?.includes(fileId)) throw new HttpError(404, 'Photo not found', 'not_found')
  if (scope === 'own' && movement.recorded_by !== ctx.userId && movement.custodian_id !== ctx.userId) throw new HttpError(404, 'Photo not found', 'not_found')
  if (scope === 'department') {
    const profiles = await listProfilesByIds([movement.recorded_by, ...(movement.custodian_id ? [movement.custodian_id] : [])])
    if (!profiles.some((profile) => profile.department === ctx.profile.department)) throw new HttpError(404, 'Photo not found', 'not_found')
  }
  const bucket = process.env.APPWRITE_BUCKET_PROOFS
  if (!bucket) throw new HttpError(500, 'Photo storage is not configured', 'misconfigured')
  const bytes = await new Storage(adminClient()).getFileView(bucket, fileId)
  res.statusCode = 200
  res.setHeader('Content-Type', 'image/jpeg')
  res.setHeader('Cache-Control', 'private, no-store')
  res.end(Buffer.from(bytes))
})

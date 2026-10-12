import { Storage } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { adminClient } from '../_lib/appwrite'
import { authenticate, assertCsrf } from '../_lib/auth'
import { findPhotoByClientId } from '../_lib/siteRepo'
import { verifyCapture } from '../_lib/sitePhotos'
import { handler, HttpError, send, type Req } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'

export const config = { api: { bodyParser: false } }
const MAX_BYTES = 3 * 1024 * 1024
const codeOf = (e: unknown) => (e as { code?: number } | null)?.code
function header(req: Req, name: string) {
  const value = req.headers[name]
  return Array.isArray(value) ? value[0] : value
}
async function bodyBuffer(req: Req) {
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > MAX_BYTES) throw new HttpError(413, 'Photo is larger than 3 MB', 'too_large')
    return req.body
  }
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array)
    size += part.length
    if (size > MAX_BYTES) throw new HttpError(413, 'Photo is larger than 3 MB', 'too_large')
    chunks.push(part)
  }
  return Buffer.concat(chunks)
}

export default handler(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  assertCsrf(req)
  const metaModule = 'site'
  const id = header(req, 'x-upload-id') ?? ''
  if (!/^[a-f\d-]{36}$/i.test(id)) throw new HttpError(400, 'Invalid photo ID', 'validation')
  if ((header(req, 'content-type') ?? '').split(';')[0].trim().toLowerCase() !== 'image/jpeg') throw new HttpError(415, 'Only compressed JPEG photos are accepted', 'file_type')
  let meta: Record<string, unknown>
  try { meta = JSON.parse(decodeURIComponent(header(req, 'x-upload-metadata') ?? '')) as Record<string, unknown> }
  catch { throw new HttpError(400, 'Photo capture metadata is required', 'validation') }
  const owner = meta.owner_collection
  if (owner !== 'site_logs' && owner !== 'reports' && owner !== 'movements') throw new HttpError(400, 'Invalid photo owner', 'validation')
  await requireAccess(ctx, owner === 'movements' ? 'inventory' : metaModule, 'write')
  if (typeof meta.captured_at_client !== 'string' || Number.isNaN(Date.parse(meta.captured_at_client))) throw new HttpError(400, 'Invalid capture time', 'validation')
  const lat = meta.gps_lat, lng = meta.gps_lng, accuracy = meta.gps_accuracy_m
  if (lat !== null && (typeof lat !== 'number' || lat < -90 || lat > 90)) throw new HttpError(400, 'Invalid GPS latitude', 'validation')
  if (lng !== null && (typeof lng !== 'number' || lng < -180 || lng > 180)) throw new HttpError(400, 'Invalid GPS longitude', 'validation')
  if (accuracy !== null && (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100_000)) throw new HttpError(400, 'Invalid GPS accuracy', 'validation')
  const existing = await findPhotoByClientId(id)
  if (existing) {
    if (existing.uploaded_by !== ctx.userId || existing.owner_collection !== owner) throw new HttpError(409, 'Photo ID is already in use', 'conflict')
    if (existing.file_id !== id || existing.captured_at_client !== meta.captured_at_client || existing.gps_lat !== lat || existing.gps_lng !== lng || existing.gps_accuracy_m !== accuracy) throw new HttpError(409, 'Photo capture metadata does not match its original upload', 'conflict')
    return send(res, 200, { file_id: existing.file_id, verification: existing.verification, reasons: existing.reasons, replay: true })
  }
  const bytes = await bodyBuffer(req)
  if (!bytes.length || bytes.subarray(0, 3).toString('hex') !== 'ffd8ff') throw new HttpError(415, 'Photo is not a valid JPEG', 'file_type')
  const bucket = process.env.APPWRITE_BUCKET_PROOFS
  if (!bucket) throw new HttpError(500, 'Photo storage is not configured', 'misconfigured')
  const storage = new Storage(adminClient())
  let filename = ''
  try { filename = decodeURIComponent(header(req, 'x-file-name') ?? '') } catch { throw new HttpError(400, 'Invalid filename', 'validation') }
  filename = filename.replace(/[\\/\r\n\0]/g, '_').slice(0, 120) || 'site-photo.jpg'
  try {
    await storage.createFile(bucket, id, InputFile.fromBuffer(bytes, `${ctx.userId}--${filename}`), [])
  } catch (e) {
    if (codeOf(e) !== 409) throw e
    const file = await storage.getFile(bucket, id)
    if (!String(file.name).startsWith(`${ctx.userId}--`)) throw new HttpError(409, 'Photo ID belongs to another user', 'conflict')
  }
  const verification = verifyCapture({ id, captured_at_client: meta.captured_at_client, gps_lat: lat as number | null, gps_lng: lng as number | null, gps_accuracy_m: accuracy as number | null })
  send(res, 200, { file_id: id, verification: verification.verification, reasons: verification.reasons, skew_seconds: verification.skew_seconds })
})

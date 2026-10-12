import { Storage } from 'node-appwrite'
import { InputFile } from 'node-appwrite/file'
import { adminClient } from '../_lib/appwrite'
import { assertCsrf, authenticate } from '../_lib/auth'
import { handler, HttpError, send, type Req } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'

export const config = { api: { bodyParser: false } }

const MAX_BYTES = 10 * 1024 * 1024
const MIME_EXT: Record<string, string> = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }

function readHeader(req: Req, name: string): string | undefined {
  const value = req.headers[name]
  return Array.isArray(value) ? value[0] : value
}

async function bodyBuffer(req: Req): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > MAX_BYTES) throw new HttpError(413, 'Attachment is larger than 10 MB', 'too_large')
    return req.body
  }
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array)
    size += part.length
    if (size > MAX_BYTES) throw new HttpError(413, 'Attachment is larger than 10 MB', 'too_large')
    chunks.push(part)
  }
  return Buffer.concat(chunks)
}

function isValidFile(bytes: Buffer, mime: string): boolean {
  if (mime === 'application/pdf') return bytes.subarray(0, 5).toString() === '%PDF-'
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (mime === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  return false
}

export default handler(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  assertCsrf(req)
  await requireAccess(ctx, 'approvals', 'write')
  const uploadId = readHeader(req, 'x-upload-id') ?? ''
  if (!/^[a-f\d-]{36}$/i.test(uploadId)) throw new HttpError(400, 'Invalid upload ID', 'validation')
  const mime = readHeader(req, 'content-type')?.split(';')[0].trim().toLowerCase() ?? ''
  const ext = MIME_EXT[mime]
  if (!ext) throw new HttpError(415, 'Only PDF, JPEG and PNG files are accepted', 'file_type')
  let filename = ''
  try { filename = decodeURIComponent(readHeader(req, 'x-file-name') ?? '') } catch { throw new HttpError(400, 'Invalid file name', 'validation') }
  filename = filename.replace(/[\\/\r\n\0]/g, '_').trim().slice(0, 120) || `attachment.${ext}`
  const bytes = await bodyBuffer(req)
  if (!bytes.length || bytes.length > MAX_BYTES) throw new HttpError(413, 'Attachment must be between 1 byte and 10 MB', 'too_large')
  if (!isValidFile(bytes, mime)) throw new HttpError(415, 'File contents do not match the declared type', 'file_type')

  const bucket = process.env.APPWRITE_BUCKET_ATTACHMENTS
  if (!bucket) throw new HttpError(500, 'Attachment storage is not configured', 'misconfigured')
  const storage = new Storage(adminClient())
  const storedName = `${ctx.userId}--${filename}`
  try {
    await storage.createFile(bucket, uploadId, InputFile.fromBuffer(bytes, storedName), [])
  } catch (e) {
    if ((e as { code?: number })?.code !== 409) throw e
    const existing = await storage.getFile(bucket, uploadId)
    if (!String(existing.name).startsWith(`${ctx.userId}--`)) throw new HttpError(409, 'Upload ID already belongs to another user', 'conflict')
  }
  send(res, 200, { file_id: uploadId })
})

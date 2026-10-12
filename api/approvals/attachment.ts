import { Storage } from 'node-appwrite'
import { adminClient } from '../_lib/appwrite'
import { requireVisibleApproval, queryParams } from '../_lib/approvalsAccess'
import { authenticate } from '../_lib/auth'
import { handler, HttpError } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'

export default handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  const scope = await requireAccess(ctx, 'approvals', 'read')
  const { approval_id, file_id } = queryParams(req.url)
  if (!approval_id || !file_id) throw new HttpError(400, 'Approval and attachment are required', 'validation')
  const approval = await requireVisibleApproval(ctx, scope, approval_id)
  if (!(approval.attachment_ids ?? []).includes(file_id)) throw new HttpError(404, 'Attachment not found', 'not_found')
  const bucket = process.env.APPWRITE_BUCKET_ATTACHMENTS
  if (!bucket) throw new HttpError(500, 'Attachment storage is not configured', 'misconfigured')
  const storage = new Storage(adminClient())
  const file = await storage.getFile(bucket, file_id)
  const bytes = await storage.getFileView(bucket, file_id)
  const storedName = String(file.name)
  const prefix = `${ctx.userId}--`
  const name = (storedName.startsWith(prefix) ? storedName.slice(prefix.length) : storedName).replace(/[\r\n"\\]/g, '_')
  res.statusCode = 200
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream')
  res.setHeader('Content-Disposition', `inline; filename="${name}"`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.end(Buffer.from(bytes))
})

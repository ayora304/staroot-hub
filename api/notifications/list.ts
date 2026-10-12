import { authenticate } from '../_lib/auth'
import { handler, HttpError, send } from '../_lib/http'
import { listNotifications } from '../_lib/approvalsRepo'
import { requireAccess } from '../_lib/rbac'

// GET /api/notifications/list -> the signed-in user's inbox (newest first, max 50)
export default handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  await requireAccess(ctx, 'notifications', 'read')
  const docs = await listNotifications(ctx.userId)
  send(res, 200, {
    unread: docs.filter((d) => !d.read).length,
    items: docs.map((d) => ({ id: d.$id, type: d.type, title: d.title, body: d.body ?? '', link: d.link ?? '', read: d.read, created_at: d.$createdAt })),
  })
})

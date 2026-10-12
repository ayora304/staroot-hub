import { assertCsrf, authenticate } from '../_lib/auth'
import { getNotification, listNotifications, markNotificationRead } from '../_lib/approvalsRepo'
import { readNotificationsSchema } from '../_lib/approvalsSchemas'
import { handler, HttpError, readJson, send } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'

// POST /api/notifications/read  { ids: [...] } or { all: true }. Users can only mark their own.
export default handler(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  assertCsrf(req)
  await requireAccess(ctx, 'notifications', 'write')
  const input = readNotificationsSchema.parse(await readJson(req))

  let ids = input.ids ?? []
  if (input.all) ids = (await listNotifications(ctx.userId, true)).map((d) => d.$id)
  let marked = 0
  for (const id of ids) {
    const doc = await getNotification(id)
    if (doc && doc.user_id === ctx.userId && !doc.read) {
      await markNotificationRead(id)
      marked += 1
    }
  }
  send(res, 200, { marked })
})

import { handler, HttpError, send } from '../_lib/http'
import { authenticate } from '../_lib/auth'
import { getVapidPublicKey } from '../_lib/push'
import { requireAccess } from '../_lib/rbac'

export default handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  await requireAccess(ctx, 'notifications', 'read')
  send(res, 200, { publicKey: getVapidPublicKey() })
})

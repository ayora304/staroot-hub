import { listProjects } from '../_lib/siteRepo'
import { authenticate } from '../_lib/auth'
import { handler, HttpError, send } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'

export default handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  await requireAccess(ctx, 'site', 'read')
  send(res, 200, { items: await listProjects() })
})

import { getProject, listContractors } from '../_lib/siteRepo'
import { authenticate } from '../_lib/auth'
import { handler, HttpError, send } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'

export default handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  await requireAccess(ctx, 'site', 'read')
  const projectId = new URL(req.url ?? '/', 'http://local').searchParams.get('project_id')
  if (!projectId) throw new HttpError(400, 'Choose a project', 'validation')
  if (!await getProject(projectId)) throw new HttpError(404, 'Project not found', 'not_found')
  send(res, 200, { items: await listContractors(projectId) })
})

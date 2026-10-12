import { canDecide, canResubmit } from '../../src/modules/approvals/domain/stateMachine'
import { canUseModule } from '../../src/core/rbac/permissions'
import { actorOf, queryParams, requireVisibleApproval } from '../_lib/approvalsAccess'
import { listEvents } from '../_lib/approvalsRepo'
import { detailQuerySchema } from '../_lib/approvalsSchemas'
import { listPermissions } from '../_lib/appwrite'
import { authenticate } from '../_lib/auth'
import { handler, HttpError, send } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'

// GET /api/approvals/detail?id=...  -> the request, its audit trail, and what this user may do next
export default handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  const scope = await requireAccess(ctx, 'approvals', 'read')
  const { id } = detailQuerySchema.parse(queryParams(req.url))

  const approval = await requireVisibleApproval(ctx, scope, id)
  const events = await listEvents(approval.$id)
  const actor = actorOf(ctx)
  const mayApprove = canUseModule(await listPermissions(), ctx.profile, 'approvals', 'approve')

  send(res, 200, {
    approval,
    events,
    canDecide: mayApprove && canDecide(approval, actor).ok,
    canResubmit: canResubmit(approval, actor).ok,
  })
})

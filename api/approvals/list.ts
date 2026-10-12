import { Query } from 'node-appwrite'
import { canDecide } from '../../src/modules/approvals/domain/stateMachine'
import { actorOf, isVisible, queryParams } from '../_lib/approvalsAccess'
import { listApprovals } from '../_lib/approvalsRepo'
import { listQuerySchema } from '../_lib/approvalsSchemas'
import { authenticate } from '../_lib/auth'
import { handler, HttpError, send } from '../_lib/http'
import { requireAccess } from '../_lib/rbac'

// GET /api/approvals/list?tab=pending_mine|mine|approved|rejected  (newest first, max 100)
export default handler(async (req, res) => {
  if (req.method !== 'GET') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  const scope = await requireAccess(ctx, 'approvals', 'read')
  const { tab } = listQuerySchema.parse(queryParams(req.url))
  const actor = actorOf(ctx)

  const queries = tab === 'mine' ? [Query.equal('requestor_id', [ctx.userId])] : [Query.equal('status', [tab === 'pending_mine' ? 'pending' : tab])]
  let items = (await listApprovals(queries)).filter((a) => isVisible(scope, ctx, a))
  if (tab === 'pending_mine') items = items.filter((a) => canDecide(a, actor).ok)

  send(res, 200, {
    items: items.map((a) => ({
      id: a.$id,
      title: a.title,
      category: a.category,
      amount: a.amount ?? null,
      currency: a.currency ?? null,
      status: a.status,
      requestor_email: a.requestor_email,
      department: a.department,
      assigned_role: a.assigned_role ?? null,
      version: a.version,
      created_at: a.$createdAt,
    })),
  })
})

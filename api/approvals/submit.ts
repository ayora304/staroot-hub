import { routeApproval } from '../../src/modules/approvals/domain/routing'
import { AMOUNT_CATEGORIES, DEFAULT_CURRENCY } from '../../src/modules/approvals/types'
import { appendEvent, assertAttachmentsOwned, createApproval, findApprovalByClientId, isConflict, listEvents, listRules } from '../_lib/approvalsRepo'
import { submitSchema } from '../_lib/approvalsSchemas'
import { assertCsrf, authenticate, type AuthContext } from '../_lib/auth'
import { handler, HttpError, readJson, send } from '../_lib/http'
import { approversFor, notifyUsers } from '../_lib/notify'
import { requireAccess } from '../_lib/rbac'
import type { Approval } from '../../src/modules/approvals/types'

async function submittedEvent(ctx: AuthContext, a: Approval) {
  try {
    await appendEvent({ approval_id: a.$id, seq: 1, action: 'submitted', actor_id: ctx.userId, actor_role: ctx.profile.role, to_status: 'pending' })
  } catch (e) {
    if (!isConflict(e)) throw e // seq 1 already written by an earlier attempt
  }
}

// POST /api/approvals/submit. Idempotent on client_id: a retry returns the same record with 200.
export default handler(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  assertCsrf(req)
  await requireAccess(ctx, 'approvals', 'write')
  const input = submitSchema.parse(await readJson(req))

  const existing = await findApprovalByClientId(input.client_id)
  if (existing) {
    if (existing.requestor_id !== ctx.userId) throw new HttpError(409, 'Request ID already used', 'conflict')
    if ((await listEvents(existing.$id)).length === 0) await submittedEvent(ctx, existing) // repair an interrupted first attempt
    return send(res, 200, { approval: existing })
  }

  const amount = AMOUNT_CATEGORIES.includes(input.category) ? input.amount : undefined
  const currency = input.currency ?? DEFAULT_CURRENCY
  const routed = routeApproval(await listRules(), { category: input.category, amount, currency })
  if (!routed.ok) {
    throw new HttpError(422, 'No approval rule covers this request. Ask an administrator to add one.', 'no_routing_rule')
  }
  await assertAttachmentsOwned(ctx.userId, input.attachment_ids ?? [])

  // Everything below comes from the server: the client never chooses requestor, department, status or assignee.
  let approval: Approval
  try {
    approval = await createApproval({
      client_id: input.client_id,
      requestor_id: ctx.userId,
      requestor_email: ctx.email,
      department: ctx.profile.department,
      category: input.category,
      title: input.title,
      details: input.details,
      ...(amount !== undefined ? { amount } : {}),
      currency,
      attachment_ids: input.attachment_ids ?? [],
      status: 'pending',
      assigned_role: routed.approverRole,
      rule_id: routed.rule.$id ?? '',
      version: 1,
    })
  } catch (e) {
    if (!isConflict(e)) throw e
    const again = await findApprovalByClientId(input.client_id) // lost a race with our own retry
    if (again && again.requestor_id === ctx.userId) return send(res, 200, { approval: again })
    throw new HttpError(409, 'Request ID already used', 'conflict')
  }

  await submittedEvent(ctx, approval)
  await notifyUsers(await approversFor(approval), {
    type: 'approval_requested',
    title: 'Approval needed',
    body: `${approval.title} from ${approval.requestor_email}`,
    link: `/m/approvals/${approval.$id}`,
    source_id: approval.$id,
  })
  send(res, 200, { approval })
})

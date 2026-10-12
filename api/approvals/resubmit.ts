import { findReplay } from '../../src/modules/approvals/domain/audit'
import { routeApproval } from '../../src/modules/approvals/domain/routing'
import { canResubmit } from '../../src/modules/approvals/domain/stateMachine'
import { AMOUNT_CATEGORIES, DEFAULT_CURRENCY } from '../../src/modules/approvals/types'
import { requireVisibleApproval } from '../_lib/approvalsAccess'
import { appendEvent, isConflict, listEvents, listRules, updateApproval } from '../_lib/approvalsRepo'
import { resubmitSchema } from '../_lib/approvalsSchemas'
import { assertCsrf, authenticate } from '../_lib/auth'
import { handler, HttpError, readJson, send } from '../_lib/http'
import { approversFor, notifyUsers } from '../_lib/notify'
import { requireAccess } from '../_lib/rbac'

const CONFLICT_MSG = 'This request changed since you opened it. Refresh and review it again.'

// POST /api/approvals/resubmit. The requestor edits a request that was sent back; it is re-routed on the new amount.
export default handler(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  assertCsrf(req)
  const scope = await requireAccess(ctx, 'approvals', 'write')
  const input = resubmitSchema.parse(await readJson(req))

  const approval = await requireVisibleApproval(ctx, scope, input.approval_id)
  const events = await listEvents(approval.$id)
  const replay = findReplay(events, { baseVersion: input.base_version, actorId: ctx.userId, eventAction: 'resubmitted' })

  const amount = AMOUNT_CATEGORIES.includes(approval.category) ? input.amount : undefined
  if (AMOUNT_CATEGORIES.includes(approval.category) && !(amount && amount > 0)) {
    throw new HttpError(400, 'An amount greater than zero is required', 'validation')
  }
  const currency = input.currency ?? approval.currency ?? DEFAULT_CURRENCY
  const routed = routeApproval(await listRules(), { category: approval.category, amount, currency })
  if (!routed.ok) throw new HttpError(422, 'No approval rule covers this request. Ask an administrator to add one.', 'no_routing_rule')

  const fields = (version: number) => ({
    title: input.title,
    details: input.details,
    ...(amount !== undefined ? { amount } : {}),
    currency,
    status: 'pending',
    assigned_role: routed.approverRole,
    rule_id: routed.rule.$id ?? '',
    version,
    decided_at: null,
  })

  if (replay.kind === 'replay') {
    if (approval.version === input.base_version) return send(res, 200, { approval: await updateApproval(approval.$id, fields(replay.event.seq)), replay: true })
    return send(res, 200, { approval, replay: true })
  }
  if (replay.kind === 'conflict' || approval.version !== input.base_version) throw new HttpError(409, CONFLICT_MSG, 'conflict')

  const gate = canResubmit(approval, { userId: ctx.userId })
  if (!gate.ok) throw new HttpError(gate.status, gate.message, gate.status === 409 ? 'conflict' : 'forbidden')

  const seq = approval.version + 1
  try {
    await appendEvent({
      approval_id: approval.$id,
      seq,
      action: 'resubmitted',
      actor_id: ctx.userId,
      actor_role: ctx.profile.role,
      from_status: approval.status,
      to_status: 'pending',
    })
  } catch (e) {
    if (isConflict(e)) throw new HttpError(409, CONFLICT_MSG, 'conflict')
    throw e
  }
  const updated = await updateApproval(approval.$id, fields(seq))
  await notifyUsers(await approversFor(updated), {
    type: 'approval_requested',
    title: 'Approval needed (resubmitted)',
    body: `${updated.title} from ${updated.requestor_email}`,
    link: `/m/approvals/${updated.$id}`,
    source_id: updated.$id,
  })
  send(res, 200, { approval: updated })
})

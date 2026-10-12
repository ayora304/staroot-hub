import { findReplay } from '../../src/modules/approvals/domain/audit'
import { decide, eventActionFor } from '../../src/modules/approvals/domain/stateMachine'
import { actorOf, requireVisibleApproval } from '../_lib/approvalsAccess'
import { appendEvent, isConflict, listEvents, updateApproval } from '../_lib/approvalsRepo'
import { decideSchema } from '../_lib/approvalsSchemas'
import { assertCsrf, authenticate } from '../_lib/auth'
import { handler, HttpError, readJson, send } from '../_lib/http'
import { notifyUsers } from '../_lib/notify'
import { requireAccess } from '../_lib/rbac'

const CONFLICT_MSG = 'This request changed since you opened it. Refresh and review it again.'

// POST /api/approvals/decide. Idempotent: a retried decision finds its own event (seq = base + 1) and returns 200.
export default handler(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  assertCsrf(req)
  const scope = await requireAccess(ctx, 'approvals', 'approve')
  const input = decideSchema.parse(await readJson(req))

  const approval = await requireVisibleApproval(ctx, scope, input.approval_id)
  const events = await listEvents(approval.$id)
  const replay = findReplay(events, { baseVersion: input.base_version, actorId: ctx.userId, eventAction: eventActionFor(input.action) })

  if (replay.kind === 'replay') {
    // The event exists. If the approval row was never updated (interrupted write), finish that update now.
    if (approval.version === input.base_version) {
      const fixed = await updateApproval(approval.$id, {
        status: replay.event.to_status,
        assigned_role: null,
        version: replay.event.seq,
        decided_at: new Date().toISOString(),
      })
      return send(res, 200, { approval: fixed, replay: true })
    }
    return send(res, 200, { approval, replay: true })
  }
  if (replay.kind === 'conflict' || approval.version !== input.base_version) throw new HttpError(409, CONFLICT_MSG, 'conflict')

  const verdict = decide(approval, actorOf(ctx), input.action, input.comment)
  if (!verdict.ok) {
    const code = verdict.status === 409 ? 'conflict' : verdict.status === 400 ? 'validation' : 'forbidden'
    throw new HttpError(verdict.status, verdict.message, code)
  }

  // Event first: the unique (approval_id, seq) index is what stops two people deciding at once.
  const seq = approval.version + 1
  try {
    await appendEvent({
      approval_id: approval.$id,
      seq,
      action: verdict.eventAction,
      actor_id: ctx.userId,
      actor_role: ctx.profile.role,
      from_status: approval.status,
      to_status: verdict.toStatus,
      ...(verdict.comment ? { comment: verdict.comment } : {}),
    })
  } catch (e) {
    if (isConflict(e)) throw new HttpError(409, CONFLICT_MSG, 'conflict')
    throw e
  }
  const updated = await updateApproval(approval.$id, {
    status: verdict.toStatus,
    assigned_role: null,
    version: seq,
    decided_at: new Date().toISOString(),
  })

  const verb = { approved: 'approved', rejected: 'rejected', revision_requested: 'sent back for revision' }[verdict.toStatus as 'approved' | 'rejected' | 'revision_requested']
  await notifyUsers([approval.requestor_id], {
    type: `approval_${verdict.toStatus}`,
    title: `Request ${verb}`,
    body: verdict.comment ? `${approval.title}: ${verdict.comment}` : approval.title,
    link: `/m/approvals/${approval.$id}`,
    source_id: approval.$id,
  })
  send(res, 200, { approval: updated })
})

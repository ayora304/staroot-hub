// Pure workflow rules: who may decide, and what each decision does.
import type { Department, Role } from '../../../core/rbac/roles'
import type { Approval, ApprovalStatus, DecisionAction, EventAction } from '../types'

export interface DecisionActor {
  userId: string
  role: Role
  department: Department
}
export type EligibilityTarget = Pick<Approval, 'assigned_role' | 'requestor_id' | 'department'>

export type DenialCode = 'not_pending' | 'self_approval' | 'not_assignee' | 'comment_required' | 'not_requestor' | 'not_revision'
export interface Denial {
  ok: false
  code: DenialCode
  status: 400 | 403 | 409
  message: string
}
const deny = (code: DenialCode, status: Denial['status'], message: string): Denial => ({ ok: false, code, status, message })

/**
 * Executives may decide anything. Managers may decide only manager-routed requests from their own
 * department. Nobody may decide their own request.
 */
export function isEligibleApprover(a: EligibilityTarget, actor: DecisionActor): boolean {
  if (actor.userId === a.requestor_id) return false
  if (actor.role === 'executive') return true
  return actor.role === 'manager' && a.assigned_role === 'manager' && actor.department === a.department
}

export function canDecide(a: EligibilityTarget & Pick<Approval, 'status'>, actor: DecisionActor): { ok: true } | Denial {
  if (a.status !== 'pending') return deny('not_pending', 409, 'This request is no longer pending.')
  if (actor.userId === a.requestor_id) return deny('self_approval', 403, 'You cannot decide your own request.')
  if (!isEligibleApprover(a, actor)) return deny('not_assignee', 403, 'This request is not assigned to you.')
  return { ok: true }
}

const OUTCOME: Record<DecisionAction, { toStatus: ApprovalStatus; eventAction: EventAction; needsComment: boolean }> = {
  approve: { toStatus: 'approved', eventAction: 'approved', needsComment: false },
  reject: { toStatus: 'rejected', eventAction: 'rejected', needsComment: true },
  request_revision: { toStatus: 'revision_requested', eventAction: 'revision_requested', needsComment: true },
}

export function eventActionFor(action: DecisionAction): EventAction {
  return OUTCOME[action].eventAction
}

export type Verdict = { ok: true; toStatus: ApprovalStatus; eventAction: EventAction; comment?: string } | Denial

export function decide(
  a: EligibilityTarget & Pick<Approval, 'status'>,
  actor: DecisionActor,
  action: DecisionAction,
  comment?: string,
): Verdict {
  const gate = canDecide(a, actor)
  if (!gate.ok) return gate
  const o = OUTCOME[action]
  const text = comment?.trim()
  if (o.needsComment && !text) return deny('comment_required', 400, 'A comment is required for this action.')
  return { ok: true, toStatus: o.toStatus, eventAction: o.eventAction, ...(text ? { comment: text } : {}) }
}

/** Only the original requestor may resubmit, and only after a revision was requested. */
export function canResubmit(a: Pick<Approval, 'status' | 'requestor_id'>, actor: Pick<DecisionActor, 'userId'>): { ok: true } | Denial {
  if (actor.userId !== a.requestor_id) return deny('not_requestor', 403, 'Only the requestor can resubmit.')
  if (a.status !== 'revision_requested') return deny('not_revision', 409, 'This request is not waiting for a revision.')
  return { ok: true }
}

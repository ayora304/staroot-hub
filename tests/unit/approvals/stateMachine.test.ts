import { describe, expect, it } from 'vitest'
import { canDecide, canResubmit, decide, eventActionFor, isEligibleApprover, type DecisionActor } from '../../../src/modules/approvals/domain/stateMachine'
import type { Approval } from '../../../src/modules/approvals/types'

type Target = Pick<Approval, 'status' | 'assigned_role' | 'requestor_id' | 'department'>
const pending = (o: Partial<Target> = {}): Target => ({ status: 'pending', assigned_role: 'manager', requestor_id: 'req', department: 'sales', ...o })
const actor = (o: Partial<DecisionActor> = {}): DecisionActor => ({ userId: 'mgr', role: 'manager', department: 'sales', ...o })
const code = (v: { ok: boolean; code?: string }) => (v.ok ? 'ok' : v.code)

describe('who may decide', () => {
  it('a manager of the same department can decide a manager-routed request', () => {
    expect(isEligibleApprover(pending(), actor())).toBe(true)
  })
  it('a manager of another department cannot', () => {
    expect(isEligibleApprover(pending(), actor({ department: 'marketing' }))).toBe(false)
  })
  it('a manager cannot decide an executive-routed request', () => {
    expect(isEligibleApprover(pending({ assigned_role: 'executive' }), actor())).toBe(false)
  })
  it('an executive can decide manager-routed and executive-routed requests', () => {
    const ceo = actor({ userId: 'ceo', role: 'executive', department: 'executive' })
    expect(isEligibleApprover(pending(), ceo)).toBe(true)
    expect(isEligibleApprover(pending({ assigned_role: 'executive' }), ceo)).toBe(true)
  })
  it('other roles can never decide', () => {
    for (const role of ['sales_marketing', 'ops_frontoffice', 'site_engineer'] as const) {
      expect(isEligibleApprover(pending(), actor({ role }))).toBe(false)
    }
  })
  it('nobody can decide their own request, including executives', () => {
    expect(code(canDecide(pending({ requestor_id: 'mgr' }), actor()))).toBe('self_approval')
    expect(code(canDecide(pending({ requestor_id: 'ceo' }), actor({ userId: 'ceo', role: 'executive' })))).toBe('self_approval')
  })
})

describe('decisions', () => {
  it('approve needs no comment', () => {
    const v = decide(pending(), actor(), 'approve')
    expect(v.ok && v.toStatus).toBe('approved')
    expect(v.ok && v.eventAction).toBe('approved')
  })
  it('reject and request_revision require a comment', () => {
    expect(code(decide(pending(), actor(), 'reject'))).toBe('comment_required')
    expect(code(decide(pending(), actor(), 'reject', '   '))).toBe('comment_required')
    expect(code(decide(pending(), actor(), 'request_revision'))).toBe('comment_required')
  })
  it('reject and request_revision with a comment succeed and trim it', () => {
    const r = decide(pending(), actor(), 'reject', '  over budget ')
    expect(r.ok && r.toStatus).toBe('rejected')
    expect(r.ok && r.comment).toBe('over budget')
    const q = decide(pending(), actor(), 'request_revision', 'attach the quote')
    expect(q.ok && q.toStatus).toBe('revision_requested')
  })
  it('non-pending requests cannot be decided again', () => {
    for (const status of ['approved', 'rejected', 'revision_requested'] as const) {
      expect(code(decide(pending({ status }), actor(), 'approve'))).toBe('not_pending')
    }
  })
  it('maps actions to event actions', () => {
    expect(eventActionFor('approve')).toBe('approved')
    expect(eventActionFor('reject')).toBe('rejected')
    expect(eventActionFor('request_revision')).toBe('revision_requested')
  })
})

describe('resubmit', () => {
  it('only the requestor, only after a revision was requested', () => {
    expect(code(canResubmit({ status: 'revision_requested', requestor_id: 'req' }, { userId: 'req' }))).toBe('ok')
    expect(code(canResubmit({ status: 'revision_requested', requestor_id: 'req' }, { userId: 'x' }))).toBe('not_requestor')
    expect(code(canResubmit({ status: 'pending', requestor_id: 'req' }, { userId: 'req' }))).toBe('not_revision')
    expect(code(canResubmit({ status: 'rejected', requestor_id: 'req' }, { userId: 'req' }))).toBe('not_revision')
  })
})

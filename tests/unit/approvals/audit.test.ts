import { describe, expect, it } from 'vitest'
import { findReplay } from '../../../src/modules/approvals/domain/audit'

const ev = (seq: number, actor_id: string, action: 'approved' | 'rejected' | 'submitted') => ({ seq, actor_id, action })

describe('findReplay', () => {
  const events = [ev(1, 'req', 'submitted'), ev(2, 'mgr', 'approved')]
  it('no event at base+1 means this is a fresh action', () => {
    expect(findReplay(events, { baseVersion: 2, actorId: 'mgr', eventAction: 'approved' }).kind).toBe('none')
  })
  it('same actor and action at base+1 is a replay and returns the event', () => {
    const r = findReplay(events, { baseVersion: 1, actorId: 'mgr', eventAction: 'approved' })
    expect(r.kind).toBe('replay')
    expect(r.kind === 'replay' && r.event.seq).toBe(2)
  })
  it('another actor at base+1 is a conflict (someone else decided first)', () => {
    expect(findReplay(events, { baseVersion: 1, actorId: 'ceo', eventAction: 'approved' }).kind).toBe('conflict')
  })
  it('same actor but a different action at base+1 is a conflict', () => {
    expect(findReplay(events, { baseVersion: 1, actorId: 'mgr', eventAction: 'rejected' }).kind).toBe('conflict')
  })
  it('works on an empty history', () => {
    expect(findReplay([], { baseVersion: 1, actorId: 'mgr', eventAction: 'approved' }).kind).toBe('none')
  })
})

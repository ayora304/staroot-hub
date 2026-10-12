// Replay detection. Events are append-only with a unique (approval_id, seq), and every transition
// uses seq = previous version + 1. A retried action therefore finds its own event already present.
import type { ApprovalEvent, EventAction } from '../types'

export type ReplayCheck<T> = { kind: 'none' } | { kind: 'conflict' } | { kind: 'replay'; event: T }

export function findReplay<T extends Pick<ApprovalEvent, 'seq' | 'actor_id' | 'action'>>(
  events: T[],
  q: { baseVersion: number; actorId: string; eventAction: EventAction },
): ReplayCheck<T> {
  const event = events.find((e) => e.seq === q.baseVersion + 1)
  if (!event) return { kind: 'none' }
  if (event.actor_id === q.actorId && event.action === q.eventAction) return { kind: 'replay', event }
  return { kind: 'conflict' }
}

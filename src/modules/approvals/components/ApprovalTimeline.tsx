import { ROLE_LABELS, type Role } from '../../../core/rbac/roles'
import { EVENT_LABELS, type ApprovalEvent } from '../types'
import { formatWhen } from './format'

export function ApprovalTimeline({ events }: { events: ApprovalEvent[] }) {
  if (!events.length) return <p className="text-sm text-muted">No history yet.</p>
  return (
    <ol className="space-y-4 border-l border-border pl-4" aria-label="History">
      {events.map((e) => (
        <li key={e.$id} className="relative">
          <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-accent" aria-hidden="true" />
          <p className="text-sm font-medium text-text">{EVENT_LABELS[e.action]}</p>
          <p className="text-xs text-muted">
            {ROLE_LABELS[e.actor_role as Role] ?? e.actor_role} · {formatWhen(e.$createdAt)}
          </p>
          {e.comment && <p className="mt-1 rounded-xl bg-surface-2 p-2 text-sm text-text">{e.comment}</p>}
        </li>
      ))}
    </ol>
  )
}

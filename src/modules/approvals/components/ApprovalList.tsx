import { Link } from 'react-router-dom'
import { StatusPill } from '../../../core/ui/StatusPill'
import type { ApprovalSummary } from '../services/approvals.service'
import { CATEGORY_LABELS, STATUS_LABELS, type ApprovalStatus } from '../types'
import { formatMoney, formatWhen } from './format'

export const STATUS_TONE: Record<ApprovalStatus, 'warning' | 'success' | 'danger' | 'accent'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  revision_requested: 'accent',
}

export function ApprovalList({ items }: { items: ApprovalSummary[] }) {
  return (
    <ul className="space-y-3" aria-label="Requests">
      {items.map((a) => (
        <li key={a.id}>
          {(() => {
            const card = <>
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-text">{a.title}</p>
                <StatusPill tone={STATUS_TONE[a.status]}>{STATUS_LABELS[a.status]}</StatusPill>
              </div>
              <p className="mt-1 text-sm text-muted">
                {CATEGORY_LABELS[a.category]}
                {a.amount != null && ` · ${formatMoney(a.amount, a.currency)}`}
              </p>
              <p className="mt-1 text-xs text-muted">{a.requestor_email} · {formatWhen(a.created_at)}</p>
              {a.local_status && <p className="mt-2 text-xs font-medium text-accent">Saved on this device · {a.local_status.replace('_', ' ')}</p>}
            </>
            return a.local_status
              ? <div className="rounded-2xl border border-accent/40 bg-surface p-4">{card}</div>
              : <Link to={`/m/approvals/${a.id}`} className="block rounded-2xl border border-border bg-surface p-4 focus-visible:outline-2 focus-visible:outline-accent">{card}</Link>
          })()}
        </li>
      ))}
    </ul>
  )
}

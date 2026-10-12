import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../core/ui/Button'
import { useSession } from '../../../core/auth/useSession'
import { EmptyState } from '../../../core/ui/EmptyState'
import { Skeleton } from '../../../core/ui/Skeleton'
import { StatusPill } from '../../../core/ui/StatusPill'
import { useApprovalDetail } from '../hooks/use-approvals'
import { queueDecision, queueResubmit } from '../services/approvals.service'
import { AMOUNT_CATEGORIES, CATEGORY_LABELS, STATUS_LABELS, type Approval, type DecisionAction } from '../types'
import { ApprovalTimeline } from './ApprovalTimeline'
import { STATUS_TONE } from './ApprovalList'
import { formatMoney, formatWhen } from './format'
import { env } from '../../../core/config/env'
import { ENDPOINTS } from '../../../core/api/endpoints'

const field = 'w-full rounded-xl border border-border bg-surface px-4 py-3 text-text focus-visible:outline-2 focus-visible:outline-accent'

function DecisionBar({ a }: { a: Approval }) {
  const { session } = useSession()
  const navigate = useNavigate()
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function act(action: DecisionAction) {
    if (action !== 'approve' && !comment.trim()) return setError('Add a comment explaining your decision.')
    setBusy(true)
    setError(null)
    try {
      if (!session) throw new Error('Sign in to save this decision.')
      await queueDecision({ approval_id: a.$id, base_version: a.version, action, ...(comment.trim() ? { comment: comment.trim() } : {}) }, session.user.id)
      navigate('/m/approvals', { replace: true, state: { queued: true } })
    } catch {
      setError('Could not save your decision on this device.')
      setBusy(false)
    }
  }

  return (
    <section aria-label="Decision" className="space-y-3 rounded-2xl border border-border bg-surface p-4">
      <label className="block space-y-1.5">
        <span className="text-sm text-muted">Comment (required to reject or request a revision)</span>
        <textarea className={`${field} min-h-24`} value={comment} maxLength={1000} onChange={(e) => setComment(e.target.value)} />
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="grid gap-2">
        <Button loading={busy} onClick={() => void act('approve')}>Approve</Button>
        <Button variant="secondary" disabled={busy} onClick={() => void act('request_revision')}>Request revision</Button>
        <Button variant="secondary" disabled={busy} className="text-danger" onClick={() => void act('reject')}>Reject</Button>
      </div>
    </section>
  )
}

function ResubmitPanel({ a }: { a: Approval }) {
  const { session } = useSession()
  const navigate = useNavigate()
  const needsAmount = AMOUNT_CATEGORIES.includes(a.category)
  const [title, setTitle] = useState(a.title)
  const [details, setDetails] = useState(a.details)
  const [amount, setAmount] = useState(a.amount != null ? String(a.amount) : '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    const n = Number(amount)
    if (title.trim().length < 3 || !details.trim()) return setError('Title and details are required.')
    if (needsAmount && !(n > 0)) return setError('Enter an amount greater than zero.')
    setBusy(true)
    try {
      if (!session) throw new Error('Sign in to save this request.')
      await queueResubmit({ approval_id: a.$id, base_version: a.version, title: title.trim(), details: details.trim(), category: a.category, ...(needsAmount ? { amount: n, currency: a.currency ?? 'KES' } : {}) }, session.user.id)
      navigate('/m/approvals', { replace: true, state: { queued: true } })
    } catch {
      setError('Could not save on this device.')
      setBusy(false)
    }
  }

  return (
    <section aria-label="Edit and resubmit" className="space-y-3 rounded-2xl border border-accent/50 bg-surface p-4">
      <h2 className="font-semibold text-text">Edit and resubmit</h2>
      <input className={field} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} aria-label="Title" />
      {needsAmount && <input className={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} aria-label="Amount" />}
      <textarea className={`${field} min-h-28`} value={details} maxLength={1800} onChange={(e) => setDetails(e.target.value)} aria-label="Details" />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button loading={busy} className="w-full" onClick={() => void submit()}>Resubmit</Button>
    </section>
  )
}

export function RequestDetail({ id }: { id: string }) {
  const { data, loading, error, offline, reload } = useApprovalDetail(id)

  if (loading) return <div className="mx-auto max-w-xl space-y-3 p-4 pt-safe"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-32" /><Skeleton className="h-24" /></div>
  if (offline) return <EmptyState title="You are offline" body="Open this request again when you are connected." action={<Button variant="secondary" onClick={reload}>Try again</Button>} />
  if (error || !data) return <EmptyState title="Could not open this request" body={error ?? undefined} action={<Link to="/m/approvals" className="text-sm text-accent">Back to requests</Link>} />

  const { approval: a, events, canDecide, canResubmit } = data
  return (
    <div className="mx-auto max-w-xl space-y-5 p-4 pt-safe pb-safe">
      <Link to="/m/approvals" className="text-sm text-muted">← Back</Link>
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-text">{a.title}</h1>
          <StatusPill tone={STATUS_TONE[a.status]}>{STATUS_LABELS[a.status]}</StatusPill>
        </div>
        <p className="text-sm text-muted">
          {CATEGORY_LABELS[a.category]}{a.amount != null && ` · ${formatMoney(a.amount, a.currency)}`}
        </p>
        <p className="text-xs text-muted">{a.requestor_email} · {a.department} · {formatWhen(a.$createdAt)}</p>
      </header>
      <p className="whitespace-pre-wrap rounded-2xl border border-border bg-surface p-4 text-text">{a.details}</p>
      {(a.attachment_ids?.length ?? 0) > 0 && <section aria-label="Attachments" className="space-y-2 rounded-2xl border border-border bg-surface p-4">
        <h2 className="font-medium text-text">Attachments</h2>
        {a.attachment_ids?.map((fileId, index) => <a key={fileId} className="block min-h-11 text-sm text-accent underline" href={`${env.apiBase}${ENDPOINTS.approvalsAttachment}?approval_id=${encodeURIComponent(a.$id)}&file_id=${encodeURIComponent(fileId)}`} target="_blank" rel="noreferrer">Open attachment {index + 1}</a>)}
      </section>}
      {canDecide && <DecisionBar a={a} />}
      {canResubmit && <ResubmitPanel a={a} />}
      <section aria-label="History" className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted">History</h2>
        <ApprovalTimeline events={events} />
      </section>
    </div>
  )
}

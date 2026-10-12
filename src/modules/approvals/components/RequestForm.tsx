import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../../../core/ui/Button'
import { queueSubmit } from '../services/approvals.service'
import { AMOUNT_CATEGORIES, CATEGORIES, CATEGORY_LABELS, DEFAULT_CURRENCY, type Category } from '../types'

const field = 'w-full min-h-12 rounded-xl border border-border bg-surface px-4 text-text placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent'

export function RequestForm() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category>('petty_cash')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [details, setDetails] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const needsAmount = AMOUNT_CATEGORIES.includes(category)
  const isLeave = category === 'leave'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const n = Number(amount)
    if (title.trim().length < 3) return setError('Give the request a short title (at least 3 characters).')
    if (needsAmount && !(n > 0)) return setError('Enter an amount greater than zero.')
    if (isLeave && (!from || !to || to < from)) return setError('Choose a start date and an end date that is not before it.')
    if (!isLeave && !details.trim()) return setError('Describe the request.')

    // Leave dates are folded into the description for now (no structured date fields yet).
    const body = isLeave ? `Leave from ${from} to ${to}.${details.trim() ? ' ' + details.trim() : ''}` : details.trim()
    setBusy(true)
    try {
      await queueSubmit({ category, title: title.trim(), details: body, ...(needsAmount ? { amount: n, currency: DEFAULT_CURRENCY } : {}) })
      navigate('/m/approvals', { replace: true, state: { queued: true } })
    } catch {
      setError('Could not save the request on this device. Free up space and try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4 p-4 pt-safe pb-safe" aria-label="New request">
      <Link to="/m/approvals" className="text-sm text-muted">← Back</Link>
      <h1 className="text-2xl font-semibold text-text">New request</h1>

      <label className="block space-y-1.5">
        <span className="text-sm text-muted">Category</span>
        <select className={field} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-muted">Title</span>
        <input className={field} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
      </label>
      {needsAmount && (
        <label className="block space-y-1.5">
          <span className="text-sm text-muted">Amount ({DEFAULT_CURRENCY})</span>
          <input className={field} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </label>
      )}
      {isLeave && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5"><span className="text-sm text-muted">From</span><input className={field} type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="block space-y-1.5"><span className="text-sm text-muted">To</span><input className={field} type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
      )}
      <label className="block space-y-1.5">
        <span className="text-sm text-muted">{isLeave ? 'Reason (optional)' : 'Details'}</span>
        <textarea className={`${field} min-h-28 py-3`} value={details} maxLength={1800} onChange={(e) => setDetails(e.target.value)} />
      </label>
      <p className="text-xs text-muted">Attachments (receipts, quotations) are coming in the next step. Works offline: it is saved here and sent when you are connected.</p>
      {error && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
      <Button type="submit" loading={busy} className="w-full">Submit request</Button>
    </form>
  )
}

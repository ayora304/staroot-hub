import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { usePermissions } from '../../../core/auth/useSession'
import { Button } from '../../../core/ui/Button'
import { EmptyState } from '../../../core/ui/EmptyState'
import { Skeleton } from '../../../core/ui/Skeleton'
import { useApprovalsList } from '../hooks/use-approvals'
import type { ApprovalTab } from '../types'
import { ApprovalList } from './ApprovalList'
import { RequestDetail } from './RequestDetail'
import { RequestForm } from './RequestForm'

const TABS: { key: ApprovalTab; label: string }[] = [
  { key: 'pending_mine', label: 'Pending my action' },
  { key: 'mine', label: 'My submissions' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
]

function Home() {
  const { can } = usePermissions()
  const location = useLocation()
  const queued = (location.state as { queued?: boolean } | null)?.queued
  const [tab, setTab] = useState<ApprovalTab>(can('approvals', 'approve') ? 'pending_mine' : 'mine')
  const { data, loading, error, offline, reload } = useApprovalsList(tab)

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pt-safe pb-safe">
      <header className="flex items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-sm text-muted">← Hub</Link>
          <h1 className="text-2xl font-semibold text-text">Approvals</h1>
        </div>
        <Link to="/m/approvals/new" className="grid min-h-12 place-items-center rounded-xl bg-accent px-5 font-semibold text-accent-contrast">New request</Link>
      </header>

      {queued && <p role="status" className="rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm text-text">Saved on this device. It is sent as soon as you are connected, then it appears in the list.</p>}

      <div role="tablist" aria-label="Approval views" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm focus-visible:outline-2 focus-visible:outline-accent ${tab === t.key ? 'border-accent bg-accent text-accent-contrast' : 'border-border text-muted'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>}
      {!loading && offline && <EmptyState title="You are offline" body="The list needs a connection. You can still create new requests; they will send when you reconnect." action={<Button variant="secondary" onClick={reload}>Try again</Button>} />}
      {!loading && error && <EmptyState title="Could not load requests" body={error} action={<Button variant="secondary" onClick={reload}>Try again</Button>} />}
      {!loading && !offline && !error && data && data.length === 0 && <EmptyState title="Nothing here" body="No requests in this view yet." />}
      {!loading && !offline && !error && data && data.length > 0 && <ApprovalList items={data} />}
    </div>
  )
}

export function ApprovalsApp() {
  const { id } = useParams()
  if (id === 'new') return <RequestForm />
  if (id) return <RequestDetail id={id} />
  return <Home />
}

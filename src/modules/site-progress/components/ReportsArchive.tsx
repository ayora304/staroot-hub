import { useState } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'
import { useSession } from '../../../core/auth/useSession'
import { Button } from '../../../core/ui/Button'
import { Card } from '../../../core/ui/Card'
import { StatusPill } from '../../../core/ui/StatusPill'
import { syncEngine } from '../../../core/offline'
import { canApproveReport, isFinalReport } from '../report-workflow'
import { changePendingReport } from '../services/site-progress.service'
import type { SiteReport } from '../types'

export function ReportsArchive({ reports, loading, offline, canWrite, onOpen, onBuild, onBack, onEdit, onChanged }: {
  reports: SiteReport[]; loading: boolean; offline: boolean; canWrite: boolean
  onOpen: (id: string) => void; onBuild: () => void; onBack: () => void
  onEdit: (id: string) => void; onChanged: () => void
}) {
  const { session } = useSession()
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState<'pending' | 'final'>('pending')
  const [working, setWorking] = useState<string | null>(null)
  const [error, setError] = useState('')
  const pending = reports.filter((report) => report.status === 'pending')
  const final = reports.filter((report) => isFinalReport(report) || report.status === 'superseded')
  const filtered = (stage === 'pending' ? pending : final).filter((report) => `${report.title} ${report.author_name}`.toLowerCase().includes(query.trim().toLowerCase()))
  async function approve(report: SiteReport) {
    if (!session) return
    setWorking(report.$id); setError('')
    try { await changePendingReport(report, session.user.id, { action: 'approve' }); onChanged(); setStage('final') }
    catch (error) { setError(error instanceof Error ? error.message : 'Could not approve report.') }
    finally { setWorking(null) }
  }
  return <div className="space-y-4 pt-3">
    <div className="flex items-center justify-between gap-2"><div><h2 className="text-xl font-semibold text-text">Reports archive</h2><p className="text-sm text-muted">Prepare, review and approve project reports.</p></div><Button type="button" variant="secondary" onClick={onBack}>Back</Button></div>
    <Button type="button" className="flex w-full items-center justify-center gap-2" onClick={onBuild}><Plus size={20} />New report</Button>
    {reports.some((report) => report.local_status === 'failed') && <Button type="button" variant="secondary" onClick={() => void syncEngine.retryAllFailed()}>Retry failed sync</Button>}
    {offline && <p role="status" className="text-sm text-warning">Showing reports on this device. Approval requires a connection.</p>}
    <div role="tablist" aria-label="Report stage" className="flex gap-2">{(['pending', 'final'] as const).map((value) => <button key={value} type="button" role="tab" aria-selected={stage === value} onClick={() => setStage(value)} className={`min-h-11 flex-1 rounded-xl border px-3 ${stage === value ? 'border-accent bg-accent font-semibold text-accent-contrast' : 'border-border bg-surface text-text'}`}>{value === 'pending' ? `Pending (${pending.length})` : `Final (${final.length})`}</button>)}</div>
    <label className="block space-y-1 text-sm"><span className="text-muted">Search reports</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title or author" className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text" /></label>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    {loading && <p role="status" className="text-sm text-muted">Loading reports…</p>}
    {!loading && !filtered.length && <Card><p className="text-sm text-muted">{query ? 'No matching reports.' : stage === 'pending' ? 'No pending reports yet. Start a new project report above.' : 'Manager-approved reports will appear here.'}</p></Card>}
    <ul className="space-y-3">{filtered.map((report) => <li key={report.$id}><Card className="space-y-3">
      <div className="flex items-start gap-2">{report.status === 'final' && <CheckCircle2 className="shrink-0 text-success" size={22} aria-label="Manager approved" />}<div className="min-w-0"><h3 className="font-semibold text-text">{report.title}</h3><p className="text-sm text-muted">{new Date(report.report_date).toLocaleDateString()} · {report.author_name}</p></div></div>
      <div className="flex flex-wrap gap-2"><StatusPill tone={report.status === 'pending' ? 'warning' : 'success'}>{report.status === 'pending' ? 'Pending manager approval' : report.status === 'final' ? 'Final · approved' : report.status === 'superseded' ? 'Superseded' : 'Published · legacy'}</StatusPill>{report.local_status && <StatusPill tone={report.local_status === 'failed' || report.local_status === 'needs_review' ? 'danger' : 'warning'}>{report.local_status === 'pending' ? 'Waiting to sync' : report.local_status}</StatusPill>}</div>
      {report.approved_at && <p className="text-xs text-muted">Approved {new Date(report.approved_at).toLocaleString()}</p>}
      <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => onOpen(report.$id)}>Open report</Button>
        {canWrite && report.status === 'pending' && report.author_id === session?.user.id && <Button type="button" variant="secondary" disabled={!!report.local_status} onClick={() => onEdit(report.$id)}>Edit pending report</Button>}
        {session && canApproveReport(report, { role: session.profile.role, id: session.user.id }) && <Button type="button" loading={working === report.$id} disabled={!!report.local_status || offline || working !== null} onClick={() => void approve(report)}>Approve &amp; finalize</Button>}
      </div>
    </Card></li>)}</ul>
  </div>
}

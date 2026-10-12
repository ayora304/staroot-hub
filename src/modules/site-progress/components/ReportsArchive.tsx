import { useMemo, useState } from 'react'
import { Button } from '../../../core/ui/Button'
import { Card } from '../../../core/ui/Card'
import { StatusPill } from '../../../core/ui/StatusPill'
import { syncEngine } from '../../../core/offline'
import type { SiteReport } from '../types'

export function ReportsArchive({ reports, loading, offline, canWrite, onOpen, onBuild, onBack }: {
  reports: SiteReport[]
  loading: boolean
  offline: boolean
  canWrite: boolean
  onOpen: (id: string) => void
  onBuild: () => void
  onBack: () => void
}) {
  const [query, setQuery] = useState('')
  const syncState = (status: SiteReport['local_status']) => status === 'syncing'
    ? { label: 'Syncing', tone: 'warning' as const }
    : status === 'failed'
      ? { label: 'Error · retry available', tone: 'danger' as const }
      : status === 'needs_review'
        ? { label: 'Needs review', tone: 'danger' as const }
        : status === 'pending'
          ? { label: 'Local · waiting to sync', tone: 'warning' as const }
          : { label: 'Synced', tone: 'success' as const }
  const filtered = useMemo(() => reports.filter((report) => `${report.title} ${report.author_name}`.toLowerCase().includes(query.trim().toLowerCase())), [reports, query])
  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-2"><div><h2 className="text-xl font-semibold text-text">Reports archive</h2><p className="text-sm text-muted">Published reports are immutable snapshots.</p></div><Button type="button" variant="secondary" onClick={onBack}>Back</Button></div>
    {offline && <p role="status" className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">Showing reports saved on this device.</p>}
    <label className="block space-y-1 text-sm"><span className="text-muted">Search reports</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title or author" className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text" /></label>
    <div className="flex flex-wrap gap-2">{canWrite && <Button type="button" onClick={onBuild}>Build a report</Button>}{reports.some((report) => report.local_status === 'failed') && <Button type="button" variant="secondary" onClick={() => void syncEngine.retryAllFailed()}>Retry failed sync</Button>}</div>
    {loading && <p role="status" className="text-sm text-muted">Loading report archive…</p>}
    {!loading && filtered.length === 0 && <Card className="space-y-3"><p className="text-sm text-muted">{reports.length ? 'No reports match your search.' : 'No published reports yet.'}</p>{canWrite && !reports.length && <Button type="button" variant="secondary" onClick={onBuild}>Create the first report</Button>}</Card>}
    <ul className="space-y-3">{filtered.map((report) => { const state = syncState(report.local_status); return <li key={report.$id}><Card className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-medium text-text">{report.title}</h3><p className="text-sm text-muted">{new Date(report.report_date).toLocaleDateString()} · {report.author_name}</p><div className="mt-2 flex flex-wrap gap-2"><StatusPill tone={state.tone}>{state.label}</StatusPill>{report.status === 'superseded' && <StatusPill>Superseded</StatusPill>}</div></div><Button type="button" variant="secondary" onClick={() => onOpen(report.$id)}>Open report</Button></Card></li> })}</ul>
  </div>
}

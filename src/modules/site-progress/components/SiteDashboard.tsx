import { Link } from 'react-router-dom'
import { Button } from '../../../core/ui/Button'
import { PhotoEvidence } from '../../../core/evidence/PhotoEvidence'
import { Card } from '../../../core/ui/Card'
import { StatusPill } from '../../../core/ui/StatusPill'
import { syncEngine } from '../../../core/offline'
import type { Contractor, SiteLog, SiteProject } from '../types'
import { ContractorGrid } from './ContractorGrid'

const STATUS: Record<SiteLog['status'], { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  on_track: { label: 'On track', tone: 'success' }, delayed: { label: 'Delayed', tone: 'warning' }, blocked: { label: 'Blocked', tone: 'danger' },
}

export function SiteDashboard({ projects, selectedProject, onSelectProject, contractors, logs, loading, offline, canWrite, userId, onNewLog, onEditLog }: {
  projects: SiteProject[]
  selectedProject: string
  onSelectProject: (id: string) => void
  contractors: Contractor[]
  logs: SiteLog[]
  loading: boolean
  offline: boolean
  canWrite: boolean
  userId: string
  onNewLog: () => void
  onEditLog: (log: SiteLog) => void
}) {
  const project = projects.find((p) => p.$id === selectedProject)
  const completeCount = contractors.filter((contractor) => contractor.progress_pct >= 100).length
  const overallProgress = contractors.length
    ? Math.round(contractors.reduce((total, contractor) => total + contractor.progress_pct, 0) / contractors.length)
    : 0
  const latestLog = logs[0]
  const lookAhead = logs.filter((log) => log.blockers?.trim()).slice(0, 3)
  const photoLogs = logs.filter((log) => log.photos?.length).slice(0, 4)
  const circumference = 2 * Math.PI * 50
  return <div className="space-y-5">
    <label className="block space-y-1 text-sm"><span className="text-muted">Project site</span><select value={selectedProject} onChange={(e) => onSelectProject(e.target.value)} className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-text">{projects.length ? projects.map((p) => <option key={p.$id} value={p.$id}>{p.name}{p.location ? ` · ${p.location}` : ''}</option>) : <option value="">No active projects</option>}</select></label>
    {offline && <div role="status" className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">Offline view. Showing the last saved project data; new logs and reports remain on this device until sync.</div>}
    {loading && <p role="status" className="text-sm text-muted">Loading site activity…</p>}
    {!loading && projects.length === 0 && <Card><p className="text-sm text-muted">No active project sites are configured yet.</p></Card>}
    {project && <>
      <section className="space-y-3">
        <Card className="flex items-center gap-4 bg-surface-2">
          <svg className="size-[118px] shrink-0" viewBox="0 0 120 120" role="img" aria-label={`${overallProgress}% average contractor progress`}>
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--c-border)" strokeWidth="12" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--c-accent)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${circumference * overallProgress / 100} ${circumference}`} transform="rotate(-90 60 60)" />
            <text x="60" y="69" textAnchor="middle" fill="var(--c-text)" fontSize="26" fontWeight="700">{overallProgress}%</text>
          </svg>
          <div className="min-w-0">
            <p className="text-sm text-muted">Project progress</p>
            <h2 className="mt-1 truncate text-xl font-semibold text-text">{project.name}</h2>
            {project.location && <p className="truncate text-sm text-muted">{project.location}</p>}
            <p className="mt-2 text-xs text-muted">{latestLog ? `Updated ${new Date(latestLog.log_date).toLocaleDateString()}` : 'No progress updates yet'}</p>
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-surface-2 p-3"><b className="block text-2xl text-text">{completeCount}</b><span className="text-xs text-muted">contractors complete</span></Card>
          <Card className="bg-surface-2 p-3"><b className="block text-2xl text-text">{contractors.length - completeCount}</b><span className="text-xs text-muted">in progress</span></Card>
          <Card className="bg-surface-2 p-3"><b className="block text-2xl text-text">{new Set(contractors.map((contractor) => contractor.trade)).size}</b><span className="text-xs text-muted">trade sections</span></Card>
        </div>
        <div><h2 className="text-lg font-semibold text-text">Phases &amp; items</h2><p className="mb-3 text-sm text-muted">Progress sections grouped by trade</p><ContractorGrid contractors={contractors} /></div>
      </section>
      <section className="space-y-3">
        <div><h2 className="text-lg font-semibold text-text">Look ahead</h2><p className="text-sm text-muted">Latest blockers reported by the site team</p></div>
        {lookAhead.length ? lookAhead.map((log) => {
          const contractor = contractors.find((item) => item.$id === log.contractor_id)
          return <Card key={log.$id}><p className="text-sm font-medium text-text">{contractor?.name ?? 'Site team'} · {new Date(log.log_date).toLocaleDateString()}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted">{log.blockers}</p></Card>
        }) : <Card><p className="text-sm text-muted">No blockers have been reported.</p></Card>}
      </section>
      {photoLogs.length > 0 && <section className="space-y-3"><div><h2 className="text-lg font-semibold text-text">Photo timeline</h2><p className="text-sm text-muted">Recent evidence attached to daily logs</p></div>{photoLogs.map((log) => <Card key={log.$id} className="space-y-2"><p className="text-xs text-muted">{new Date(log.log_date).toLocaleDateString()}</p><PhotoEvidence photos={log.photos ?? []} ownerId={log.$id} owner="site_logs" /></Card>)}</section>}
      {canWrite && <Button type="button" className="w-full" onClick={onNewLog}>Update progress</Button>}
      <section className="space-y-3"><div className="flex items-end justify-between gap-2"><div><h2 className="text-lg font-semibold text-text">Recent daily logs</h2><p className="text-sm text-muted">Latest activity at this site</p></div><span className="text-xs text-muted">{logs.length} entries</span></div>
        {logs.some((log) => log.local_status === 'failed') && <Button type="button" variant="secondary" onClick={() => void syncEngine.retryAllFailed()}>Retry failed site sync</Button>}
        {logs.length === 0 ? <Card><p className="text-sm text-muted">No site logs yet.</p>{canWrite && <Button type="button" className="mt-3" onClick={onNewLog}>Record today’s progress</Button>}</Card> : <ul className="space-y-3">{logs.slice(0, 12).map((log) => {
          const contractor = contractors.find((c) => c.$id === log.contractor_id)
          const canEdit = canWrite && log.engineer_id === userId && !log.local_status && Date.now() - Date.parse(log.$createdAt) <= 24 * 60 * 60 * 1000
          const queueLabel = log.local_status === 'syncing' ? 'Syncing' : log.local_status === 'failed' ? 'Error' : log.local_status === 'needs_review' ? 'Needs review' : 'Local'
          return <li key={log.$id}><Card className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-text">{contractor?.name ?? 'Contractor'} · {new Date(log.log_date).toLocaleDateString()}</p><div className="flex items-center gap-2"><StatusPill tone={STATUS[log.status].tone}>{STATUS[log.status].label}</StatusPill>{log.local_status && <StatusPill tone={log.local_status === 'failed' || log.local_status === 'needs_review' ? 'danger' : 'warning'}>{queueLabel}</StatusPill>}{canEdit && <Button type="button" variant="ghost" className="min-h-9 px-2" onClick={() => onEditLog(log)}>Edit</Button>}</div></div><p className="whitespace-pre-wrap text-sm text-text">{log.work_done}</p>{log.blockers && <p className="text-sm text-warning">Blocker: {log.blockers}</p>}<PhotoEvidence photos={log.photos ?? []} ownerId={log.$id} owner="site_logs" /></Card></li>
        })}</ul>}
      </section>
    </>}
    <Link to="/" className="inline-flex min-h-11 items-center text-sm text-muted">Back to Hub</Link>
  </div>
}

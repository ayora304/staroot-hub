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

export function SiteDashboard({ projects, selectedProject, onSelectProject, contractors, logs, loading, offline, canWrite, userId, onNewLog, onEditLog, onReports, onBuildReport }: {
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
  onReports: () => void
  onBuildReport: () => void
}) {
  const project = projects.find((p) => p.$id === selectedProject)
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <label className="min-w-48 flex-1 space-y-1 text-sm"><span className="text-muted">Project site</span><select value={selectedProject} onChange={(e) => onSelectProject(e.target.value)} className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text">{projects.length ? projects.map((p) => <option key={p.$id} value={p.$id}>{p.name}{p.location ? ` · ${p.location}` : ''}</option>) : <option value="">No active projects</option>}</select></label>
      <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={onReports}>Reports archive</Button>{canWrite && <Button type="button" variant="secondary" onClick={onBuildReport}>Build report</Button>}{canWrite && <Button type="button" onClick={onNewLog}>Add daily log</Button>}</div>
    </div>
    {offline && <div role="status" className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">Offline view. Showing the last saved project data; new logs and reports remain on this device until sync.</div>}
    {loading && <p role="status" className="text-sm text-muted">Loading site activity…</p>}
    {!loading && projects.length === 0 && <Card><p className="text-sm text-muted">No active project sites are configured yet.</p></Card>}
    {project && <>
      <section className="space-y-3"><div><h2 className="text-lg font-semibold text-text">Contractor progress</h2><p className="text-sm text-muted">{project.name}{project.location ? ` · ${project.location}` : ''}</p></div><ContractorGrid contractors={contractors} /></section>
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

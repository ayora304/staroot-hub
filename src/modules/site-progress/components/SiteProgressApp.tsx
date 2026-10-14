import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Menu, X } from 'lucide-react'
import { usePermissions, useSession } from '../../../core/auth/useSession'
import { PhotoEvidence } from '../../../core/evidence/PhotoEvidence'
import { syncEngine } from '../../../core/offline'
import { Button } from '../../../core/ui/Button'
import { Card } from '../../../core/ui/Card'
import { StatusPill } from '../../../core/ui/StatusPill'
import { useSiteContractors, useSiteLogs, useSiteProjects, useSiteReports } from '../hooks/use-site-progress'
import { ProgressEntry } from './ProgressEntry'
import { ReportBuilderWizard } from './ReportBuilderWizard'
import { ReportViewer } from './ReportViewer'
import { ReportsArchive } from './ReportsArchive'
import { SiteDashboard } from './SiteDashboard'
import { ContractorGrid } from './ContractorGrid'
import type { SiteLog } from '../types'
import '../site-progress.css'

type Screen = 'home' | 'phases' | 'log' | 'reports' | 'builder'

export function SiteProgressApp() {
  const { session } = useSession()
  const { can } = usePermissions()
  const { id } = useParams()
  const navigate = useNavigate()
  const projects = useSiteProjects()
  const reports = useSiteReports()
  const [selectedProject, setSelectedProject] = useState('')
  const [screen, setScreen] = useState<Screen>('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<SiteLog | null>(null)
  const contractors = useSiteContractors(selectedProject)
  const logs = useSiteLogs(selectedProject)
  const canWrite = can('site', 'write')
  const title = id ? 'Monthly report' : screen === 'home' ? 'Site Progress' : screen === 'phases' ? 'Phases & items' : screen === 'log' ? 'Update progress' : screen === 'reports' ? 'Monthly reports' : 'Report builder'

  useEffect(() => {
    if (!selectedProject && projects.data?.length) setSelectedProject(projects.data[0].$id)
  }, [projects.data, selectedProject])

  const selectedReport = id ? reports.data?.find((report) => report.$id === id) : undefined
  function showHome() { setScreen('home'); setEditingLog(null); setMenuOpen(false); if (id) navigate('/m/site', { replace: true }) }
  function showScreen(next: Screen) { setScreen(next); setEditingLog(null); setMenuOpen(false); if (id) navigate('/m/site', { replace: true }) }

  return <main className="site-progress-app mx-auto min-h-screen w-full space-y-1 px-safe pb-safe">
    <header className="site-progress-app__header sticky top-0 z-30 -mx-4 border-b border-border">
      <Link to="/" aria-label="Back to hub" className="site-progress-app__header-button"><ArrowLeft size={20} /></Link>
      <h1 className="min-w-0 truncate text-center text-[17px] font-semibold text-text">{title}</h1>
      <button type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="site-progress-app__header-button">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
    </header>
    {menuOpen && <><button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-40 cursor-default bg-black/50" /><nav aria-label="Site Progress navigation" className="fixed inset-y-0 right-0 z-50 flex w-[min(300px,85vw)] flex-col gap-2 bg-bg px-4 pb-safe pt-safe shadow-2xl">
      <div className="flex items-center justify-between py-3"><b className="text-text">Site Progress</b><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation" className="grid size-10 place-items-center rounded-xl text-text"><X size={20}/></button></div>
      <button type="button" onClick={() => showScreen('home')} className="min-h-12 rounded-xl bg-surface px-4 text-left text-text">Dashboard</button>
      <button type="button" onClick={() => showScreen('phases')} className="min-h-12 rounded-xl bg-surface px-4 text-left text-text">Phases &amp; items</button>
      {canWrite && <button type="button" onClick={() => { setEditingLog(null); showScreen('log') }} className="min-h-12 rounded-xl bg-surface px-4 text-left text-text">Update progress</button>}
      <button type="button" onClick={() => showScreen('reports')} className="min-h-12 rounded-xl bg-surface px-4 text-left text-text">Reports archive</button>
      {canWrite && <button type="button" onClick={() => showScreen('builder')} className="min-h-12 rounded-xl bg-surface px-4 text-left text-text">Report builder</button>}
    </nav></>}
    {id ? selectedReport ? <ReportViewer report={selectedReport} onBack={showHome} /> : <div role="status" className="rounded-xl border border-border p-5 text-sm text-muted">{reports.loading ? 'Opening report…' : 'Report not found in your accessible archive.'}<Button type="button" className="mt-3" onClick={showHome}>Back to site progress</Button></div> : null}
    {!id && screen === 'home' && <SiteDashboard
      projects={projects.data ?? []} selectedProject={selectedProject} onSelectProject={setSelectedProject}
      contractors={contractors.data ?? []} logs={logs.data ?? []}
      loading={projects.loading || (!!selectedProject && (contractors.loading || logs.loading))}
      offline={projects.offline || contractors.offline || logs.offline} canWrite={canWrite}
      onNewLog={() => { setEditingLog(null); setScreen('log') }}
    />}
    {!id && screen === 'phases' && <section className="space-y-4">
      <div><p className="text-sm text-muted">{projects.data?.find((project) => project.$id === selectedProject)?.name ?? 'Selected project'}</p><h2 className="text-xl font-semibold text-text">Phases &amp; items</h2><p className="text-sm text-muted">Work sections are grouped by trade and reflect current contractor progress.</p></div>
      <div className="flex gap-2 overflow-x-auto pb-2">{(projects.data ?? []).map((project) => <button key={project.$id} type="button" onClick={() => setSelectedProject(project.$id)} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${selectedProject === project.$id ? 'border-accent bg-accent font-semibold text-accent-contrast' : 'border-border bg-surface text-text'}`}>{project.name}</button>)}</div>
      {contractors.loading ? <p role="status" className="text-sm text-muted">Loading trade progress…</p> : <ContractorGrid contractors={contractors.data ?? []} />}
      <section className="space-y-3"><div className="flex items-end justify-between"><h3 className="font-semibold text-text">Progress updates</h3><span className="text-xs text-muted">{logs.data?.length ?? 0} logs</span></div>
        {logs.data?.some((log) => log.local_status === 'failed') && <Button type="button" variant="secondary" onClick={() => void syncEngine.retryAllFailed()}>Retry failed sync</Button>}
        {logs.loading ? <p role="status" className="text-sm text-muted">Loading progress logs…</p> : logs.data?.length ? logs.data.slice(0, 12).map((log) => {
          const contractor = contractors.data?.find((item) => item.$id === log.contractor_id)
          const canEdit = canWrite && log.engineer_id === (session?.user.id ?? '') && !log.local_status && Date.now() - Date.parse(log.$createdAt) <= 24 * 60 * 60 * 1000
          const queueLabel = log.local_status === 'syncing' ? 'Syncing' : log.local_status === 'failed' ? 'Error' : log.local_status === 'needs_review' ? 'Needs review' : 'Local'
          return <Card key={log.$id} className="space-y-2"><div className="flex items-start justify-between gap-2"><div><b className="text-sm text-text">{contractor?.name ?? 'Contractor'}</b><p className="text-xs text-muted">{new Date(log.log_date).toLocaleDateString()}</p></div><div className="flex items-center gap-1"><StatusPill tone={log.status === 'on_track' ? 'success' : log.status === 'delayed' ? 'warning' : 'danger'}>{log.status.replace('_', ' ')}</StatusPill>{log.local_status && <StatusPill tone={log.local_status === 'failed' || log.local_status === 'needs_review' ? 'danger' : 'warning'}>{queueLabel}</StatusPill>}{canEdit && <Button type="button" variant="ghost" className="min-h-9 px-2" onClick={() => { setEditingLog(log); setScreen('log') }}>Edit</Button>}</div></div><p className="whitespace-pre-wrap text-sm text-text">{log.work_done}</p>{log.blockers && <p className="text-sm text-warning">Blocker: {log.blockers}</p>}<PhotoEvidence photos={log.photos ?? []} ownerId={log.$id} owner="site_logs" /></Card>
        }) : <Card><p className="text-sm text-muted">No progress updates for this project yet.</p></Card>}
      </section>
    </section>}
    {!id && screen === 'log' && <ProgressEntry key={editingLog?.$id ?? 'new'} projectId={editingLog?.project_id ?? selectedProject} contractors={contractors.data ?? []} existing={editingLog ?? undefined} onSaved={() => { logs.reload(); contractors.reload() }} onCancel={showHome} />}
    {!id && screen === 'reports' && <ReportsArchive reports={reports.data ?? []} loading={reports.loading} offline={reports.offline} canWrite={canWrite} onOpen={(reportId) => navigate(`/m/site/${reportId}`)} onBuild={() => setScreen('builder')} onBack={showHome} />}
    {!id && screen === 'builder' && canWrite && <ReportBuilderWizard projects={projects.data ?? []} onPublished={() => reports.reload()} onCancel={showHome} />}
    {!id && screen === 'builder' && !canWrite && <p role="alert" className="text-sm text-danger">You do not have permission to publish site reports.</p>}
    {!session && <p role="status" className="text-sm text-muted">Sign in to access project records.</p>}
  </main>
}

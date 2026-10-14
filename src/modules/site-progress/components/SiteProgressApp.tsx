import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Menu, X } from 'lucide-react'
import { usePermissions, useSession } from '../../../core/auth/useSession'
import { Button } from '../../../core/ui/Button'
import { useSiteContractors, useSiteLogs, useSiteProjects, useSiteReports } from '../hooks/use-site-progress'
import { ProgressEntry } from './ProgressEntry'
import { ReportBuilderWizard } from './ReportBuilderWizard'
import { ReportViewer } from './ReportViewer'
import { ReportsArchive } from './ReportsArchive'
import { SiteDashboard } from './SiteDashboard'
import { ContractorGrid } from './ContractorGrid'
import type { SiteLog } from '../types'

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
  const title = id ? 'Monthly report' : screen === 'home' ? 'Site Progress' : screen === 'log' ? 'Update progress' : screen === 'reports' ? 'Reports archive' : 'Report builder'

  useEffect(() => {
    if (!selectedProject && projects.data?.length) setSelectedProject(projects.data[0].$id)
  }, [projects.data, selectedProject])

  const selectedReport = id ? reports.data?.find((report) => report.$id === id) : undefined
  function showHome() { setScreen('home'); setEditingLog(null); setMenuOpen(false); if (id) navigate('/m/site', { replace: true }) }
  function showScreen(next: Screen) { setScreen(next); setEditingLog(null); setMenuOpen(false); if (id) navigate('/m/site', { replace: true }) }

  return <main className="min-h-screen-safe mx-auto max-w-3xl space-y-5 px-safe pb-safe pt-safe">
    <header className="sticky top-0 z-30 -mx-4 flex items-center gap-3 border-b border-border bg-surface px-4 py-2 sm:-mx-6 sm:px-6">
      <Link to="/" aria-label="Back to hub" className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-text"><ArrowLeft size={20} /></Link>
      <h1 className="min-w-0 flex-1 truncate text-center text-lg font-semibold text-text">{title}</h1>
      <button type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-text">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
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
      offline={projects.offline || contractors.offline || logs.offline} canWrite={canWrite} userId={session?.user.id ?? ''}
      onNewLog={() => { setEditingLog(null); setScreen('log') }} onEditLog={(log) => { setEditingLog(log); setScreen('log') }}
    />}
    {!id && screen === 'phases' && <section className="space-y-4"><div><p className="text-sm text-muted">{projects.data?.find((project) => project.$id === selectedProject)?.name ?? 'Selected project'}</p><h2 className="text-xl font-semibold text-text">Phases &amp; items</h2><p className="text-sm text-muted">Work sections are grouped by trade and reflect current contractor progress.</p></div><label className="block space-y-1 text-sm"><span className="text-muted">Project site</span><select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)} className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text">{(projects.data ?? []).map((project) => <option key={project.$id} value={project.$id}>{project.name}</option>)}</select></label>{contractors.loading ? <p role="status" className="text-sm text-muted">Loading trade progress…</p> : <ContractorGrid contractors={contractors.data ?? []} />}{logs.data?.length ? <section className="space-y-3"><h3 className="font-semibold text-text">Recent work notes</h3>{logs.data.slice(0, 5).map((log) => <article key={log.$id} className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs text-muted">{new Date(log.log_date).toLocaleDateString()}</p><p className="mt-1 whitespace-pre-wrap text-sm text-text">{log.work_done}</p></article>)}</section> : null}</section>}
    {!id && screen === 'log' && <ProgressEntry key={editingLog?.$id ?? 'new'} projectId={editingLog?.project_id ?? selectedProject} contractors={contractors.data ?? []} existing={editingLog ?? undefined} onSaved={() => { logs.reload(); contractors.reload() }} onCancel={showHome} />}
    {!id && screen === 'reports' && <ReportsArchive reports={reports.data ?? []} loading={reports.loading} offline={reports.offline} canWrite={canWrite} onOpen={(reportId) => navigate(`/m/site/${reportId}`)} onBuild={() => setScreen('builder')} onBack={showHome} />}
    {!id && screen === 'builder' && canWrite && <ReportBuilderWizard projects={projects.data ?? []} onPublished={() => reports.reload()} onCancel={showHome} />}
    {!id && screen === 'builder' && !canWrite && <p role="alert" className="text-sm text-danger">You do not have permission to publish site reports.</p>}
    {!session && <p role="status" className="text-sm text-muted">Sign in to access project records.</p>}
  </main>
}

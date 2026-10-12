import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usePermissions, useSession } from '../../../core/auth/useSession'
import { Button } from '../../../core/ui/Button'
import { useSiteContractors, useSiteLogs, useSiteProjects, useSiteReports } from '../hooks/use-site-progress'
import { ProgressEntry } from './ProgressEntry'
import { ReportBuilderWizard } from './ReportBuilderWizard'
import { ReportViewer } from './ReportViewer'
import { ReportsArchive } from './ReportsArchive'
import { SiteDashboard } from './SiteDashboard'
import type { SiteLog } from '../types'

type Screen = 'home' | 'log' | 'reports' | 'builder'

export function SiteProgressApp() {
  const { session } = useSession()
  const { can } = usePermissions()
  const { id } = useParams()
  const navigate = useNavigate()
  const projects = useSiteProjects()
  const reports = useSiteReports()
  const [selectedProject, setSelectedProject] = useState('')
  const [screen, setScreen] = useState<Screen>('home')
  const [editingLog, setEditingLog] = useState<SiteLog | null>(null)
  const contractors = useSiteContractors(selectedProject)
  const logs = useSiteLogs(selectedProject)
  const canWrite = can('site', 'write')

  useEffect(() => {
    if (!selectedProject && projects.data?.length) setSelectedProject(projects.data[0].$id)
  }, [projects.data, selectedProject])

  const selectedReport = id ? reports.data?.find((report) => report.$id === id) : undefined
  function showHome() { setScreen('home'); setEditingLog(null); if (id) navigate('/m/site', { replace: true }) }

  return <main className="min-h-screen-safe mx-auto max-w-3xl space-y-5 px-safe pb-safe pt-safe">
    <header className="flex items-center justify-between gap-3 border-b border-border py-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">Staroot Hub</p><h1 className="text-lg font-semibold text-text">Site Progress</h1></div><Link to="/" className="min-h-11 rounded-xl px-3 py-2 text-sm text-muted">Hub</Link></header>
    {id ? selectedReport ? <ReportViewer report={selectedReport} onBack={showHome} /> : <div role="status" className="rounded-xl border border-border p-5 text-sm text-muted">{reports.loading ? 'Opening report…' : 'Report not found in your accessible archive.'}<Button type="button" className="mt-3" onClick={showHome}>Back to site progress</Button></div> : null}
    {!id && screen === 'home' && <SiteDashboard
      projects={projects.data ?? []} selectedProject={selectedProject} onSelectProject={setSelectedProject}
      contractors={contractors.data ?? []} logs={logs.data ?? []}
      loading={projects.loading || (!!selectedProject && (contractors.loading || logs.loading))}
      offline={projects.offline || contractors.offline || logs.offline} canWrite={canWrite} userId={session?.user.id ?? ''}
      onNewLog={() => { setEditingLog(null); setScreen('log') }} onEditLog={(log) => { setEditingLog(log); setScreen('log') }} onReports={() => setScreen('reports')} onBuildReport={() => setScreen('builder')}
    />}
    {!id && screen === 'log' && <ProgressEntry key={editingLog?.$id ?? 'new'} projectId={editingLog?.project_id ?? selectedProject} contractors={contractors.data ?? []} existing={editingLog ?? undefined} onSaved={() => { logs.reload(); contractors.reload() }} onCancel={showHome} />}
    {!id && screen === 'reports' && <ReportsArchive reports={reports.data ?? []} loading={reports.loading} offline={reports.offline} canWrite={canWrite} onOpen={(reportId) => navigate(`/m/site/${reportId}`)} onBuild={() => setScreen('builder')} onBack={showHome} />}
    {!id && screen === 'builder' && canWrite && <ReportBuilderWizard projects={projects.data ?? []} onPublished={() => reports.reload()} onCancel={showHome} />}
    {!id && screen === 'builder' && !canWrite && <p role="alert" className="text-sm text-danger">You do not have permission to publish site reports.</p>}
    {!session && <p role="status" className="text-sm text-muted">Sign in to access project records.</p>}
  </main>
}

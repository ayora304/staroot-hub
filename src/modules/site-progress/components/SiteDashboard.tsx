import { HorizontalScroller } from '../../../core/ui/HorizontalScroller'
import { type ComponentProps } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SiteReferencePreview } from './SiteReferencePreview'
import { Button } from '../../../core/ui/Button'
import { PhotoEvidence } from '../../../core/evidence/PhotoEvidence'
import { Card } from '../../../core/ui/Card'
import type { Contractor, SiteLog, SiteProject } from '../types'
import { ContractorGrid } from './ContractorGrid'

export function SiteDashboard(props: ComponentProps<typeof LiveSiteDashboard>) {
  const [params] = useSearchParams()
  const demo = params.get('view') !== 'live'
  return <div className="space-y-4">
    {demo ? <SiteReferencePreview /> : <LiveSiteDashboard {...props} />}
  </div>
}

function LiveSiteDashboard({ projects, selectedProject, onSelectProject, contractors, logs, loading, offline, canWrite, onNewLog }: {
  projects: SiteProject[]
  selectedProject: string
  onSelectProject: (id: string) => void
  contractors: Contractor[]
  logs: SiteLog[]
  loading: boolean
  offline: boolean
  canWrite: boolean
  onNewLog: () => void
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
  const priorMonthCutoff = Date.now() - 30 * 86400000
  const tradeProgress = [...new Set(contractors.map((contractor) => contractor.trade))].slice(0, 3).map((trade) => {
    const crew = contractors.filter((contractor) => contractor.trade === trade)
    const priorValues = crew.flatMap((contractor) => {
      const previous = logs.filter((log) => log.contractor_id === contractor.$id && Date.parse(log.log_date) <= priorMonthCutoff && log.progress_pct != null).sort((a, b) => Date.parse(b.log_date) - Date.parse(a.log_date))[0]
      return previous?.progress_pct == null ? [] : [previous.progress_pct]
    })
    return {
      trade,
      current: Math.round(crew.reduce((sum, contractor) => sum + contractor.progress_pct, 0) / crew.length),
      previous: priorValues.length ? Math.round(priorValues.reduce((sum, value) => sum + value, 0) / priorValues.length) : null,
    }
  })
  return <div className="space-y-5">
    <HorizontalScroller role="tablist" label="Project sites" className="flex gap-2 pb-2">{projects.map((projectOption) => <button key={projectOption.$id} type="button" role="tab" aria-selected={selectedProject === projectOption.$id} onClick={() => onSelectProject(projectOption.$id)} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${selectedProject === projectOption.$id ? 'border-accent bg-accent font-semibold text-accent-contrast' : 'border-border bg-surface text-text'}`}>{projectOption.name}</button>)}</HorizontalScroller>
    {offline && <div role="status" className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">Offline view. Showing the last saved project data; new logs and reports remain on this device until sync.</div>}
    {loading && <p role="status" className="text-sm text-muted">Loading site activity…</p>}
    {!loading && projects.length === 0 && <Card><p className="text-sm text-muted">No active project sites are configured yet.</p></Card>}
    {project && <>
      <section className="space-y-3">
        <Card className="site-progress-app__hero flex items-center gap-4">
          <svg className="size-[118px] shrink-0" viewBox="0 0 120 120" role="img" aria-label={`${overallProgress}% average contractor progress`}>
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--sp-line)" strokeWidth="12" />
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--sp-accent)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${circumference * overallProgress / 100} ${circumference}`} transform="rotate(-90 60 60)" />
            <text x="60" y="69" textAnchor="middle" fill="var(--sp-tile-ink)" fontSize="26" fontWeight="700">{overallProgress}%</text>
          </svg>
          <div className="min-w-0">
            <p className="text-sm text-muted">Project progress</p>
            <h2 className="mt-1 truncate text-xl font-semibold text-text">{project.name}</h2>
            {project.location && <p className="truncate text-sm text-muted">{project.location}</p>}
            <p className="mt-2 text-xs text-muted">{latestLog ? `Updated ${new Date(latestLog.log_date).toLocaleDateString()}` : 'No progress updates yet'}</p>
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-2">
          <Card className="site-progress-app__stat p-3"><b className="block text-2xl">{completeCount}</b><span className="text-xs">contractors complete</span></Card>
          <Card className="site-progress-app__stat p-3"><b className="block text-2xl">{contractors.length - completeCount}</b><span className="text-xs">in progress</span></Card>
          <Card className="site-progress-app__stat p-3"><b className="block text-2xl">{new Set(contractors.map((contractor) => contractor.trade)).size}</b><span className="text-xs">trade sections</span></Card>
        </div>
        {tradeProgress.length > 0 && <section className="space-y-2"><h2 className="text-lg font-semibold text-text">Trade progress</h2><Card className="p-3">
          <div className="grid h-[230px] gap-2" style={{ gridTemplateColumns: `24px repeat(${tradeProgress.length}, minmax(0, 1fr))` }}>
            <div className="relative text-[10px] text-muted">{[0,25,50,75,100].map((value)=><span key={value} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${value}%` }}>{value}</span>)}</div>
            {tradeProgress.map((entry) => <div key={entry.trade} className="relative overflow-hidden rounded-xl bg-surface-2">
              <span className="absolute inset-x-0 bottom-0 rounded-xl bg-accent" style={{ height: `${entry.current}%`, opacity: .78 }} />
              {entry.previous !== null && <span className="absolute inset-x-0 h-[2px] bg-text/70" style={{ bottom: `${entry.previous}%` }} />}
            </div>)}
          </div>
          <div className="mt-2 grid gap-2 text-center text-[11px] text-muted" style={{ gridTemplateColumns: `24px repeat(${tradeProgress.length}, minmax(0, 1fr))` }}><span />{tradeProgress.map((entry)=><span key={entry.trade} className="line-clamp-2"><b className="block text-text">{entry.trade}</b>{entry.current}%</span>)}</div>
          <p className="mt-2 text-xs text-muted">Bars show current contractor progress. Markers show the last recorded progress at least 30 days ago.</p>
        </Card></section>}
        <div><h2 className="text-lg font-semibold text-text">Phases &amp; items</h2><p className="mb-3 text-sm text-muted">Progress sections grouped by trade</p><ContractorGrid contractors={contractors} /></div>
      </section>
      <section className="space-y-3">
        <div><h2 className="text-lg font-semibold text-text">Look ahead</h2><p className="text-sm text-muted">Latest blockers reported by the site team</p></div>
        {lookAhead.length ? lookAhead.map((log) => {
          const contractor = contractors.find((item) => item.$id === log.contractor_id)
          return <Card key={log.$id}><p className="text-sm font-medium text-text">{contractor?.name ?? 'Site team'} · {new Date(log.log_date).toLocaleDateString()}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted">{log.blockers}</p></Card>
        }) : <Card><p className="text-sm text-muted">No blockers have been reported.</p></Card>}
      </section>
      {photoLogs.length > 0 && <section className="space-y-3"><div><h2 className="text-lg font-semibold text-text">Photo timeline</h2><p className="text-sm text-muted">Recent evidence attached to daily logs</p></div><HorizontalScroller label="Photo timeline" className="flex gap-2">{photoLogs.map((log) => <div key={log.$id} className="min-w-24 space-y-1"><p className="text-[11px] text-muted">{new Date(log.log_date).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</p><PhotoEvidence layout="strip" photos={log.photos ?? []} ownerId={log.$id} owner="site_logs" /></div>)}</HorizontalScroller></section>}
      {canWrite && <Button type="button" className="w-full" onClick={onNewLog}>Update progress</Button>}
    </>}
  </div>
}

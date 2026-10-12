import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSession } from '../../../core/auth/useSession'
import { CameraCapture } from '../../../core/evidence/CameraCapture'
import type { CapturedPhoto } from '../../../core/evidence/types'
import { Button } from '../../../core/ui/Button'
import { Card } from '../../../core/ui/Card'
import type { ReportProjectSection, ReportSection, SiteProject } from '../types'
import { queueSiteReport } from '../services/site-progress.service'

interface DraftSection { id: string; title: string; bullets: string; photos: CapturedPhoto[] }

export function ReportBuilderWizard({ projects, onPublished, onCancel }: { projects: SiteProject[]; onPublished: () => void; onCancel: () => void }) {
  const { session } = useSession()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('Weekly Site Progress Report')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [disclaimer, setDisclaimer] = useState('This report is a site progress update based on information recorded by the project team at the time of publication.')
  const [selected, setSelected] = useState<string[]>([])
  const [drafts, setDrafts] = useState<Record<string, DraftSection[]>>({})
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queued, setQueued] = useState(false)

  useEffect(() => {
    if (!selected.length && projects.length) setSelected([projects[0].$id])
  }, [projects, selected.length])

  const reportProjects = useMemo<ReportProjectSection[]>(() => selected.flatMap((projectId) => {
    const project = projects.find((p) => p.$id === projectId)
    if (!project) return []
    const sections: ReportSection[] = (drafts[projectId] ?? []).map((section) => ({
      id: section.id, title: section.title.trim(),
      bullets: section.bullets.split('\n').map((line) => line.trim()).filter(Boolean),
      photo_ids: section.photos.map((photo) => photo.id),
    }))
    return [{ project_id: project.$id, project_name: project.name, sections }]
  }), [selected, projects, drafts])

  const photos = useMemo(() => selected.flatMap((id) => (drafts[id] ?? []).flatMap((section) => section.photos)), [selected, drafts])

  function toggleProject(projectId: string) {
    if (selected.includes(projectId)) { setSelected(selected.filter((id) => id !== projectId)); return }
    if (!drafts[projectId]) setDrafts((items) => ({ ...items, [projectId]: [{ id: crypto.randomUUID(), title: 'Progress update', bullets: '', photos: [] }] }))
    setSelected([...selected, projectId])
  }

  function updateSection(projectId: string, sectionId: string, changes: Partial<DraftSection>) {
    setDrafts((old) => ({ ...old, [projectId]: (old[projectId] ?? []).map((section) => section.id === sectionId ? { ...section, ...changes } : section) }))
  }

  function addSection(projectId: string) {
    setDrafts((old) => ({ ...old, [projectId]: [...(old[projectId] ?? []), { id: crypto.randomUUID(), title: '', bullets: '', photos: [] }] }))
  }

  async function publish(event: FormEvent) {
    event.preventDefault()
    if (step !== 3) return
    if (!session) return
    setWorking(true); setError(null)
    try {
      await queueSiteReport({ title: title.trim(), report_date: new Date(`${date}T12:00:00.000Z`).toISOString(), author_name: session.profile.display_name, snapshot: { disclaimer: disclaimer.trim(), projects: reportProjects } }, session.user.id, photos)
      setQueued(true)
      onPublished()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not queue this report.') }
    finally { setWorking(false) }
  }

  if (queued) return <Card role="status" className="space-y-3"><h2 className="text-lg font-semibold text-text">Report saved on this device</h2><p className="text-sm text-muted">The report and its photos will sync when you reconnect. Published reports are immutable; corrections should be published as a new report.</p><Button type="button" onClick={onCancel}>Done</Button></Card>

  return <form onSubmit={(e) => void publish(e)} className="space-y-4">
    <Card className="space-y-4">
      <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">Step {step} of 3</p><h2 className="text-lg font-semibold text-text">{step === 1 ? 'Report details' : step === 2 ? 'Projects and evidence' : 'Review and publish'}</h2></div><span className="text-sm text-muted">{Math.round(step / 3 * 100)}%</span></div>
      <div className="h-1 overflow-hidden rounded bg-surface-2"><div className="h-full bg-accent transition-all" style={{ width: `${step / 3 * 100}%` }} /></div>
      {step === 1 && <div className="space-y-4">
        <label className="block space-y-1 text-sm"><span className="text-muted">Report title</span><input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text" /></label>
        <label className="block space-y-1 text-sm"><span className="text-muted">Report date</span><input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text" /></label>
        <label className="block space-y-1 text-sm"><span className="text-muted">Disclaimer</span><textarea required maxLength={1000} rows={3} value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} className="w-full rounded-xl border border-border bg-bg p-3 text-text" /></label>
      </div>}
      {step === 2 && <div className="space-y-4">
        <fieldset className="space-y-2"><legend className="mb-2 text-sm text-muted">Select projects to include</legend>{projects.map((project) => <label key={project.$id} className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 text-sm text-text"><input type="checkbox" checked={selected.includes(project.$id)} onChange={() => toggleProject(project.$id)} />{project.name}{project.location ? <span className="text-muted">· {project.location}</span> : null}</label>)}</fieldset>
        {selected.map((projectId) => {
          const project = projects.find((p) => p.$id === projectId)
          return <div key={projectId} className="space-y-3 border-t border-border pt-4"><h3 className="font-semibold text-text">{project?.name}</h3>
            {(drafts[projectId] ?? []).map((section, index) => <Card key={section.id} className="space-y-3">
              <div className="flex items-center justify-between"><p className="text-sm font-medium text-text">Section {index + 1}</p><button type="button" className="min-h-9 text-sm text-danger" onClick={() => setDrafts((old) => ({ ...old, [projectId]: old[projectId].filter((item) => item.id !== section.id) }))}>Remove</button></div>
              <input required maxLength={160} aria-label="Section heading" placeholder="Section heading" value={section.title} onChange={(e) => updateSection(projectId, section.id, { title: e.target.value })} className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text" />
              <textarea aria-label="Progress bullets" rows={3} maxLength={5000} placeholder="One progress point per line" value={section.bullets} onChange={(e) => updateSection(projectId, section.id, { bullets: e.target.value })} className="w-full rounded-xl border border-border bg-bg p-3 text-text" />
              <CameraCapture photos={section.photos} onChange={(next) => updateSection(projectId, section.id, { photos: next })} max={3} owner="reports" />
            </Card>)}
            <Button type="button" variant="secondary" onClick={() => addSection(projectId)}>Add section</Button>
          </div>
        })}
      </div>}
      {step === 3 && <div className="space-y-4 text-sm text-text">
        <div><p className="text-muted">Title</p><p className="font-medium">{title}</p><p className="text-muted">{new Date(`${date}T12:00:00`).toLocaleDateString()} · {session?.profile.display_name}</p></div>
        <p>{disclaimer}</p>
        {reportProjects.map((project) => <div key={project.project_id} className="space-y-2"><h3 className="font-semibold text-accent">{project.project_name}</h3>{project.sections.map((section) => <div key={section.id} className="rounded-xl border border-border p-3"><p className="font-medium">{section.title}</p><ul className="list-disc pl-5">{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><p className="mt-1 text-xs text-muted">{section.photo_ids.length} photo(s)</p></div>)}</div>)}
      </div>}
    </Card>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={step === 1} onClick={() => setStep((n) => Math.max(1, n - 1))}>Back</Button>{step < 3 ? <Button type="button" onClick={() => {
      if (step === 1 && (!title.trim() || !disclaimer.trim())) { setError('Complete the report title and disclaimer first.'); return }
      if (step === 2) {
        const invalid = selected.length === 0 || reportProjects.some((p) => !p.sections.length || p.sections.some((s) => !s.title.trim() || (!s.bullets.length && !s.photo_ids.length)))
        if (invalid) { setError('Each selected project needs a titled section with a progress point or photo.'); return }
      }
      setError(null); setStep((n) => Math.min(3, n + 1))
    }}>Continue</Button> : <Button type="submit" loading={working}>Publish report</Button>}<Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button></div>
  </form>
}

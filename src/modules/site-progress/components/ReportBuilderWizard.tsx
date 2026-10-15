import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { usePermissions, useSession } from '../../../core/auth/useSession'
import { readCache, db } from '../../../core/offline/db'
import { CameraCapture } from '../../../core/evidence/CameraCapture'
import type { CapturedPhoto } from '../../../core/evidence/types'
import { Button } from '../../../core/ui/Button'
import { Card } from '../../../core/ui/Card'
import type { ReportProjectSection, ReportSection, ReportSnapshot, SiteProject, SiteReport } from '../types'
import { changePendingReport, listContractors, queueSiteReport } from '../services/site-progress.service'
import { previewProjects } from '../demo-data'

interface DraftSection { id: string; title: string; bullets: string; photos: CapturedPhoto[]; existingPhotoIds?: string[] }
interface SavedDraft { title: string; date: string; disclaimer: string; selected: string[]; drafts: Record<string, DraftSection[]> }
const template = (): DraftSection[] => ['Construction & Structural Works', 'Showhouse Progress', 'Amenities', 'Look ahead'].map((title) => ({ id: crypto.randomUUID(), title, bullets: '', photos: [] }))

export function ReportBuilderWizard({ projects, initialReport, onPublished, onCancel }: { projects: SiteProject[]; initialReport?: SiteReport; onPublished: () => void; onCancel: () => void }) {
  const { session } = useSession()
  const { can } = usePermissions()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('Monthly Project Progress Report')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [disclaimer, setDisclaimer] = useState('This report is a site progress update based on information recorded by the project team at the time of publication.')
  const [selected, setSelected] = useState<string[]>([])
  const [drafts, setDrafts] = useState<Record<string, DraftSection[]>>({})
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queued, setQueued] = useState(false)
  const [ready, setReady] = useState(false)
  const [draftStatus, setDraftStatus] = useState('')
  const draftKey = initialReport?.$id ?? 'new'

  useEffect(() => {
    if (!session) return
    let active = true
    setReady(false)
    void readCache.get<SavedDraft>(`${session.user.id}:site-report-draft:${draftKey}`).then((saved) => {
      if (!active) return
      if (saved) {
        setTitle(saved.title); setDate(saved.date); setDisclaimer(saved.disclaimer); setSelected(saved.selected); setDrafts(saved.drafts)
        setDraftStatus('Restored your saved draft on this device.')
      } else if (initialReport) {
        const snapshot = JSON.parse(initialReport.snapshot) as ReportSnapshot
        setTitle(initialReport.title); setDate(initialReport.report_date.slice(0, 10)); setDisclaimer(snapshot.disclaimer)
        setSelected(snapshot.projects.map((project) => project.project_id))
        setDrafts(Object.fromEntries(snapshot.projects.map((project) => [project.project_id, project.sections.map((section) => ({ id: section.id, title: section.title, bullets: section.bullets.join('\n'), photos: [], existingPhotoIds: section.photo_ids }))])))
      }
      setReady(true)
    }).catch(() => { if (active) { setReady(true); setDraftStatus('Draft recovery unavailable. Keep this screen open until submitted.') } })
    return () => { active = false }
  }, [session?.user.id, draftKey])

  useEffect(() => {
    if (!ready || !session || queued) return
    void readCache.set(session.user.id, 'site-report-draft', draftKey, { title, date, disclaimer, selected, drafts } satisfies SavedDraft)
        .then(() => setDraftStatus('Draft saved on this device.'))
        .catch(() => setDraftStatus('Could not save draft on this device. Keep this screen open.'))
  }, [ready, session?.user.id, queued, draftKey, title, date, disclaimer, selected, drafts])

  useEffect(() => {
    if (!ready || initialReport || selected.length || !projects.length) return
    setSelected([projects[0].$id])
    setDrafts((current) => ({ ...current, [projects[0].$id]: current[projects[0].$id] ?? template() }))
  }, [projects, ready, initialReport, selected.length])

  const reportProjects = useMemo<ReportProjectSection[]>(() => selected.flatMap((projectId) => {
    const project = projects.find((p) => p.$id === projectId)
    if (!project) return []
    const sections: ReportSection[] = (drafts[projectId] ?? []).map((section) => ({
      id: section.id, title: section.title.trim(),
      bullets: section.bullets.split('\n').map((line) => line.trim()).filter(Boolean),
      photo_ids: [...(section.existingPhotoIds ?? []), ...section.photos.map((photo) => photo.id)],
    }))
    return [{ project_id: project.$id, project_name: project.name, sections }]
  }), [selected, projects, drafts])

  const photos = useMemo(() => selected.flatMap((id) => (drafts[id] ?? []).flatMap((section) => section.photos)), [selected, drafts])

  function toggleProject(projectId: string) {
    if (selected.includes(projectId)) { setSelected(selected.filter((id) => id !== projectId)); return }
    if (!drafts[projectId]) setDrafts((items) => ({ ...items, [projectId]: template() }))
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
      const input = { title: title.trim(), report_date: new Date(`${date}T12:00:00.000Z`).toISOString(), author_name: session.profile.display_name, snapshot: { disclaimer: disclaimer.trim(), projects: reportProjects } }
      if (!can('site', 'write')) throw new Error('Your role can prepare a local draft but cannot submit project reports.')
      if (initialReport) await changePendingReport(initialReport, session.user.id, { action: 'edit', title: input.title, report_date: input.report_date, snapshot: input.snapshot })
      else await queueSiteReport(input, session.user.id, photos)
      await db.cache.delete(`${session.user.id}:site-report-draft:${draftKey}`)
      setQueued(true)
      onPublished()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not queue this report.') }
    finally { setWorking(false) }
  }

  async function populateProject(projectId: string) {
    if (!session) return
    try {
      setError(null)
      const contractors = await listContractors(session.user.id, projectId)
      if (!contractors.length) { setError('This project has no recorded contractor updates yet. Add progress points to the template below.'); return }
      const trades = [...new Set(contractors.map((contractor) => contractor.trade))]
      setDrafts((current) => ({ ...current, [projectId]: [...(current[projectId] ?? []).filter((section) => section.bullets.trim() || section.photos.length || section.existingPhotoIds?.length), ...trades.map((trade) => ({ id: crypto.randomUUID(), title: trade, bullets: contractors.filter((contractor) => contractor.trade === trade).map((contractor) => `${contractor.name}: ${contractor.progress_pct}% complete.`).join('\n'), photos: [] }))] }))
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not load project updates.') }
  }

  function populateSample(projectId: string) {
    const sample = previewProjects[0]
    const sections: DraftSection[] = sample.sections.map((section) => ({
      id: crypto.randomUUID(), title: section.title,
      bullets: section.items.map((item) => `EXAMPLE — ${item.title}: ${item.progress}% complete${item.floor != null ? `, floor ${item.floor} of ${sample.floors}` : ''} (previously ${item.previous}%). ${item.note}`).join('\n'), photos: [],
    }))
    sections.push({ id: crypto.randomUUID(), title: 'Look ahead', bullets: `EXAMPLE — ${sample.lookAhead}`, photos: [] })
    setDrafts((current) => ({ ...current, [projectId]: [...(current[projectId] ?? []).filter((section) => section.bullets.trim() || section.photos.length || section.existingPhotoIds?.length), ...sections] }))
  }

  if (!ready) return <p role="status" className="text-sm text-muted">Restoring report draft…</p>
  if (queued) return <Card role="status" className="space-y-3"><h2 className="text-lg font-semibold text-text">Report saved · Pending approval</h2><p className="text-sm text-muted">Your updates are kept. A manager must review this report before it moves to Final. New reports sync from this device when connected.</p><Button type="button" onClick={onCancel}>Return to archive</Button></Card>

  return <form onSubmit={(e) => void publish(e)} className="space-y-4">
    <p role="status" className="text-xs text-muted">{draftStatus || 'Preparing draft…'}</p>
    <Card className="space-y-4">
      <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">Step {step} of 3 · Pending</p><h2 className="text-lg font-semibold text-text">{step === 1 ? 'Project report details' : step === 2 ? 'Projects, sections & progress' : 'Review and submit'}</h2></div><span className="text-sm text-muted">{Math.round(step / 3 * 100)}%</span></div>
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
          return <div key={projectId} className="space-y-3 border-t border-border pt-4"><h3 className="font-semibold text-text">{project?.name}</h3><div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={() => void populateProject(projectId)}>Populate from project updates</Button><Button type="button" variant="secondary" onClick={() => populateSample(projectId)}>Use reference sample</Button></div><p className="text-xs text-muted">Sample content is marked EXAMPLE. Replace it with verified measurements before submitting.</p>
            {(drafts[projectId] ?? []).map((section, index) => <Card key={section.id} className="space-y-3">
              <div className="flex items-center justify-between"><p className="text-sm font-medium text-text">Section {index + 1}</p><button type="button" className="min-h-9 text-sm text-danger" onClick={() => setDrafts((old) => ({ ...old, [projectId]: old[projectId].filter((item) => item.id !== section.id) }))}>Remove</button></div>
              <input required maxLength={160} aria-label="Section heading" placeholder="Section heading" value={section.title} onChange={(e) => updateSection(projectId, section.id, { title: e.target.value })} className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text" />
              <textarea aria-label="Progress bullets" rows={3} maxLength={5000} placeholder="One progress point per line" value={section.bullets} onChange={(e) => updateSection(projectId, section.id, { bullets: e.target.value })} className="w-full rounded-xl border border-border bg-bg p-3 text-text" />
              {!initialReport && <CameraCapture photos={section.photos} onChange={(next) => updateSection(projectId, section.id, { photos: next })} max={3} owner="reports" />}
              {initialReport && !!section.existingPhotoIds?.length && <p className="text-xs text-muted">{section.existingPhotoIds.length} existing photo(s) retained.</p>}
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
      if (step === 1 && (!title.trim() || !disclaimer.trim() || !date || Number.isNaN(Date.parse(`${date}T12:00:00.000Z`)))) { setError('Complete the report title, date and disclaimer first.'); return }
      if (step === 2) {
        const invalid = selected.length === 0 || reportProjects.length !== selected.length || reportProjects.some((p) => !p.sections.length || p.sections.length > 30 || p.sections.some((s) => !s.title.trim() || s.bullets.length > 30 || s.bullets.some((bullet) => bullet.length > 500) || (!s.bullets.length && !s.photo_ids.length)))
        if (invalid) { setError('Fill each section with a progress point or photo, or remove unused sections.'); return }
      }
      setError(null); setStep((n) => Math.min(3, n + 1))
    }}>Continue</Button> : <Button type="submit" loading={working} disabled={!can('site', 'write')}>{initialReport ? 'Save pending updates' : 'Submit for manager approval'}</Button>}<Button type="button" variant="ghost" onClick={onCancel}>Close · keep draft</Button></div>
    {!can('site', 'write') && <p className="text-sm text-muted">Your role can prepare a draft. Submission requires Site Progress write permission.</p>}
  </form>
}

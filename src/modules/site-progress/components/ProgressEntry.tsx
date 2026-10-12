import { useState, type FormEvent } from 'react'
import { useSession } from '../../../core/auth/useSession'
import { CameraCapture } from '../../../core/evidence/CameraCapture'
import type { CapturedPhoto } from '../../../core/evidence/types'
import { Button } from '../../../core/ui/Button'
import { Card } from '../../../core/ui/Card'
import type { Contractor, SiteLog, SiteStatus } from '../types'
import { queueSiteLog, queueSiteLogUpdate } from '../services/site-progress.service'

export function ProgressEntry({ projectId, contractors, existing, onSaved, onCancel }: {
  projectId: string
  contractors: Contractor[]
  existing?: SiteLog
  onSaved: () => void
  onCancel: () => void
}) {
  const { session } = useSession()
  const [contractorId, setContractorId] = useState(existing?.contractor_id ?? '')
  const [date, setDate] = useState(existing ? new Date(existing.log_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [workDone, setWorkDone] = useState(existing?.work_done ?? '')
  const [materials, setMaterials] = useState(existing?.materials_used ?? '')
  const [blockers, setBlockers] = useState(existing?.blockers ?? '')
  const [status, setStatus] = useState<SiteStatus>(existing?.status ?? 'on_track')
  const [progress, setProgress] = useState(existing?.progress_pct == null ? '' : String(existing.progress_pct))
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [queued, setQueued] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!session || (!existing && !contractorId)) { setError('Select a contractor.'); return }
    setSaving(true); setError(null)
    try {
      const changes = { work_done: workDone.trim(), materials_used: materials.trim() || null, blockers: blockers.trim() || null, status, progress_pct: progress === '' ? null : Number(progress) }
      if (existing) await queueSiteLogUpdate(existing, changes, session.user.id)
      else await queueSiteLog({
        project_id: projectId, contractor_id: contractorId,
        log_date: new Date(`${date}T12:00:00.000Z`).toISOString(), ...changes,
      }, session.user.id, photos)
      setQueued(true)
      onSaved()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save this site log.') }
    finally { setSaving(false) }
  }

  if (queued) return <Card role="status" className="space-y-3"><h2 className="text-lg font-semibold text-text">{existing ? 'Log update saved on this device' : 'Log saved on this device'}</h2><p className="text-sm text-muted">{existing ? 'Your update will sync when a connection is available.' : 'Photos upload first; the log will sync when a connection is available. Evidence without GPS or with a clock difference is marked unverified.'}</p><Button type="button" onClick={onCancel}>Done</Button></Card>

  return <form onSubmit={(event) => void submit(event)} className="space-y-4">
    <Card className="space-y-4">
      <div><h2 className="text-lg font-semibold text-text">{existing ? 'Edit daily site log' : 'Daily site log'}</h2><p className="text-sm text-muted">{existing ? 'The author can edit this entry within 24 hours.' : 'Entries sync from this device when a connection is available.'}</p></div>
      <label className="block space-y-1 text-sm"><span className="text-muted">Work date</span><input required type="date" disabled={!!existing} value={date} onChange={(e) => setDate(e.target.value)} className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text disabled:opacity-60" /></label>
      <label className="block space-y-1 text-sm"><span className="text-muted">Contractor</span><select required disabled={!!existing} value={contractorId} onChange={(e) => setContractorId(e.target.value)} className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text disabled:opacity-60"><option value="">Choose contractor</option>{contractors.map((c) => <option key={c.$id} value={c.$id}>{c.name} · {c.trade}</option>)}</select></label>
      <label className="block space-y-1 text-sm"><span className="text-muted">Work completed</span><textarea required minLength={2} maxLength={2000} rows={4} value={workDone} onChange={(e) => setWorkDone(e.target.value)} className="w-full rounded-xl border border-border bg-bg p-3 text-text" placeholder="Describe the work completed today" /></label>
      <label className="block space-y-1 text-sm"><span className="text-muted">Materials used</span><textarea maxLength={2000} rows={2} value={materials} onChange={(e) => setMaterials(e.target.value)} className="w-full rounded-xl border border-border bg-bg p-3 text-text" /></label>
      <label className="block space-y-1 text-sm"><span className="text-muted">Blockers</span><textarea maxLength={2000} rows={2} value={blockers} onChange={(e) => setBlockers(e.target.value)} className="w-full rounded-xl border border-border bg-bg p-3 text-text" placeholder="None" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm"><span className="text-muted">Status</span><select value={status} onChange={(e) => setStatus(e.target.value as SiteStatus)} className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text"><option value="on_track">On track</option><option value="delayed">Delayed</option><option value="blocked">Blocked</option></select></label>
        <label className="block space-y-1 text-sm"><span className="text-muted">Contractor progress % (optional)</span><input type="number" min="0" max="100" value={progress} onChange={(e) => setProgress(e.target.value)} className="min-h-12 w-full rounded-xl border border-border bg-bg px-3 text-text" /></label>
      </div>
    </Card>
    {!existing && <CameraCapture photos={photos} onChange={setPhotos} max={3} owner="site_logs" />}
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    <div className="flex gap-2"><Button type="submit" loading={saving}>Save log</Button><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button></div>
  </form>
}

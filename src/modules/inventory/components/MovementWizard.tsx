import { useState } from 'react'
import { useSession } from '../../../core/auth/useSession'
import { Button } from '../../../core/ui/Button'
import { CameraCapture } from '../../../core/evidence/CameraCapture'
import type { CapturedPhoto } from '../../../core/evidence/types'
import { queueMovement } from '../services/inventory.service'
import type { InventoryItem, MovementInput, MovementType } from '../types'

export function MovementWizard({ items, onSaved, onCancel }: { items: InventoryItem[]; onSaved: () => void; onCancel: () => void }) {
  const { session } = useSession()
  const [itemId, setItemId] = useState(items[0]?.$id ?? '')
  const [type, setType] = useState<MovementType>('dispatch')
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const item = items.find((row) => row.$id === itemId)
  async function submit(form: FormData) {
    if (!item || !session) return
    const quantity = Number(form.get('quantity'))
    if (!Number.isInteger(quantity) || quantity <= 0) { setError('Enter a whole quantity greater than zero.'); return }
    if (type === 'dispatch' && quantity > item.quantity_on_hand) { setError('Quantity exceeds stock available.'); return }
    setSaving(true); setError('')
    try {
      const input: MovementInput = {
        item_id: item.$id, type, quantity, base_version: item.version,
        from_location: String(form.get('from_location') ?? '').trim() || undefined,
        to_location: String(form.get('to_location') ?? '').trim() || undefined,
        custodian_id: String(form.get('custodian_id') ?? '').trim() || undefined,
        project_id: String(form.get('project_id') ?? '').trim() || undefined,
        note: String(form.get('note') ?? '').trim() || undefined,
        occurred_at_client: new Date().toISOString(), photos,
      }
      await queueMovement(input, item, session.user.id)
      onSaved()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not queue movement.') }
    finally { setSaving(false) }
  }
  return <section className="space-y-4" aria-labelledby="movement-title">
    <div><h2 id="movement-title" className="text-lg font-semibold text-text">Record movement</h2><p className="text-sm text-muted">Stock changes when the movement is accepted by the server. Queued entries are shown immediately.</p></div>
    <form action={(data) => void submit(data)} className="space-y-3">
      <label className="block space-y-1 text-sm text-muted">Item<select value={itemId} onChange={(event) => setItemId(event.target.value)} required className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-text">{items.map((row) => <option key={row.$id} value={row.$id}>{row.name} · {row.quantity_on_hand} {row.unit}</option>)}</select></label>
      <label className="block space-y-1 text-sm text-muted">Movement type<select value={type} onChange={(event) => setType(event.target.value as MovementType)} className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-text"><option value="dispatch">Dispatch</option><option value="receipt">Receipt</option>{item?.kind === 'returnable' && <option value="return">Return</option>}{session?.profile.is_admin && <option value="adjustment">Stock adjustment (inbound)</option>}</select></label>
      <label className="block space-y-1 text-sm text-muted">Quantity<input required name="quantity" type="number" min="1" max="100000" step="1" defaultValue="1" className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-text" /></label>
      <div className="grid gap-3 sm:grid-cols-2"><input name="from_location" placeholder="From location" aria-label="From location" className="min-h-12 rounded-xl border border-border bg-surface px-3 text-text" /><input name="to_location" placeholder="To location" aria-label="To location" className="min-h-12 rounded-xl border border-border bg-surface px-3 text-text" /><input name="custodian_id" placeholder="Custodian user ID (if assigned)" aria-label="Custodian user ID" className="min-h-12 rounded-xl border border-border bg-surface px-3 text-text" /><input name="project_id" placeholder="Project ID (optional)" aria-label="Project ID" className="min-h-12 rounded-xl border border-border bg-surface px-3 text-text" /></div>
      <textarea name="note" rows={2} placeholder="Notes" aria-label="Movement notes" className="w-full rounded-xl border border-border bg-surface p-3 text-text" />
      <CameraCapture photos={photos} onChange={setPhotos} owner="movements" />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2"><Button loading={saving} disabled={!item}>Save movement</Button><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button></div>
    </form>
  </section>
}

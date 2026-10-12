import { useState } from 'react'
import { apiFetch } from '../../../core/api/client'
import { ENDPOINTS } from '../../../core/api/endpoints'
import { useSession } from '../../../core/auth/useSession'
import { Button } from '../../../core/ui/Button'
import { Card } from '../../../core/ui/Card'
import type { InventoryItem } from '../types'

export function StockList({ items, loading, onChanged }: { items: InventoryItem[]; loading: boolean; onChanged: () => void }) {
  const { session } = useSession()
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  async function create(form: FormData) {
    setAdding(true); setError('')
    try {
      await apiFetch(ENDPOINTS.inventoryItems, { method: 'POST', body: { sku: form.get('sku'), name: form.get('name'), category: form.get('category') || undefined, kind: form.get('kind'), unit: form.get('unit'), reorder_level: form.get('reorder_level') ? Number(form.get('reorder_level')) : undefined } })
      onChanged()
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not add the item.') }
    finally { setAdding(false) }
  }
  return <section className="space-y-3" aria-labelledby="inventory-stock-title">
    <div className="flex items-center justify-between"><h2 id="inventory-stock-title" className="font-semibold text-text">Stock</h2><span className="text-sm text-muted">{items.length} items</span></div>
    {session?.profile.is_admin && <details className="rounded-2xl border border-border bg-surface p-4"><summary className="cursor-pointer font-medium text-text">Add catalogue item</summary><form action={(data) => void create(data)} className="mt-3 grid gap-3 sm:grid-cols-2">
      <input required name="sku" placeholder="SKU" aria-label="SKU" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-text" />
      <input required name="name" placeholder="Item name" aria-label="Item name" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-text" />
      <input name="category" placeholder="Category" aria-label="Category" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-text" />
      <input required name="unit" placeholder="Unit (e.g. pcs)" aria-label="Unit" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-text" />
      <select name="kind" aria-label="Item kind" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-text"><option value="consumable">Consumable</option><option value="returnable">Returnable asset</option></select>
      <input name="reorder_level" type="number" min="0" placeholder="Reorder level" aria-label="Reorder level" className="min-h-11 rounded-xl border border-border bg-surface px-3 text-text" />
      <Button loading={adding}>Save item</Button>{error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </form></details>}
    {loading && !items.length && <p role="status" className="text-sm text-muted">Loading stock…</p>}
    {!loading && !items.length && <Card><p className="text-sm text-muted">No stock catalogue items are available yet. An administrator can add the first item.</p></Card>}
    <ul className="grid gap-3 sm:grid-cols-2">{items.map((item) => <li key={item.$id}><Card className="flex items-start justify-between gap-3"><div><p className="font-semibold text-text">{item.name}</p><p className="text-xs text-muted">{item.sku} · {item.kind === 'returnable' ? 'Returnable' : 'Consumable'}</p>{item.category && <p className="text-sm text-muted">{item.category}</p>}</div><div className="text-right"><p className={`text-xl font-semibold ${(item.reorder_level != null && item.quantity_on_hand <= item.reorder_level) ? 'text-warning' : 'text-text'}`}>{item.quantity_on_hand} <span className="text-sm font-normal">{item.unit}</span></p>{item.reorder_level != null && item.quantity_on_hand <= item.reorder_level && <p className="text-xs text-warning">At/below reorder level</p>}</div></Card></li>)}</ul>
  </section>
}

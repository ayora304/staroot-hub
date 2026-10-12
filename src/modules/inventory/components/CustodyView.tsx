import { Card } from '../../../core/ui/Card'
import type { InventoryItem, Movement } from '../types'

export function CustodyView({ items, movements }: { items: InventoryItem[]; movements: Movement[] }) {
  const assets = items.filter((item) => item.kind === 'returnable')
  const custody = new Map<string, { item: InventoryItem; quantity: number; last: string }>()
  for (const row of [...movements].reverse()) {
    if (!row.custodian_id || !['dispatch', 'return'].includes(row.type)) continue
    const item = assets.find((candidate) => candidate.$id === row.item_id)
    if (!item) continue
    const key = `${row.item_id}:${row.custodian_id}`
    const current = custody.get(key) ?? { item, quantity: 0, last: row.$createdAt }
    current.quantity += row.type === 'dispatch' ? row.quantity : -row.quantity
    current.last = row.occurred_at_client ?? row.$createdAt
    custody.set(key, current)
  }
  const rows = [...custody.entries()].filter(([, row]) => row.quantity > 0).sort((a, b) => a[0].localeCompare(b[0]))
  return <section className="space-y-3" aria-labelledby="custody-title"><h2 id="custody-title" className="font-semibold text-text">Asset custody</h2>{rows.length ? <ul className="grid gap-3 sm:grid-cols-2">{rows.map(([key, row]) => <li key={key}><Card><p className="font-semibold text-text">{row.item.name}</p><p className="text-sm text-muted">{row.quantity} {row.item.unit} with {key.split(':').slice(1).join(':')}</p><p className="text-xs text-muted">Last movement {new Date(row.last).toLocaleString()}</p></Card></li>)}</ul> : <Card><p className="text-sm text-muted">No returnable assets are currently recorded as held by a custodian.</p></Card>}</section>
}

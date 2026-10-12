import { useMemo, useState } from 'react'
import { Card } from '../../../core/ui/Card'
import { PhotoEvidence } from '../../../core/evidence/PhotoEvidence'
import type { Movement } from '../types'

const statusLabel = (status?: Movement['local_status']) => status === 'pending' ? 'Queued offline' : status === 'syncing' ? 'Syncing' : status === 'failed' ? 'Sync failed' : status === 'needs_review' ? 'Needs review' : 'Synced'
export function MovementLog({ movements }: { movements: Movement[] }) {
  const [filter, setFilter] = useState('')
  const rows = useMemo(() => {
    const value = filter.trim().toLowerCase()
    return movements.filter((row) => !value || [row.item_name, row.type, row.from_location, row.to_location, row.custodian_id, row.note].some((part) => part?.toLowerCase().includes(value)))
  }, [filter, movements])
  return <section className="space-y-3" aria-labelledby="movement-log-title"><h2 id="movement-log-title" className="font-semibold text-text">Movement log</h2><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search item, location, custodian, note" aria-label="Search movement log" className="min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-text" />
    {rows.length === 0 && <Card><p className="text-sm text-muted">No movements match this search.</p></Card>}
    <ol className="space-y-3">{rows.map((row) => <li key={row.$id}><Card className="space-y-2"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold capitalize text-text">{row.type} · {row.item_name ?? row.item_id}</p><p className="text-sm text-muted">{row.quantity} · {new Date(row.occurred_at_client ?? row.$createdAt).toLocaleString()}</p></div><span className="rounded-full bg-surface-2 px-2 py-1 text-xs text-muted">{statusLabel(row.local_status)}</span></div><p className="text-sm text-muted">{row.from_location || '—'} → {row.to_location || '—'}{row.custodian_id ? ` · custodian ${row.custodian_id}` : ''}</p>{row.note && <p className="text-sm text-text">{row.note}</p>}{row.photos?.length ? <PhotoEvidence photos={row.photos} ownerId={row.$id} owner="movements" /> : null}</Card></li>)}</ol>
  </section>
}

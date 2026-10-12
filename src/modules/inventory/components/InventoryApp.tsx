import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePermissions } from '../../../core/auth/useSession'
import { Button } from '../../../core/ui/Button'
import { Card } from '../../../core/ui/Card'
import { useInventory } from '../hooks/use-inventory'
import { CustodyView } from './CustodyView'
import { DispatchSummary } from './DispatchSummary'
import { MovementLog } from './MovementLog'
import { MovementWizard } from './MovementWizard'
import { StockList } from './StockList'

export function InventoryApp() {
  const { can } = usePermissions()
  const data = useInventory()
  const [showWizard, setShowWizard] = useState(false)
  const writable = can('inventory', 'write')
  const latestDispatch = data.movements.find((movement) => movement.type === 'dispatch')
  return <main className="min-h-screen-safe mx-auto max-w-3xl space-y-5 px-safe pb-safe pt-safe">
    <header className="flex items-center justify-between gap-3 border-b border-border py-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">Staroot Hub</p><h1 className="text-lg font-semibold text-text">Inventory &amp; Logistics</h1></div><Link to="/" className="min-h-11 rounded-xl px-3 py-2 text-sm text-muted">Hub</Link></header>
    {data.offline && <p role="status" className="rounded-xl bg-warning/10 p-3 text-sm text-warning">Offline mode · showing cached stock and movements. New entries will queue on this device.</p>}
    {data.sync.pending + data.sync.syncing + data.sync.failed + data.sync.needsReview > 0 && <Card><p className="text-sm text-text">{data.sync.pending + data.sync.syncing} queued/syncing · {data.sync.failed} failed · {data.sync.needsReview} need review</p></Card>}
    {data.error && <p role="alert" className="text-sm text-danger">{data.error}</p>}
    {!showWizard && writable && <Button type="button" onClick={() => setShowWizard(true)} disabled={!data.items.length}>Record movement</Button>}
    {showWizard && <MovementWizard items={data.items} onSaved={() => { setShowWizard(false); data.reload() }} onCancel={() => setShowWizard(false)} />}
    {data.movements.length > 0 && <DispatchSummary movement={latestDispatch} />}
    <StockList items={data.items} loading={data.loading} onChanged={data.reload} />
    <CustodyView items={data.items} movements={data.movements} />
    <MovementLog movements={data.movements} />
  </main>
}

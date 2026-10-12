import { Card } from '../../../core/ui/Card'
import type { Contractor } from '../types'

export function ContractorGrid({ contractors }: { contractors: Contractor[] }) {
  if (!contractors.length) return <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">No active contractors are assigned to this project.</p>
  return <div className="grid gap-3 sm:grid-cols-2">
    {contractors.map((contractor) => <Card key={contractor.$id} className="space-y-3">
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-medium text-text">{contractor.name}</h3><p className="text-sm text-muted">{contractor.trade}</p></div><span className="text-lg font-semibold tabular-nums text-accent">{contractor.progress_pct}%</span></div>
      <div role="progressbar" aria-label={`${contractor.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={contractor.progress_pct} className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.min(100, Math.max(0, contractor.progress_pct))}%` }} /></div>
    </Card>)}
  </div>
}

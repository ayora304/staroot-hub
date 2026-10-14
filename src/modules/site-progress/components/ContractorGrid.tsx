import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Contractor } from '../types'

export function ContractorGrid({ contractors }: { contractors: Contractor[] }) {
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null)
  if (!contractors.length) return <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted">No active contractors are assigned to this project.</p>
  const trades = [...new Set(contractors.map((contractor) => contractor.trade))]
  return <div className="space-y-3">
    {trades.map((trade) => {
      const items = contractors.filter((contractor) => contractor.trade === trade)
      const average = Math.round(items.reduce((sum, item) => sum + item.progress_pct, 0) / items.length)
      const expanded = expandedTrade === trade
      return <section key={trade} className="overflow-hidden rounded-2xl border border-border bg-surface">
        <button type="button" aria-expanded={expanded} onClick={() => setExpandedTrade(expanded ? null : trade)} className="flex min-h-[72px] w-full items-center gap-3 p-4 text-left text-text">
          <span className="min-w-0 flex-1"><b className="block">{trade}</b><span className="text-xs text-muted">{items.length} {items.length === 1 ? 'contractor' : 'contractors'}</span><span className="mt-2 block h-2 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(0, average))}%` }} /></span></span>
          <b className="text-lg tabular-nums text-accent">{average}%</b>
          {expanded ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
        </button>
        {expanded && <ul className="divide-y divide-border border-t border-border px-4">
          {items.map((contractor) => <li key={contractor.$id} className="flex items-center gap-3 py-3 text-sm">
            <span className="min-w-0 flex-1 truncate text-text">{contractor.name}</span><span className="font-semibold tabular-nums text-muted">{contractor.progress_pct}%</span>
          </li>)}
        </ul>}
      </section>
    })}
  </div>
}

import { Icon } from '../../../core/ui/Icons'
import { StatusPill } from '../../../core/ui/StatusPill'
import type { ComingSoon } from '../registry'

export function ComingSoonCard({ item }: { item: ComingSoon }) {
  return (
    <div aria-disabled="true" className="flex min-h-20 min-w-0 items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/50 p-3 opacity-80 sm:p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
        <Icon name={item.icon} className="size-4" />
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-muted">{item.label}</span>
      <StatusPill>Soon</StatusPill>
    </div>
  )
}

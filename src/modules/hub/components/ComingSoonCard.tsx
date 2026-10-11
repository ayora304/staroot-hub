import { Icon } from '../../../core/ui/Icons'
import { StatusPill } from '../../../core/ui/StatusPill'
import type { ComingSoon } from '../registry'

export function ComingSoonCard({ item }: { item: ComingSoon }) {
  return (
    <div aria-disabled="true" className="flex min-h-20 items-center gap-3 rounded-2xl border border-dashed border-border bg-surface/50 p-4 opacity-80">
      <span className="grid size-10 place-items-center rounded-xl bg-surface-2 text-muted">
        <Icon name={item.icon} className="size-5" />
      </span>
      <span className="flex-1 font-medium text-muted">{item.label}</span>
      <StatusPill>Coming soon</StatusPill>
    </div>
  )
}

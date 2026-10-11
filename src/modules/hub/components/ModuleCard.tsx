import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Icon } from '../../../core/ui/Icons'
import type { HubModule } from '../registry'
import { PendingBadge } from './PendingBadge'

export function ModuleCard({ module, pending = 0 }: { module: HubModule; pending?: number }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link
        to={module.route}
        className="flex min-h-24 items-center gap-4 rounded-2xl border border-border bg-surface p-4 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent">
          <Icon name={module.icon} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-text">{module.label}</span>
          <span className="block text-sm text-muted">{module.blurb}</span>
        </span>
        <PendingBadge count={pending} />
      </Link>
    </motion.div>
  )
}

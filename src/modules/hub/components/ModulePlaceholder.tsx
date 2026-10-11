import { Link } from 'react-router-dom'
import { EmptyState } from '../../../core/ui/EmptyState'
import type { HubModule } from '../registry'

export function ModulePlaceholder({ module }: { module: HubModule }) {
  return (
    <EmptyState
      title={module.label}
      body={`This module is built in Phase ${module.phase}. Your access is confirmed; the screen is not available yet.`}
      action={<Link to="/" className="min-h-11 rounded-xl border border-border px-4 py-3 text-sm text-text">Back to Hub</Link>}
    />
  )
}

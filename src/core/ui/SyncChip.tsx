import { StatusPill } from './StatusPill'

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'needs_review'

const MAP: Record<SyncStatus, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' }> = {
  pending: { label: 'Pending', tone: 'warning' },
  syncing: { label: 'Syncing', tone: 'accent' },
  synced: { label: 'Synced', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  needs_review: { label: 'Needs review', tone: 'danger' },
}

/** Presentational only in Phase 1. Phase 2 wires it to the outbox. */
export function SyncChip({ status }: { status: SyncStatus }) {
  const { label, tone } = MAP[status]
  return <StatusPill tone={tone}>{label}</StatusPill>
}

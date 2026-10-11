import { useSyncExternalStore } from 'react';
import { syncEngine } from './instance';
import type { SyncSnapshot } from './types';

export { syncEngine, outboxStore } from './instance';
export { createSyncEngine, classifyError, backoffMs } from './syncEngine';
export * from './types';

/** Live sync status for badges and status chips. */
export function useSyncStatus(): SyncSnapshot {
  return useSyncExternalStore(syncEngine.subscribe, syncEngine.getSnapshot, syncEngine.getSnapshot);
}

/** Total items not yet synced (pending + syncing + failed + needs review). */
export function unsyncedCount(s: SyncSnapshot): number {
  return s.pending + s.syncing + s.failed + s.needsReview;
}

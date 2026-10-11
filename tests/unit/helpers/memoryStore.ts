import type { OutboxCounts, OutboxItem, OutboxStore } from '../../../src/core/offline/types';

/** Same contract as the Dexie store, without IndexedDB. Used by the engine tests. */
export function createMemoryStore(): OutboxStore {
  const items = new Map<string, OutboxItem>();
  const blobs = new Map<string, Blob>();
  let seq = 0;
  const ordered = () => [...items.values()].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  return {
    async add(item, blobList) {
      const existing = items.get(item.id);
      if (existing) return existing;
      for (const b of blobList) blobs.set(b.id, b.blob);
      const saved = { ...item, seq: ++seq };
      items.set(saved.id, saved);
      return saved;
    },
    async get(id) { return items.get(id); },
    async nextDue(now) {
      return ordered().find((i) => i.status === 'pending' && i.nextAttemptAt <= now);
    },
    async nextDueAt() {
      const p = ordered().filter((i) => i.status === 'pending');
      return p.length ? Math.min(...p.map((i) => i.nextAttemptAt)) : null;
    },
    async patch(id, patch) {
      const cur = items.get(id);
      if (cur) items.set(id, { ...cur, ...patch });
    },
    async remove(id) {
      const cur = items.get(id);
      if (!cur) return;
      cur.blobIds.forEach((b) => blobs.delete(b));
      items.delete(id);
    },
    async recoverStuck() {
      for (const i of items.values()) if (i.status === 'syncing') i.status = 'pending';
    },
    async resetFailed(now) {
      let n = 0;
      for (const i of items.values()) {
        if (i.status === 'failed') {
          Object.assign(i, { status: 'pending', attempts: 0, nextAttemptAt: now, lastError: undefined });
          n++;
        }
      }
      return n;
    },
    async counts(): Promise<OutboxCounts> {
      const c: OutboxCounts = { pending: 0, syncing: 0, failed: 0, needsReview: 0 };
      for (const i of items.values()) {
        if (i.status === 'pending') c.pending++;
        else if (i.status === 'syncing') c.syncing++;
        else if (i.status === 'failed') c.failed++;
        else c.needsReview++;
      }
      return c;
    },
    async getBlob(id) { return blobs.get(id); },
    async clear() { items.clear(); blobs.clear(); },
  };
}
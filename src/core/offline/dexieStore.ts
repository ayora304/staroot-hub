import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { BlobInput, OutboxCounts, OutboxItem, OutboxStore } from './types';

interface StoredBlob {
  id: string;
  blob: Blob;
}

// Separate database from the session/meta DB so the two can never conflict.
class OutboxDB extends Dexie {
  items!: Table<OutboxItem, number>;
  blobs!: Table<StoredBlob, string>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({
      items: '++seq, &id, status',
      blobs: 'id',
    });
  }
}

export function createDexieStore(dbName = 'staroot-outbox'): OutboxStore {
  const db = new OutboxDB(dbName);

  return {
    async add(item, blobs: BlobInput[]) {
      return db.transaction('rw', db.items, db.blobs, async () => {
        const existing = await db.items.where('id').equals(item.id).first();
        if (existing) return existing;
        for (const b of blobs) await db.blobs.put({ id: b.id, blob: b.blob });
        const seq = await db.items.add({ ...item });
        return { ...item, seq };
      });
    },

    get: (id) => db.items.where('id').equals(id).first(),

    async nextDue(now) {
      const due = await db.items
        .where('status')
        .equals('pending')
        .filter((i) => i.nextAttemptAt <= now)
        .sortBy('seq');
      return due[0];
    },

    async nextDueAt() {
      const pending = await db.items.where('status').equals('pending').toArray();
      if (pending.length === 0) return null;
      return Math.min(...pending.map((i) => i.nextAttemptAt));
    },

    async patch(id, patch) {
      await db.items.where('id').equals(id).modify(patch);
    },

    async remove(id) {
      await db.transaction('rw', db.items, db.blobs, async () => {
        const item = await db.items.where('id').equals(id).first();
        if (!item) return;
        if (item.blobIds.length) await db.blobs.bulkDelete(item.blobIds);
        await db.items.where('id').equals(id).delete();
      });
    },

    async recoverStuck() {
      await db.items.where('status').equals('syncing').modify({ status: 'pending' });
    },

    async resetFailed(now) {
      return db.items
        .where('status')
        .equals('failed')
        .modify({ status: 'pending', attempts: 0, nextAttemptAt: now, lastError: undefined });
    },

    async counts(): Promise<OutboxCounts> {
      const all = await db.items.toArray();
      const c: OutboxCounts = { pending: 0, syncing: 0, failed: 0, needsReview: 0 };
      for (const i of all) {
        if (i.status === 'pending') c.pending++;
        else if (i.status === 'syncing') c.syncing++;
        else if (i.status === 'failed') c.failed++;
        else if (i.status === 'needs_review') c.needsReview++;
      }
      return c;
    },

    async getBlob(id) {
      return (await db.blobs.get(id))?.blob;
    },

    async clear() {
      await db.transaction('rw', db.items, db.blobs, async () => {
        await db.items.clear();
        await db.blobs.clear();
      });
    },
  };
}

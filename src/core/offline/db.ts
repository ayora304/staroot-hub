// Phase 1: only a `meta` table (cached session so the app can open offline).
// Phase 2 adds the outbox, blobs and per-collection caches to this same database.
import Dexie, { type Table } from 'dexie'

export interface MetaRow {
  key: string
  value: unknown
}

class StarootDB extends Dexie {
  meta!: Table<MetaRow, string>
  constructor() {
    super('staroot-hub')
    this.version(1).stores({ meta: 'key' })
  }
}

export const db = new StarootDB()

export const sessionCache = {
  async save(value: unknown) {
    await db.meta.put({ key: 'session', value })
  },
  async load<T>(): Promise<T | null> {
    return ((await db.meta.get('session'))?.value as T | undefined) ?? null
  },
  async clear() {
    await db.meta.delete('session')
  },
}

/**
 * Wipes every local table. TODO(Phase 2): refuse or warn when the outbox still
 * holds unsynced items, otherwise sign-out would destroy unsent work.
 */
export async function clearAllLocalData() {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })
}

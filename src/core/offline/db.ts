// Local session and read caches. Outbox data stays in its own database.
import Dexie, { type Table } from 'dexie'

export interface MetaRow {
  key: string
  value: unknown
}

export interface CacheRow {
  key: string
  user_id: string
  kind: string
  group_key: string
  value: unknown
  updated_at: number
}

class StarootDB extends Dexie {
  meta!: Table<MetaRow, string>
  cache!: Table<CacheRow, string>
  constructor() {
    super('staroot-hub')
    this.version(1).stores({ meta: 'key' })
    this.version(2).stores({ meta: 'key', cache: 'key, user_id, [user_id+kind+group_key]' })
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

export const readCache = {
  async get<T>(key: string): Promise<T | null> {
    return ((await db.cache.get(key))?.value as T | undefined) ?? null
  },
  async set(userId: string, kind: string, groupKey: string, value: unknown): Promise<void> {
    const key = `${userId}:${kind}:${groupKey}`
    await db.cache.put({ key, user_id: userId, kind, group_key: groupKey, value, updated_at: Date.now() })
  },
  async clearUser(userId: string): Promise<void> {
    await db.cache.where('user_id').equals(userId).delete()
  },
}

/** Clears the session and read cache. Account-owned outbox rows/blobs live in a separate DB and remain resumable after sign-in. */
export async function clearAllLocalData() {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })
}

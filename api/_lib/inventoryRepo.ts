import { Databases, ID, Query } from 'node-appwrite'
import type { InventoryItem, Movement } from '../../src/modules/inventory/types'
import { adminClient, DB_ID } from './appwrite'

const db = () => new Databases(adminClient())
const cast = <T>(value: unknown) => value as T
const code = (e: unknown) => (e as { code?: number } | null)?.code
export const isInventoryConflict = (e: unknown) => code(e) === 409

export async function listInventoryItems(): Promise<InventoryItem[]> {
  const { documents } = await db().listDocuments(DB_ID(), 'inventory_items', [Query.equal('active', [true]), Query.orderAsc('name'), Query.limit(200)])
  return documents.map((row) => cast<InventoryItem>(row))
}
export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  try { return cast<InventoryItem>(await db().getDocument(DB_ID(), 'inventory_items', id)) }
  catch (e) { if (code(e) === 404) return null; throw e }
}
export async function createInventoryItem(data: Record<string, unknown>): Promise<InventoryItem> {
  return cast<InventoryItem>(await db().createDocument(DB_ID(), 'inventory_items', ID.unique(), data))
}
export async function findMovement(clientId: string): Promise<Movement | null> {
  const { documents } = await db().listDocuments(DB_ID(), 'movements', [Query.equal('client_id', [clientId]), Query.limit(1)])
  return documents[0] ? cast<Movement>(documents[0]) : null
}
export async function getMovement(id: string): Promise<Movement | null> {
  try { return cast<Movement>(await db().getDocument(DB_ID(), 'movements', id)) }
  catch (e) { if (code(e) === 404) return null; throw e }
}
export async function listMovements(filters: { itemId?: string; custodianId?: string; type?: string }): Promise<Movement[]> {
  const rows: Movement[] = []
  let cursor: string | undefined
  while (true) {
    const queries = [Query.orderDesc('$createdAt'), Query.limit(500)]
    if (filters.itemId) queries.push(Query.equal('item_id', [filters.itemId]))
    if (filters.custodianId) queries.push(Query.equal('custodian_id', [filters.custodianId]))
    if (filters.type) queries.push(Query.equal('type', [filters.type]))
    if (cursor) queries.push(Query.cursorAfter(cursor))
    const { documents } = await db().listDocuments(DB_ID(), 'movements', queries)
    rows.push(...documents.map((row) => cast<Movement>(row)))
    if (documents.length < 500) return rows
    cursor = documents[documents.length - 1].$id
  }
}
export async function listMovementsForCustodian(itemId: string, custodianId: string): Promise<Movement[]> {
  return listMovements({ itemId, custodianId })
}
export async function createInventoryItemInTransaction(transactionId: string, data: Record<string, unknown>) {
  return db().createDocument(DB_ID(), 'inventory_items', ID.unique(), data, [], transactionId)
}
export async function inventoryTransaction<T>(run: (tx: string) => Promise<T>): Promise<T> {
  const databases = db()
  const transaction = await databases.createTransaction()
  try {
    const result = await run(transaction.$id)
    await databases.updateTransaction(transaction.$id, true)
    return result
  } catch (error) {
    try { await databases.updateTransaction(transaction.$id, false, true) } catch { /* transaction may already have expired */ }
    throw error
  }
}
export async function getInventoryItemInTransaction(id: string, tx: string): Promise<InventoryItem> {
  return cast<InventoryItem>(await db().getDocument(DB_ID(), 'inventory_items', id, [], tx))
}
export async function updateInventoryItemInTransaction(id: string, data: Record<string, unknown>, tx: string) {
  return db().updateDocument(DB_ID(), 'inventory_items', id, data, [], tx)
}
export async function createMovementInTransaction(id: string, data: Record<string, unknown>, tx: string) {
  return db().createDocument(DB_ID(), 'movements', id, data, [], tx)
}
export async function listProfilesByIds(userIds: string[]) {
  if (!userIds.length) return []
  const { documents } = await db().listDocuments(DB_ID(), 'users_profiles', [Query.equal('user_id', userIds), Query.limit(100)])
  return documents.map((row) => ({ user_id: String(row.user_id), department: String(row.department), active: Boolean(row.active) }))
}

import { Databases, ID, Query, Storage } from 'node-appwrite'
import type { Contractor, PhotoRecord, SiteLog, SiteProject, SiteReport } from '../../src/modules/site-progress/types'
import { adminClient, DB_ID } from './appwrite'

const db = () => new Databases(adminClient())
const code = (e: unknown) => (e as { code?: number } | null)?.code
export const isConflict = (e: unknown) => code(e) === 409
const cast = <T>(value: unknown) => value as T

export async function listProjects(): Promise<SiteProject[]> {
  const { documents } = await db().listDocuments(DB_ID(), 'projects', [Query.equal('status', ['active']), Query.limit(200)])
  return documents.map((d) => cast<SiteProject>(d)).sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999) || a.name.localeCompare(b.name))
}

export async function getProject(id: string): Promise<SiteProject | null> {
  try { return cast<SiteProject>(await db().getDocument(DB_ID(), 'projects', id)) }
  catch (e) { if (code(e) === 404) return null; throw e }
}

export async function listContractors(projectId: string): Promise<Contractor[]> {
  const { documents } = await db().listDocuments(DB_ID(), 'contractors', [Query.equal('project_id', [projectId]), Query.equal('active', [true]), Query.limit(200)])
  return documents.map((d) => cast<Contractor>(d)).sort((a, b) => a.name.localeCompare(b.name))
}

export async function getContractor(id: string): Promise<Contractor | null> {
  try { return cast<Contractor>(await db().getDocument(DB_ID(), 'contractors', id)) }
  catch (e) { if (code(e) === 404) return null; throw e }
}

export async function listLogs(projectId: string): Promise<SiteLog[]> {
  const { documents } = await db().listDocuments(DB_ID(), 'site_logs', [Query.equal('project_id', [projectId]), Query.orderDesc('log_date'), Query.limit(200)])
  return documents.map((d) => cast<SiteLog>(d))
}

export async function getLog(id: string): Promise<SiteLog | null> {
  try { return cast<SiteLog>(await db().getDocument(DB_ID(), 'site_logs', id)) }
  catch (e) { if (code(e) === 404) return null; throw e }
}

export async function findLogByClientId(clientId: string): Promise<SiteLog | null> {
  const { documents } = await db().listDocuments(DB_ID(), 'site_logs', [Query.equal('client_id', [clientId]), Query.limit(1)])
  return documents[0] ? cast<SiteLog>(documents[0]) : null
}

export async function createLog(data: Record<string, unknown>): Promise<SiteLog> {
  return cast<SiteLog>(await db().createDocument(DB_ID(), 'site_logs', ID.unique(), data))
}

export async function updateLog(id: string, data: Record<string, unknown>): Promise<SiteLog> {
  return cast<SiteLog>(await db().updateDocument(DB_ID(), 'site_logs', id, data))
}

export async function updateContractorProgress(id: string, percent: number): Promise<void> {
  await db().updateDocument(DB_ID(), 'contractors', id, { progress_pct: percent })
}

export async function listReports(): Promise<SiteReport[]> {
  const { documents } = await db().listDocuments(DB_ID(), 'reports', [Query.orderDesc('report_date'), Query.limit(200)])
  return documents.map((d) => cast<SiteReport>(d))
}

export async function findReportByClientId(clientId: string): Promise<SiteReport | null> {
  const { documents } = await db().listDocuments(DB_ID(), 'reports', [Query.equal('client_id', [clientId]), Query.limit(1)])
  return documents[0] ? cast<SiteReport>(documents[0]) : null
}

export async function getReport(id: string): Promise<SiteReport | null> {
  try { return cast<SiteReport>(await db().getDocument(DB_ID(), 'reports', id)) }
  catch (e) { if (code(e) === 404) return null; throw e }
}

export async function createReport(data: Record<string, unknown>): Promise<SiteReport> {
  return cast<SiteReport>(await db().createDocument(DB_ID(), 'reports', ID.unique(), data))
}

export async function changeReportAtomically(id: string, change: (report: SiteReport) => Promise<Record<string, unknown>>) {
  const databases = db()
  const transaction = await databases.createTransaction()
  try {
    const current = cast<SiteReport>(await databases.getDocument(DB_ID(), 'reports', id, [], transaction.$id))
    const fields = await change(current)
    await databases.updateDocument(DB_ID(), 'reports', id, fields, [], transaction.$id)
    await databases.updateTransaction(transaction.$id, true)
    return (await getReport(id))!
  } catch (error) {
    try { await databases.updateTransaction(transaction.$id, false, true) } catch { /* already closed */ }
    throw error
  }
}

export async function findPhotoByClientId(clientId: string): Promise<PhotoRecord | null> {
  const { documents } = await db().listDocuments(DB_ID(), 'photo_records', [Query.equal('client_id', [clientId]), Query.limit(1)])
  return documents[0] ? cast<PhotoRecord>(documents[0]) : null
}

export async function createPhoto(data: Record<string, unknown>): Promise<PhotoRecord> {
  return cast<PhotoRecord>(await db().createDocument(DB_ID(), 'photo_records', ID.unique(), data))
}

export async function listPhotosByOwner(collection: PhotoRecord['owner_collection'], ownerIds: string[]): Promise<PhotoRecord[]> {
  if (!ownerIds.length) return []
  const { documents } = await db().listDocuments(DB_ID(), 'photo_records', [Query.equal('owner_collection', [collection]), Query.equal('owner_id', ownerIds), Query.limit(300)])
  return documents.map((d) => cast<PhotoRecord>(d))
}

export async function assertPhotoAccess(fileId: string, userId: string): Promise<void> {
  const bucket = process.env.APPWRITE_BUCKET_PROOFS
  if (!bucket) throw new Error('Photo storage is not configured')
  const file = await new Storage(adminClient()).getFile(bucket, fileId)
  if (!String(file.name).startsWith(`${userId}--`)) throw Object.assign(new Error('Photo not found'), { code: 404 })
}

export async function listProfilesByIds(userIds: string[]): Promise<Array<{ user_id: string; department: string; active: boolean }>> {
  if (!userIds.length) return []
  const { documents } = await db().listDocuments(DB_ID(), 'users_profiles', [Query.equal('user_id', userIds), Query.limit(100)])
  return documents.map((d) => ({ user_id: String(d.user_id), department: String(d.department), active: Boolean(d.active) }))
}

export async function getPhoto(id: string): Promise<PhotoRecord | null> {
  try { return cast<PhotoRecord>(await db().getDocument(DB_ID(), 'photo_records', id)) }
  catch (e) { if (code(e) === 404) return null; throw e }
}

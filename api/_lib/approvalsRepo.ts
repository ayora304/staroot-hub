// All Appwrite access for approvals and notifications lives here, so an SDK signature change is a
// one-file fix. Call style matches api/_lib/appwrite.ts (positional arguments).
import { Databases, ID, Query } from 'node-appwrite'
import type { Profile } from '../../src/core/rbac/roles'
import type { Approval, ApprovalEvent, ApprovalRule } from '../../src/modules/approvals/types'
import { adminClient, DB_ID } from './appwrite'

const db = () => new Databases(adminClient())
const codeOf = (e: unknown) => (e as { code?: number } | null)?.code
export const isConflict = (e: unknown) => codeOf(e) === 409
const as = <T>(d: unknown) => d as T

// ---- approvals ----
export async function getApproval(id: string): Promise<Approval | null> {
  try {
    return as<Approval>(await db().getDocument(DB_ID(), 'approvals', id))
  } catch (e) {
    if (codeOf(e) === 404) return null
    throw e
  }
}

export async function findApprovalByClientId(clientId: string): Promise<Approval | null> {
  const res = await db().listDocuments(DB_ID(), 'approvals', [Query.equal('client_id', [clientId]), Query.limit(1)])
  return res.documents[0] ? as<Approval>(res.documents[0]) : null
}

export async function createApproval(data: Record<string, unknown>): Promise<Approval> {
  return as<Approval>(await db().createDocument(DB_ID(), 'approvals', ID.unique(), data))
}

export async function updateApproval(id: string, data: Record<string, unknown>): Promise<Approval> {
  return as<Approval>(await db().updateDocument(DB_ID(), 'approvals', id, data))
}

export async function listApprovals(queries: string[]): Promise<Approval[]> {
  const res = await db().listDocuments(DB_ID(), 'approvals', [...queries, Query.orderDesc('$createdAt'), Query.limit(100)])
  return res.documents.map((d) => as<Approval>(d))
}

// ---- events (append-only: there is deliberately no update or delete here) ----
export async function listEvents(approvalId: string): Promise<ApprovalEvent[]> {
  const res = await db().listDocuments(DB_ID(), 'approval_events', [
    Query.equal('approval_id', [approvalId]),
    Query.orderAsc('seq'),
    Query.limit(100),
  ])
  return res.documents.map((d) => as<ApprovalEvent>(d))
}

export async function appendEvent(data: Record<string, unknown>): Promise<ApprovalEvent> {
  return as<ApprovalEvent>(await db().createDocument(DB_ID(), 'approval_events', ID.unique(), data))
}

// ---- rules and people ----
export async function listRules(): Promise<ApprovalRule[]> {
  const res = await db().listDocuments(DB_ID(), 'approval_rules', [Query.limit(100)])
  return res.documents.map((d) => {
    const r = d as unknown as Record<string, unknown>
    return {
      $id: String(r.$id),
      category: r.category,
      min_amount: Number(r.min_amount),
      max_amount: r.max_amount == null ? null : Number(r.max_amount),
      currency: String(r.currency),
      approver_role: r.approver_role,
      priority: Number(r.priority),
      active: Boolean(r.active),
    } as ApprovalRule
  })
}

export async function listProfilesByRole(role: string): Promise<Profile[]> {
  const res = await db().listDocuments(DB_ID(), 'users_profiles', [Query.equal('role', [role]), Query.limit(100)])
  return res.documents.map((d) => as<Profile>(d))
}

// ---- notifications ----
export interface NotificationDoc {
  $id: string
  $createdAt: string
  user_id: string
  type: string
  title: string
  body?: string
  link?: string
  source_id?: string
  read: boolean
  read_at?: string | null
}

export async function createNotification(data: Record<string, unknown>) {
  return db().createDocument(DB_ID(), 'notifications', ID.unique(), data)
}

export async function listNotifications(userId: string, unreadOnly = false): Promise<NotificationDoc[]> {
  const queries = [Query.equal('user_id', [userId])]
  if (unreadOnly) queries.push(Query.equal('read', [false]))
  const res = await db().listDocuments(DB_ID(), 'notifications', [...queries, Query.orderDesc('$createdAt'), Query.limit(50)])
  return res.documents.map((d) => as<NotificationDoc>(d))
}

export async function getNotification(id: string): Promise<NotificationDoc | null> {
  try {
    return as<NotificationDoc>(await db().getDocument(DB_ID(), 'notifications', id))
  } catch (e) {
    if (codeOf(e) === 404) return null
    throw e
  }
}

export async function markNotificationRead(id: string) {
  return db().updateDocument(DB_ID(), 'notifications', id, { read: true, read_at: new Date().toISOString() })
}

// Reads go straight to the API (online only for now). Writes go to the outbox first, so they work offline.
import { apiFetch, isNetworkError } from '../../../core/api/client'
import { ENDPOINTS } from '../../../core/api/endpoints'
import { syncEngine } from '../../../core/offline'
import { readCache } from '../../../core/offline/db'
import type { BlobInput } from '../../../core/offline'
import type { Approval, ApprovalEvent, ApprovalStatus, ApprovalTab, Category, DecisionAction, ApproverRole } from '../types'

export const OUTBOX_TYPES = {
  submit: 'approval.submit',
  decide: 'approval.decide',
  resubmit: 'approval.resubmit',
} as const

export interface ApprovalSummary {
  id: string
  title: string
  category: Category
  amount: number | null
  currency: string | null
  status: ApprovalStatus
  requestor_email: string
  department: string
  assigned_role: ApproverRole | null
  version: number
  created_at: string
  local_status?: 'pending' | 'syncing' | 'failed' | 'needs_review'
}
export interface ApprovalDetail {
  approval: Approval
  events: ApprovalEvent[]
  canDecide: boolean
  canResubmit: boolean
}

export async function listApprovals(tab: ApprovalTab, userId: string, email: string, department: string, signal?: AbortSignal) {
  const key = `${userId}:approvals:${tab}`
  const cached = await readCache.get<{ items: ApprovalSummary[] }>(key)
  let items: ApprovalSummary[]
  try {
    const result = await apiFetch<{ items: ApprovalSummary[] }>(`${ENDPOINTS.approvalsList}?tab=${tab}`, { signal })
    items = result.items
    await readCache.set(userId, 'approvals', tab, { items })
  } catch (e) {
    if (!isNetworkError(e) || !cached) throw e
    items = cached.items
  }

  if (tab === 'mine') {
    const queued = await syncEngine.listItems()
    const local = queued
      .filter((item) => item.type === OUTBOX_TYPES.submit || item.type === OUTBOX_TYPES.resubmit)
      .map((item): ApprovalSummary | null => {
        const payload = item.payload as Record<string, unknown>
        const category = payload.category ?? payload.__local_category
        if (typeof category !== 'string' || !['petty_cash', 'procurement', 'leave', 'contract'].includes(category)) return null
        return {
          id: item.id,
          title: String(payload.title ?? 'Untitled request'),
          category: category as Category,
          amount: typeof payload.amount === 'number' ? payload.amount : null,
          currency: typeof payload.currency === 'string' ? payload.currency : null,
          status: 'pending',
          requestor_email: email,
          department,
          assigned_role: null,
          version: 0,
          created_at: new Date(item.createdAt).toISOString(),
          local_status: item.status,
        }
      })
      .filter((item): item is ApprovalSummary => item !== null)
    items = [...local, ...items]
  }
  return { items }
}

export async function getApproval(id: string, userId: string, signal?: AbortSignal): Promise<ApprovalDetail> {
  const key = `${userId}:approval:${id}`
  const cached = await readCache.get<ApprovalDetail>(key)
  try {
    const result = await apiFetch<ApprovalDetail>(`${ENDPOINTS.approvalsDetail}?id=${encodeURIComponent(id)}`, { signal })
    await readCache.set(userId, 'approval', id, result)
    return result
  } catch (e) {
    if (isNetworkError(e) && cached) return cached
    throw e
  }
}

/**
 * Queue approval writes through the sync engine so the item is persisted and
 * the engine can schedule it for delivery.
 */
async function enqueue(userId: string, type: string, payload: Record<string, unknown>, blobs: BlobInput[] = []): Promise<string> {
  const id = crypto.randomUUID()
  await syncEngine.enqueue({ id, userId, type, payload, blobs })
  return id
}

export interface SubmitInput {
  category: Category
  title: string
  details: string
  amount?: number
  currency?: string
  attachments?: File[]
}
export const queueSubmit = (i: SubmitInput, userId: string) => {
  const { attachments = [], ...payload } = i
  const blobs = attachments.map((file) => ({ id: crypto.randomUUID(), blob: file }))
  const metadata = blobs.map((b, index) => ({ blob_id: b.id, filename: attachments[index].name, content_type: attachments[index].type }))
  return enqueue(userId, OUTBOX_TYPES.submit, { ...payload, __attachment_blobs: metadata }, blobs)
}

export const queueDecision = (i: { approval_id: string; base_version: number; action: DecisionAction; comment?: string }, userId: string) =>
  enqueue(userId, OUTBOX_TYPES.decide, { ...i })

export const queueResubmit = (i: { approval_id: string; base_version: number; title: string; details: string; amount?: number; currency?: string; category: Category }, userId: string) => {
  const { category, ...payload } = i
  return enqueue(userId, OUTBOX_TYPES.resubmit, { ...payload, __local_category: category })
}

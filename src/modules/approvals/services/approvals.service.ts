// Reads go straight to the API (online only for now). Writes go to the outbox first, so they work offline.
import { apiFetch } from '../../../core/api/client'
import { ENDPOINTS } from '../../../core/api/endpoints'
import { outboxStore } from '../../../core/offline'
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
}
export interface ApprovalDetail {
  approval: Approval
  events: ApprovalEvent[]
  canDecide: boolean
  canResubmit: boolean
}

export const listApprovals = (tab: ApprovalTab, signal?: AbortSignal) =>
  apiFetch<{ items: ApprovalSummary[] }>(`${ENDPOINTS.approvalsList}?tab=${tab}`, { signal })

export const getApproval = (id: string, signal?: AbortSignal) =>
  apiFetch<ApprovalDetail>(`${ENDPOINTS.approvalsDetail}?id=${encodeURIComponent(id)}`, { signal })

/**
 * The only place that talks to the outbox. ASSUMPTION: outboxStore.enqueue({ id, type, payload }).
 * If your Phase 2 signature differs, fix it here and nowhere else.
 */
async function enqueue(type: string, payload: Record<string, unknown>): Promise<string> {
  const id = crypto.randomUUID()
  await outboxStore.enqueue({ id, type, payload })
  return id
}

export interface SubmitInput {
  category: Category
  title: string
  details: string
  amount?: number
  currency?: string
}
export const queueSubmit = (i: SubmitInput) => enqueue(OUTBOX_TYPES.submit, { ...i })

export const queueDecision = (i: { approval_id: string; base_version: number; action: DecisionAction; comment?: string }) =>
  enqueue(OUTBOX_TYPES.decide, { ...i })

export const queueResubmit = (i: { approval_id: string; base_version: number; title: string; details: string; amount?: number; currency?: string }) =>
  enqueue(OUTBOX_TYPES.resubmit, { ...i })

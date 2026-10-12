import type { Department } from '../../core/rbac/roles'

export const CATEGORIES = ['petty_cash', 'procurement', 'leave', 'contract'] as const
export type Category = (typeof CATEGORIES)[number]

export const STATUSES = ['pending', 'approved', 'rejected', 'revision_requested'] as const
export type ApprovalStatus = (typeof STATUSES)[number]

export const DECISION_ACTIONS = ['approve', 'reject', 'request_revision'] as const
export type DecisionAction = (typeof DECISION_ACTIONS)[number]

export const EVENT_ACTIONS = ['submitted', 'approved', 'rejected', 'revision_requested', 'resubmitted', 'reassigned', 'comment'] as const
export type EventAction = (typeof EVENT_ACTIONS)[number]

export type ApproverRole = 'manager' | 'executive'
export const DEFAULT_CURRENCY = 'KES'

/** Categories that must carry an amount greater than zero. */
export const AMOUNT_CATEGORIES: readonly Category[] = ['petty_cash', 'procurement']

export interface ApprovalRule {
  $id?: string
  category: Category
  min_amount: number
  max_amount: number | null
  currency: string
  approver_role: ApproverRole
  priority: number
  active: boolean
}

export interface Approval {
  $id: string
  $createdAt: string
  $updatedAt: string
  client_id: string
  requestor_id: string
  requestor_email: string
  category: Category
  title: string
  details: string
  amount?: number | null
  currency?: string | null
  attachment_ids?: string[]
  department: Department
  status: ApprovalStatus
  assigned_role?: ApproverRole | null
  rule_id?: string | null
  version: number
  decided_at?: string | null
}

export interface ApprovalEvent {
  $id: string
  $createdAt: string
  approval_id: string
  seq: number
  action: EventAction
  actor_id: string
  actor_role: string
  from_status?: string | null
  to_status: string
  comment?: string | null
}

export type ApprovalTab = 'pending_mine' | 'mine' | 'approved' | 'rejected'

export const CATEGORY_LABELS: Record<Category, string> = {
  petty_cash: 'Petty cash',
  procurement: 'Procurement',
  leave: 'Leave',
  contract: 'Contract',
}
export const STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_requested: 'Revision requested',
}
export const EVENT_LABELS: Record<EventAction, string> = {
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_requested: 'Revision requested',
  resubmitted: 'Resubmitted',
  reassigned: 'Reassigned',
  comment: 'Comment',
}

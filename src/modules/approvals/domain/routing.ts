// Pure routing logic. Shared by api/ (authoritative) and tests. Rules are data, never code.
import { DEFAULT_CURRENCY, type ApprovalRule, type ApproverRole, type Category } from '../types'

export interface RoutingInput {
  category: Category
  amount?: number | null
  currency?: string | null
}

export type RoutingResult =
  | { ok: true; rule: ApprovalRule; approverRole: ApproverRole }
  | { ok: false; reason: 'invalid_amount' | 'no_rule' }

/**
 * A rule matches when: active, same category and currency, and amount is in [min_amount, max_amount).
 * The lower bound is inclusive and the upper bound exclusive, so an amount exactly at a threshold
 * routes to the higher approver. Overlaps: lowest priority number wins, then the highest min_amount.
 * Categories without an amount (leave, contract) are routed as amount 0.
 */
export function routeApproval(rules: ApprovalRule[], input: RoutingInput): RoutingResult {
  const amount = input.amount ?? 0
  if (!Number.isFinite(amount) || amount < 0) return { ok: false, reason: 'invalid_amount' }
  const currency = (input.currency ?? DEFAULT_CURRENCY).toUpperCase()

  const matches = rules.filter(
    (r) =>
      r.active &&
      r.category === input.category &&
      r.currency.toUpperCase() === currency &&
      amount >= r.min_amount &&
      (r.max_amount == null || amount < r.max_amount),
  )
  matches.sort((a, b) => a.priority - b.priority || b.min_amount - a.min_amount)
  const [rule] = matches
  if (!rule) return { ok: false, reason: 'no_rule' }
  return { ok: true, rule, approverRole: rule.approver_role }
}

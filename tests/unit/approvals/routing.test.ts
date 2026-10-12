import { describe, expect, it } from 'vitest'
import seed from '../../../appwrite/seed/approval_rules.json'
import { routeApproval } from '../../../src/modules/approvals/domain/routing'
import type { ApprovalRule } from '../../../src/modules/approvals/types'

const seedRules = seed.rules as unknown as ApprovalRule[]
const rule = (o: Partial<ApprovalRule>): ApprovalRule => ({
  category: 'petty_cash', min_amount: 0, max_amount: null, currency: 'KES', approver_role: 'manager', priority: 10, active: true, ...o,
})
const role = (r: ReturnType<typeof routeApproval>) => (r.ok ? r.approverRole : r.reason)

describe('routing with the seeded rules', () => {
  it('petty cash below the threshold goes to a manager', () => {
    expect(role(routeApproval(seedRules, { category: 'petty_cash', amount: 19999.99 }))).toBe('manager')
  })
  it('petty cash exactly at the threshold goes to the executive', () => {
    expect(role(routeApproval(seedRules, { category: 'petty_cash', amount: 20000 }))).toBe('executive')
  })
  it('procurement boundary at 500000', () => {
    expect(role(routeApproval(seedRules, { category: 'procurement', amount: 499999 }))).toBe('manager')
    expect(role(routeApproval(seedRules, { category: 'procurement', amount: 500000 }))).toBe('executive')
  })
  it('leave goes to a manager and contracts to the executive, with no amount', () => {
    expect(role(routeApproval(seedRules, { category: 'leave' }))).toBe('manager')
    expect(role(routeApproval(seedRules, { category: 'contract' }))).toBe('executive')
  })
  it('defaults the currency to KES', () => {
    expect(role(routeApproval(seedRules, { category: 'petty_cash', amount: 100, currency: null }))).toBe('manager')
  })
})

describe('routing edge cases', () => {
  it('rejects a currency with no rule', () => {
    expect(role(routeApproval(seedRules, { category: 'petty_cash', amount: 100, currency: 'USD' }))).toBe('no_rule')
  })
  it('matches currency case-insensitively', () => {
    expect(role(routeApproval([rule({})], { category: 'petty_cash', amount: 5, currency: 'kes' }))).toBe('manager')
  })
  it('rejects negative and non-finite amounts', () => {
    expect(role(routeApproval(seedRules, { category: 'petty_cash', amount: -1 }))).toBe('invalid_amount')
    expect(role(routeApproval(seedRules, { category: 'petty_cash', amount: Number.NaN }))).toBe('invalid_amount')
    expect(role(routeApproval(seedRules, { category: 'petty_cash', amount: Infinity }))).toBe('invalid_amount')
  })
  it('ignores inactive rules', () => {
    expect(role(routeApproval([rule({ active: false })], { category: 'petty_cash', amount: 5 }))).toBe('no_rule')
  })
  it('returns no_rule when nothing covers the amount (gap between rules)', () => {
    const rules = [rule({ min_amount: 0, max_amount: 100 }), rule({ min_amount: 200, max_amount: null, approver_role: 'executive' })]
    expect(role(routeApproval(rules, { category: 'petty_cash', amount: 150 }))).toBe('no_rule')
  })
  it('lowest priority number wins on overlap', () => {
    const rules = [rule({ priority: 20, approver_role: 'executive' }), rule({ priority: 5, approver_role: 'manager' })]
    expect(role(routeApproval(rules, { category: 'petty_cash', amount: 50 }))).toBe('manager')
  })
  it('equal priority: the more specific (higher min_amount) band wins', () => {
    const rules = [rule({ min_amount: 0 }), rule({ min_amount: 1000, approver_role: 'executive' })]
    expect(role(routeApproval(rules, { category: 'petty_cash', amount: 5000 }))).toBe('executive')
  })
  it('treats a missing max_amount as unbounded', () => {
    const open = { ...rule({}), max_amount: undefined } as unknown as ApprovalRule
    expect(role(routeApproval([open], { category: 'petty_cash', amount: 9e9 }))).toBe('manager')
  })
})

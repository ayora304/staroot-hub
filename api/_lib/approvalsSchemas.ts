import { z } from 'zod'
import { AMOUNT_CATEGORIES, CATEGORIES, DECISION_ACTIONS } from '../../src/modules/approvals/types'

const money = z.number().finite().nonnegative().max(1e12)
const currency = z.string().trim().length(3).transform((s) => s.toUpperCase())

export const submitSchema = z
  .object({
    client_id: z.string().uuid(),
    category: z.enum(CATEGORIES),
    title: z.string().trim().min(3).max(120),
    details: z.string().trim().min(1).max(2000),
    amount: money.optional(),
    currency: currency.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (AMOUNT_CATEGORIES.includes(v.category) && !(v.amount && v.amount > 0)) {
      ctx.addIssue({ code: 'custom', path: ['amount'], message: 'An amount greater than zero is required' })
    }
  })

export const decideSchema = z
  .object({
    client_id: z.string().uuid().optional(),
    approval_id: z.string().min(1).max(64),
    base_version: z.number().int().min(1),
    action: z.enum(DECISION_ACTIONS),
    comment: z.string().trim().max(1000).optional(),
  })
  .strict()

export const resubmitSchema = z
  .object({
    client_id: z.string().uuid().optional(),
    approval_id: z.string().min(1).max(64),
    base_version: z.number().int().min(1),
    title: z.string().trim().min(3).max(120),
    details: z.string().trim().min(1).max(2000),
    amount: money.optional(),
    currency: currency.optional(),
  })
  .strict()

export const listQuerySchema = z.object({ tab: z.enum(['pending_mine', 'mine', 'approved', 'rejected']) })
export const detailQuerySchema = z.object({ id: z.string().min(1).max(64) })
export const readNotificationsSchema = z
  .object({ ids: z.array(z.string().min(1).max(64)).max(50).optional(), all: z.boolean().optional() })
  .strict()

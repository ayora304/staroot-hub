import { z } from 'zod'
import { assertCsrf, authenticate } from '../_lib/auth'
import { handler, HttpError, readJson, send } from '../_lib/http'
import { createInventoryItem, listInventoryItems } from '../_lib/inventoryRepo'
import { requireAccess } from '../_lib/rbac'

const itemSchema = z.object({ sku: z.string().trim().min(1).max(64), name: z.string().trim().min(1).max(120), category: z.string().trim().max(80).optional(), kind: z.enum(['consumable', 'returnable']), unit: z.string().trim().min(1).max(24), reorder_level: z.number().int().nonnegative().optional() })
export default handler(async (req, res) => {
  const ctx = await authenticate(req)
  if (req.method === 'GET') {
    await requireAccess(ctx, 'inventory', 'read')
    return send(res, 200, { items: await listInventoryItems() })
  }
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  assertCsrf(req)
  await requireAccess(ctx, 'inventory', 'write')
  if (!ctx.profile.is_admin) throw new HttpError(403, 'Only administrators can add catalogue items', 'forbidden')
  const input = itemSchema.parse(await readJson(req))
  const item = await createInventoryItem({ ...input, quantity_on_hand: 0, active: true, version: 1 })
  send(res, 201, { item })
})

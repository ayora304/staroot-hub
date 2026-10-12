import { listPushSubscriptions, updatePushSubscriptions } from '../_lib/approvalsRepo'
import { authenticate, assertCsrf } from '../_lib/auth'
import { handler, HttpError, readJson, send } from '../_lib/http'
import { validateSubscription } from '../_lib/push'
import { requireAccess } from '../_lib/rbac'

// POST /api/push/subscribe and /api/push/unsubscribe. A user can only change their own profile.
export default handler(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  const ctx = await authenticate(req)
  assertCsrf(req)
  await requireAccess(ctx, 'notifications', 'read')
  const body = await readJson(req) as Record<string, unknown> | undefined
  if (body?.action === 'unsubscribe') {
    if (typeof body.endpoint !== 'string') throw new HttpError(400, 'Invalid push endpoint', 'validation')
    const existing = (await listPushSubscriptions([ctx.userId]))[0]?.subscriptions ?? []
    const next = existing.filter((raw) => {
      try { return (JSON.parse(raw) as { endpoint?: string }).endpoint !== body.endpoint } catch { return false }
    })
    await updatePushSubscriptions(ctx.userId, next)
    return send(res, 200, { ok: true })
  }

  const subscription = validateSubscription(body?.subscription)
  const rows = await listPushSubscriptions([ctx.userId])
  const serialized = JSON.stringify(subscription)
  const subscriptions = [...new Set([...(rows[0]?.subscriptions ?? []).filter((raw) => {
    try { return (JSON.parse(raw) as { endpoint?: string }).endpoint !== subscription.endpoint } catch { return false }
  }), serialized])].slice(-10)
  await updatePushSubscriptions(ctx.userId, subscriptions)
  send(res, 200, { ok: true })
})

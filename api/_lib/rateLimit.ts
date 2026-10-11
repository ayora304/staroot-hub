import { HttpError } from './http'

// In-memory fixed window. Per server instance only, so it slows brute force but is not a hard limit
// on serverless. TODO(Phase 7): move to a shared store.
const hits = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k)
  const entry = hits.get(key)
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  entry.count += 1
  if (entry.count > limit) throw new HttpError(429, 'Too many attempts. Please wait and try again.', 'rate_limited')
}

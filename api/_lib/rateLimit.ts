import { HttpError } from './http'

// In-memory fixed window. This is process-local; configure a shared rate-limit store at deployment
// before relying on the login thresholds across serverless instances.
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

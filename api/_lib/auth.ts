import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { Profile } from '../../src/core/rbac/roles'
import { Account, getProfileByUserId, sessionClient } from './appwrite'
import { allowedDomainsFromEnv, isAllowedEmail } from './emailDomain'
import { HttpError, parseCookies, serializeCookie, type Req } from './http'

export const SESSION_COOKIE = 'staroot_session'
export const CSRF_COOKIE = 'staroot_csrf'
export const CSRF_HEADER = 'x-csrf-token'
const THIRTY_DAYS = 60 * 60 * 24 * 30

export interface AuthContext {
  userId: string
  email: string
  profile: Profile
}

const secure = () => process.env.NODE_ENV === 'production'

/** Verifies the session cookie against Appwrite, then re-checks domain, verification and active profile. */
export async function authenticate(req: Req): Promise<AuthContext> {
  const secret = parseCookies(req)[SESSION_COOKIE]
  if (!secret) throw new HttpError(401, 'Not signed in', 'unauthenticated')

  let user
  try {
    user = await new Account(sessionClient(secret)).get()
  } catch {
    throw new HttpError(401, 'Session expired. Please sign in again.', 'unauthenticated')
  }
  if (!isAllowedEmail(user.email, allowedDomainsFromEnv())) throw new HttpError(403, 'This account is not permitted.', 'forbidden')
  if (!user.emailVerification) throw new HttpError(403, 'Verify your email first.', 'unverified')

  const profile = await getProfileByUserId(user.$id)
  if (!profile || !profile.active) throw new HttpError(403, 'No active profile. Ask an administrator.', 'no_profile')
  return { userId: user.$id, email: user.email, profile }
}

/** Double-submit CSRF check for state-changing requests. */
export function assertCsrf(req: Req) {
  const cookie = parseCookies(req)[CSRF_COOKIE]
  const header = req.headers[CSRF_HEADER]
  const h = Array.isArray(header) ? header[0] : header
  if (!cookie || !h) throw new HttpError(403, 'Missing CSRF token', 'csrf')
  const a = Buffer.from(cookie)
  const b = Buffer.from(h)
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(403, 'Invalid CSRF token', 'csrf')
}

export function sessionCookies(secret: string): string[] {
  return [
    serializeCookie(SESSION_COOKIE, secret, { httpOnly: true, secure: secure(), sameSite: 'Lax', maxAge: THIRTY_DAYS }),
    serializeCookie(CSRF_COOKIE, randomBytes(32).toString('hex'), { secure: secure(), sameSite: 'Lax', maxAge: THIRTY_DAYS }),
  ]
}

export function clearCookies(): string[] {
  return [
    serializeCookie(SESSION_COOKIE, '', { httpOnly: true, secure: secure(), maxAge: 0 }),
    serializeCookie(CSRF_COOKIE, '', { secure: secure(), maxAge: 0 }),
  ]
}

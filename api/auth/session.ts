import { Account, adminClient, getProfileByUserId, listPermissions, sessionClient } from '../_lib/appwrite'
import { authenticate, sessionCookies } from '../_lib/auth'
import { allowedDomainsFromEnv, isAllowedEmail } from '../_lib/emailDomain'
import { getIp, handler, HttpError, readJson, send } from '../_lib/http'
import { rateLimit } from '../_lib/rateLimit'
import { loginSchema } from '../_lib/validate'

// GET  /api/auth/session  -> current user, profile and this role's permissions
// POST /api/auth/session  -> sign in with email + password
export default handler(async (req, res) => {
  if (req.method === 'GET') {
    const ctx = await authenticate(req)
    const permissions = (await listPermissions()).filter((r) => r.role === ctx.profile.role)
    return send(res, 200, { user: { id: ctx.userId, email: ctx.email }, profile: ctx.profile, permissions })
  }
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')

  const { email, password } = loginSchema.parse(await readJson(req))
  rateLimit(`login:ip:${getIp(req)}`, 20, 15 * 60_000)
  rateLimit(`login:email:${email.toLowerCase()}`, 8, 15 * 60_000)

  if (!isAllowedEmail(email, allowedDomainsFromEnv())) throw new HttpError(403, 'Use your company email address.', 'domain')

  let secret: string
  try {
    secret = (await new Account(adminClient()).createEmailPasswordSession(email, password)).secret
  } catch {
    throw new HttpError(401, 'Invalid email or password.', 'invalid_credentials')
  }

  // Re-verify like every later request would; roll the session back on any failure.
  const rollback = () => new Account(sessionClient(secret)).deleteSession('current').catch(() => undefined)
  const user = await new Account(sessionClient(secret)).get()
  if (!user.emailVerification) {
    await rollback()
    throw new HttpError(403, 'Verify your email first.', 'unverified')
  }
  const profile = await getProfileByUserId(user.$id)
  if (!profile || !profile.active) {
    await rollback()
    throw new HttpError(403, 'No active profile. Ask an administrator.', 'no_profile')
  }

  const permissions = (await listPermissions()).filter((r) => r.role === profile.role)
  send(res, 200, { user: { id: user.$id, email: user.email }, profile, permissions }, sessionCookies(secret))
})

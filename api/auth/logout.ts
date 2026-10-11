import { Account, sessionClient } from '../_lib/appwrite'
import { assertCsrf, clearCookies, SESSION_COOKIE } from '../_lib/auth'
import { handler, HttpError, parseCookies, send } from '../_lib/http'

export default handler(async (req, res) => {
  if (req.method !== 'POST') throw new HttpError(405, 'Method not allowed', 'method')
  assertCsrf(req)
  const secret = parseCookies(req)[SESSION_COOKIE]
  if (secret) await new Account(sessionClient(secret)).deleteSession('current').catch(() => undefined)
  send(res, 200, { ok: true }, clearCookies())
})

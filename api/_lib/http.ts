import type { IncomingMessage, ServerResponse } from 'node:http'
import { ZodError } from 'zod'

export type Req = IncomingMessage & { body?: unknown }
export type Res = ServerResponse

export class HttpError extends Error {
  status: number
  code: string
  constructor(status: number, message: string, code = 'error') {
    super(message)
    this.status = status
    this.code = code
  }
}

export function send(res: Res, status: number, body: unknown, cookies: string[] = []) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  if (cookies.length) res.setHeader('Set-Cookie', cookies)
  res.end(JSON.stringify(body))
}

export function parseCookies(req: Req): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function serializeCookie(
  name: string,
  value: string,
  o: { maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: 'Lax' | 'Strict' | 'None'; path?: string } = {},
): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${o.path ?? '/'}`, `SameSite=${o.sameSite ?? 'Lax'}`]
  if (o.maxAge !== undefined) parts.push(`Max-Age=${o.maxAge}`)
  if (o.httpOnly) parts.push('HttpOnly')
  if (o.secure) parts.push('Secure')
  return parts.join('; ')
}

export async function readJson(req: Req): Promise<unknown> {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > 1_000_000) throw new HttpError(413, 'Request too large', 'too_large')
    chunks.push(chunk as Buffer)
  }
  if (!chunks.length) return undefined
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'Invalid JSON', 'bad_json')
  }
}

export function getIp(req: Req): string {
  // Prefer headers written by the hosting edge before the client-facing forwarding chain.
  for (const name of ['x-vercel-forwarded-for', 'x-real-ip', 'cf-connecting-ip']) {
    const value = req.headers[name]
    const first = (Array.isArray(value) ? value[0] : value)?.split(',')[0]?.trim()
    if (first) return first
  }
  const fwd = req.headers['x-forwarded-for']
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim()
  return first || req.socket.remoteAddress || 'unknown'
}

/** Wraps an endpoint so thrown HttpError / ZodError become clean JSON responses. */
export function handler(fn: (req: Req, res: Res) => Promise<void>) {
  return async (req: Req, res: Res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    try {
      await fn(req, res)
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message, code: e.code })
      if (e instanceof ZodError) {
        return send(res, 400, {
          error: 'Invalid request',
          code: 'validation',
          issues: e.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        })
      }
      console.error(e)
      send(res, 500, { error: 'Server error', code: 'internal' })
    }
  }
}

import { env } from '../config/env'
import { CSRF_COOKIE, CSRF_HEADER } from '../config/constants'

export class ApiError extends Error {
  status: number
  code?: string
  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/** fetch() rejects with TypeError when the network is unreachable. */
export function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError
}

function readCookie(name: string): string | undefined {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(name + '='))
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function apiFetch<T>(path: string, opts: Options = {}): Promise<T> {
  const method = opts.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') {
    const csrf = readCookie(CSRF_COOKIE)
    if (csrf) headers[CSRF_HEADER] = csrf
  }
  const res = await fetch(env.apiBase + path, {
    method,
    headers,
    credentials: 'include',
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  })
  const data = res.status === 204 ? null : await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.error ?? res.statusText, data?.code)
  return data as T
}

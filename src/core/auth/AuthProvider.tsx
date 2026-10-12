import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, apiFetch, isNetworkError } from '../api/client'
import { ENDPOINTS } from '../api/endpoints'
import { clearAllLocalData, sessionCache } from '../offline/db'
import { requestPersistentStorage, syncEngine } from '../offline'
import type { PermissionRow, Profile } from '../rbac/roles'

export interface SessionPayload {
  user: { id: string; email: string }
  profile: Profile
  permissions: PermissionRow[]
}
export type AuthStatus = 'loading' | 'authed' | 'anon'

export interface AuthState {
  status: AuthStatus
  session: SessionPayload | null
  /** True when the session came from the local cache because the server was unreachable. */
  offline: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [session, setSession] = useState<SessionPayload | null>(null)
  const [offline, setOffline] = useState(false)

  const accept = useCallback(async (s: SessionPayload) => {
    await sessionCache.save(s)
    syncEngine.setUserId(s.user.id)
    setSession(s)
    setOffline(false)
    setStatus('authed')
  }, [])

  const refresh = useCallback(async () => {
    try {
      await accept(await apiFetch<SessionPayload>(ENDPOINTS.session))
    } catch (e) {
      if (isNetworkError(e)) {
        const cached = await sessionCache.load<SessionPayload>()
        if (cached) {
          syncEngine.setUserId(cached.user.id)
          setSession(cached)
          setOffline(true)
          setStatus('authed')
          return
        }
      } else if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        syncEngine.setUserId(null)
        await clearAllLocalData()
      }
      syncEngine.setUserId(null)
      setSession(null)
      setStatus('anon')
    }
  }, [accept])

  useEffect(() => {
    void refresh()
    void requestPersistentStorage()
    const onOnline = () => void refresh()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [refresh])

  const signIn = useCallback(
    async (email: string, password: string) => {
      await accept(await apiFetch<SessionPayload>(ENDPOINTS.session, { method: 'POST', body: { email, password } }))
    },
    [accept],
  )

  const signOut = useCallback(async () => {
    syncEngine.setUserId(null)
    // Offline sign-out only clears this device; the server session ends on next online logout/expiry.
    try {
      await apiFetch(ENDPOINTS.logout, { method: 'POST' })
    } catch {
      /* ignore */
    }
    await clearAllLocalData()
    setSession(null)
    setOffline(false)
    setStatus('anon')
  }, [])

  const value = useMemo(
    () => ({ status, session, offline, signIn, signOut, refresh }),
    [status, session, offline, signIn, signOut, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

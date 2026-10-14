import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, apiFetch, isNetworkError } from '../api/client'
import { ENDPOINTS } from '../api/endpoints'
import { clearAllLocalData, sessionCache } from '../offline/db'
import { requestPersistentStorage, syncEngine } from '../offline'
import type { PermissionRow, Profile } from '../rbac/roles'
import { accessModeAfterPasswordSignIn, accessModeForExistingSession, saveAccessCode, verifyAccessCode } from './accessCode'

export interface SessionPayload {
  user: { id: string; email: string }
  profile: Profile
  permissions: PermissionRow[]
}
export type AuthStatus = 'loading' | 'authed' | 'anon'
export type AccessMode = 'none' | 'setup' | 'locked' | 'unlocked'

export interface AuthState {
  status: AuthStatus
  accessMode: AccessMode
  session: SessionPayload | null
  /** True when the session came from the local cache because the server was unreachable. */
  offline: boolean
  signIn: (email: string, password: string) => Promise<void>
  setAccessCode: (code: string) => Promise<void>
  unlockWithAccessCode: (code: string) => Promise<{ ok: boolean; retryAfterMs: number }>
  lock: () => void
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [accessMode, setAccessMode] = useState<AccessMode>('none')
  const [session, setSession] = useState<SessionPayload | null>(null)
  const [offline, setOffline] = useState(false)

  const accept = useCallback(async (s: SessionPayload, mode: Exclude<AccessMode, 'none'>, isOffline = false) => {
    await sessionCache.save(s)
    syncEngine.setUserId(s.user.id)
    setSession(s)
    setOffline(isOffline)
    setAccessMode(mode)
    setStatus('authed')
  }, [])

  const clearSession = useCallback(async () => {
    syncEngine.setUserId(null)
    await clearAllLocalData()
    setSession(null)
    setOffline(false)
    setAccessMode('none')
    setStatus('anon')
  }, [])

  const refresh = useCallback(async () => {
    try {
      const current = await apiFetch<SessionPayload>(ENDPOINTS.session)
      const mode = await accessModeForExistingSession(current.user.id)
      if (mode === 'expired') {
        await apiFetch(ENDPOINTS.logout, { method: 'POST' }).catch(() => undefined)
        await clearSession()
        return
      }
      await accept(current, mode)
    } catch (e) {
      if (isNetworkError(e)) {
        const cached = await sessionCache.load<SessionPayload>()
        if (cached) {
          const mode = await accessModeForExistingSession(cached.user.id)
          if (mode === 'expired') {
            await clearSession()
            return
          }
          await accept(cached, mode, true)
          return
        }
      } else if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        await clearSession()
        return
      }
      syncEngine.setUserId(null)
      setSession(null)
      setOffline(false)
      setAccessMode('none')
      setStatus('anon')
    }
  }, [accept, clearSession])

  useEffect(() => {
    void refresh()
    void requestPersistentStorage()
    const onOnline = () => void refresh()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [refresh])

  const signIn = useCallback(
    async (email: string, password: string) => {
      const signedIn = await apiFetch<SessionPayload>(ENDPOINTS.session, { method: 'POST', body: { email, password } })
      const mode = await accessModeAfterPasswordSignIn(signedIn.user.id)
      await accept(signedIn, mode)
    },
    [accept],
  )

  const setCode = useCallback(async (code: string) => {
    if (!session) throw new Error('Sign in before setting an access code.')
    await saveAccessCode(session.user.id, code)
    setAccessMode('unlocked')
  }, [session])

  const unlockWithCode = useCallback(async (code: string) => {
    if (!session) return { ok: false, retryAfterMs: 0 }
    const result = await verifyAccessCode(session.user.id, code)
    if (result.ok) setAccessMode('unlocked')
    return result
  }, [session])

  const lock = useCallback(() => {
    if (session) setAccessMode('locked')
  }, [session])

  const signOut = useCallback(async () => {
    // Offline sign-out only clears this device; the server session ends on next online logout/expiry.
    try {
      await apiFetch(ENDPOINTS.logout, { method: 'POST' })
    } catch {
      /* ignore */
    }
    await clearSession()
  }, [clearSession])

  const value = useMemo(
    () => ({ status, accessMode, session, offline, signIn, setAccessCode: setCode, unlockWithAccessCode: unlockWithCode, lock, signOut, refresh }),
    [status, accessMode, session, offline, signIn, setCode, unlockWithCode, lock, signOut, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

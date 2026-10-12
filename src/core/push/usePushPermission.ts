import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'
import { currentSubscription, pushSupported, subscribeToPush, unsubscribeFromPush } from './pushClient'

export function usePushPermission() {
  const [supported] = useState(pushSupported)
  const [permission, setPermission] = useState<NotificationPermission>(() => pushSupported() ? Notification.permission : 'default')
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void currentSubscription().then((s) => { if (active) setSubscribed(Boolean(s)) }).catch(() => undefined)
    return () => { active = false }
  }, [])

  const enable = useCallback(async () => {
    setBusy(true); setError(null)
    try {
      await subscribeToPush()
      setPermission(Notification.permission)
      setSubscribed(true)
    } catch (e) {
      setPermission(pushSupported() ? Notification.permission : 'default')
      setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not enable notifications.')
    } finally { setBusy(false) }
  }, [])

  const disable = useCallback(async () => {
    setBusy(true); setError(null)
    try { await unsubscribeFromPush(); setSubscribed(false) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not disable notifications.') }
    finally { setBusy(false) }
  }, [])

  return { supported, permission, subscribed, busy, error, enable, disable }
}

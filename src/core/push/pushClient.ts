import { apiFetch } from '../api/client'
import { ENDPOINTS } from '../api/endpoints'

export function pushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function decodeKey(value: string): Uint8Array {
  const padded = value.padEnd(value.length + ((4 - value.length % 4) % 4), '=')
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function subscribeToPush(): Promise<void> {
  if (!pushSupported()) throw new Error('Push notifications are not supported by this browser.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')
  const { publicKey } = await apiFetch<{ publicKey: string }>(ENDPOINTS.pushPublicKey)
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) as BufferSource })
  await apiFetch(ENDPOINTS.pushSubscribe, { method: 'POST', body: { subscription: subscription.toJSON() } })
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await currentSubscription()
  if (!subscription) return
  await apiFetch(ENDPOINTS.pushSubscribe, { method: 'POST', body: { action: 'unsubscribe', endpoint: subscription.endpoint } })
  await subscription.unsubscribe()
}

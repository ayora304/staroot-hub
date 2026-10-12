import webpush, { type PushSubscription } from 'web-push'
import { listPushSubscriptions, updatePushSubscriptions } from './approvalsRepo'
import { HttpError } from './http'

const publicKey = () => process.env.VAPID_PUBLIC_KEY ?? ''
const privateKey = () => process.env.VAPID_PRIVATE_KEY ?? ''
const subject = () => process.env.VAPID_SUBJECT ?? 'mailto:admin@staroot.example'

function configured(): boolean {
  return Boolean(publicKey() && privateKey())
}

function prepare(): void {
  if (!configured()) throw new HttpError(503, 'Push notifications are not configured', 'push_unavailable')
  webpush.setVapidDetails(subject(), publicKey(), privateKey())
}

export function getVapidPublicKey(): string {
  if (!configured()) throw new HttpError(503, 'Push notifications are not configured', 'push_unavailable')
  return publicKey()
}

export async function sendPushToUsers(userIds: string[], link = '/m/notifications'): Promise<void> {
  if (!configured()) return
  prepare()
  const rows = await listPushSubscriptions([...new Set(userIds)])
  await Promise.allSettled(rows.flatMap(async ({ user_id, subscriptions }) => {
    const expired: string[] = []
    await Promise.allSettled(subscriptions.map(async (raw) => {
      try {
        const subscription = JSON.parse(raw) as PushSubscription
        await webpush.sendNotification(subscription, JSON.stringify({
          title: 'Staroot Hub',
          body: 'You have an update. Open Staroot Hub to review it.',
          link,
        }))
      } catch (e) {
        if ((e as { statusCode?: number })?.statusCode === 404 || (e as { statusCode?: number })?.statusCode === 410) expired.push(raw)
      }
    }))
    if (expired.length) await updatePushSubscriptions(user_id, subscriptions.filter((s) => !expired.includes(s)))
  }))
}

export function validateSubscription(value: unknown): PushSubscription {
  if (!value || typeof value !== 'object') throw new HttpError(400, 'Invalid push subscription', 'validation')
  const s = value as Record<string, unknown>
  const keys = s.keys as Record<string, unknown> | undefined
  let endpointHost = ''
  try { endpointHost = new URL(String(s.endpoint)).hostname.toLowerCase() } catch { /* handled as invalid below */ }
  const approvedHost = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'].some((host) => endpointHost === host || endpointHost.endsWith(`.${host}`)) || endpointHost.endsWith('.notify.windows.com')
  if (typeof s.endpoint !== 'string' || !approvedHost || typeof keys?.p256dh !== 'string' || typeof keys?.auth !== 'string') {
    throw new HttpError(400, 'Invalid push subscription', 'validation')
  }
  return { endpoint: s.endpoint, expirationTime: typeof s.expirationTime === 'number' ? s.expirationTime : null, keys: { p256dh: keys.p256dh, auth: keys.auth } }
}

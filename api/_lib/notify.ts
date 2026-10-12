import type { Approval } from '../../src/modules/approvals/types'
import { createNotification, listProfilesByRole } from './approvalsRepo'
import { sendPushToUsers } from './push'

export interface Notice {
  type: string
  title: string
  body?: string
  link?: string
  source_id?: string
}

/** Best effort: a failed notification must never fail the approval action that triggered it. */
export async function notifyUsers(userIds: string[], n: Notice): Promise<void> {
  const unique = [...new Set(userIds)]
  await Promise.allSettled([
    sendPushToUsers(unique, n.link ?? '/m/notifications'),
    ...unique.map((user_id) => createNotification({
        user_id,
        type: n.type,
        title: n.title.slice(0, 255),
        body: (n.body ?? '').slice(0, 255),
        link: (n.link ?? '').slice(0, 255),
        source_id: (n.source_id ?? '').slice(0, 255),
        read: false,
      })),
  ])
}

/** Users who should be told a request needs a decision (never the requestor). */
export async function approversFor(approval: Approval): Promise<string[]> {
  const role = approval.assigned_role ?? 'manager'
  const profiles = await listProfilesByRole(role)
  return profiles
    .filter((p) => p.active && p.user_id !== approval.requestor_id && (role === 'executive' || p.department === approval.department))
    .map((p) => p.user_id)
}

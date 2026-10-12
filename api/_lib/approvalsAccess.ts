import { canAccessRecord } from '../../src/core/rbac/permissions'
import type { Scope } from '../../src/core/rbac/roles'
import type { DecisionActor } from '../../src/modules/approvals/domain/stateMachine'
import type { Approval } from '../../src/modules/approvals/types'
import type { AuthContext } from './auth'
import { getApproval } from './approvalsRepo'
import { HttpError } from './http'

export const actorOf = (ctx: AuthContext): DecisionActor => ({
  userId: ctx.userId,
  role: ctx.profile.role,
  department: ctx.profile.department,
})

export const isVisible = (scope: Scope, ctx: AuthContext, a: Approval) =>
  canAccessRecord(scope, { userId: ctx.userId, department: ctx.profile.department }, { ownerId: a.requestor_id, department: a.department })

/** Loads an approval the caller may see. Anything else is a 404 so IDs cannot be probed. */
export async function requireVisibleApproval(ctx: AuthContext, scope: Scope, id: string): Promise<Approval> {
  const a = await getApproval(id)
  if (!a || !isVisible(scope, ctx, a)) throw new HttpError(404, 'Request not found', 'not_found')
  return a
}

export function queryParams(url: string | undefined): Record<string, string> {
  return Object.fromEntries(new URL(url ?? '/', 'http://local').searchParams)
}

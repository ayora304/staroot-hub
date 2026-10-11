import { canUseModule, scopeFor } from '../../src/core/rbac/permissions'
import type { Action, ModuleId, Scope } from '../../src/core/rbac/roles'
import { listPermissions } from './appwrite'
import type { AuthContext } from './auth'
import { HttpError } from './http'

/** Call at the top of every endpoint after authenticate(). Returns the row-visibility scope. */
export async function requireAccess(ctx: AuthContext, module: ModuleId, action: Action): Promise<Scope> {
  const rows = await listPermissions()
  if (!canUseModule(rows, ctx.profile, module, action)) throw new HttpError(403, 'Forbidden', 'forbidden')
  if (module === 'admin') return 'all'
  return scopeFor(rows, ctx.profile.role, module) ?? 'own'
}

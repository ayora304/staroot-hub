import { useContext } from 'react'
import { AuthContext } from './AuthProvider'
import { canUseModule } from '../rbac/permissions'
import type { Action, ModuleId } from '../rbac/roles'

export function useSession() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useSession must be used inside <AuthProvider>')
  return ctx
}

/** UI-only permission check. The server enforces the real rule. */
export function usePermissions() {
  const { session } = useSession()
  return {
    can: (module: ModuleId, action: Action = 'read') =>
      session ? canUseModule(session.permissions, session.profile, module, action) : false,
  }
}

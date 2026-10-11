import { Outlet } from 'react-router-dom'
import { usePermissions } from '../auth/useSession'
import { EmptyState } from '../ui/EmptyState'
import type { Action, ModuleId } from './roles'

/** Route gate: renders child routes only if the user may use the module. UI-only; the API re-checks. */
export function RequireRole({ module, action = 'read' }: { module: ModuleId; action?: Action }) {
  const { can } = usePermissions()
  if (!can(module, action)) {
    return <EmptyState title="No access" body="Your role does not include this module. Ask an administrator if you need it." />
  }
  return <Outlet />
}

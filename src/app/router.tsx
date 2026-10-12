import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { RequireAuth } from '../core/auth/RequireAuth'
import { SignInScreen } from '../core/auth/SignInScreen'
import { RequireRole } from '../core/rbac/RequireRole'
import { ApprovalsApp } from '../modules/approvals'
import { HUB_MODULES, HubScreen, ModulePlaceholder } from '../modules/hub'
import type { HubModule } from '../modules/hub/registry'
import { InboxScreen } from '../modules/notifications'

// One gated route per Hub module. Modules that are built get their real screen here; the rest stay placeholders.
function childrenFor(m: HubModule): RouteObject[] {
  switch (m.id) {
    case 'approvals':
      return [{ index: true, element: <ApprovalsApp /> }, { path: ':id', element: <ApprovalsApp /> }]
    case 'notifications':
      return [{ index: true, element: <InboxScreen /> }]
    default:
      return [{ index: true, element: <ModulePlaceholder module={m} /> }]
  }
}

const moduleRoutes: RouteObject[] = HUB_MODULES.map((m) => ({
  path: m.route,
  element: <RequireRole module={m.id} />,
  children: childrenFor(m),
}))

export const router = createBrowserRouter([
  { path: '/login', element: <SignInScreen /> },
  { element: <RequireAuth />, children: [{ path: '/', element: <HubScreen /> }, ...moduleRoutes] },
  { path: '*', element: <Navigate to="/" replace /> },
])

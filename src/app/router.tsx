import { lazy } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { RequireAuth } from '../core/auth/RequireAuth'
import { SignInScreen } from '../core/auth/SignInScreen'
import { RequireRole } from '../core/rbac/RequireRole'
import { HUB_MODULES, HubScreen, ModulePlaceholder } from '../modules/hub'
import type { HubModule } from '../modules/hub/registry'
import { InboxScreen } from '../modules/notifications'
const ApprovalsApp = lazy(() => import('../modules/approvals').then((module) => ({ default: module.ApprovalsApp })))
const InventoryApp = lazy(() => import('../modules/inventory').then((module) => ({ default: module.InventoryApp })))
const SiteProgressApp = lazy(() => import('../modules/site-progress').then((module) => ({ default: module.SiteProgressApp })))

// One gated route per Hub module. Modules that are built get their real screen here; the rest stay placeholders.
function childrenFor(m: HubModule): RouteObject[] {
  switch (m.id) {
    case 'approvals':
      return [{ index: true, element: <ApprovalsApp /> }]
    case 'notifications':
      return [{ index: true, element: <InboxScreen /> }]
    case 'site':
      return [{ index: true, element: <SiteProgressApp /> }, { path: ':id', element: <SiteProgressApp /> }]
    case 'inventory':
      return [{ index: true, element: <InventoryApp /> }]
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
  { path: '/welcome', element: <SignInScreen /> },
  { path: '/login', element: <SignInScreen /> },
  { path: '/splash', element: <Navigate to="/welcome" replace /> },
  { element: <RequireAuth />, children: [{ path: '/', element: <HubScreen /> }, ...moduleRoutes] },
  { path: '*', element: <Navigate to="/welcome" replace /> },
])

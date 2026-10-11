import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import { RequireAuth } from '../core/auth/RequireAuth'
import { SignInScreen } from '../core/auth/SignInScreen'
import { RequireRole } from '../core/rbac/RequireRole'
import { HUB_MODULES, HubScreen, ModulePlaceholder } from '../modules/hub'

// Each module route is gated by RequireRole. When a real module ships, swap its placeholder element.
const moduleRoutes: RouteObject[] = HUB_MODULES.map((m) => ({
  path: m.route,
  element: <RequireRole module={m.id} />,
  children: [{ index: true, element: <ModulePlaceholder module={m} /> }],
}))

export const router = createBrowserRouter([
  { path: '/login', element: <SignInScreen /> },
  {
    element: <RequireAuth />,
    children: [{ path: '/', element: <HubScreen /> }, ...moduleRoutes],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])

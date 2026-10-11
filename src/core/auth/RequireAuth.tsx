import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from './useSession'
import { Skeleton } from '../ui/Skeleton'

export function RequireAuth() {
  const { status } = useSession()
  const location = useLocation()
  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-6 pt-safe">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    )
  }
  if (status === 'anon') return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

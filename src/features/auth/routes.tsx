import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { RouteLoader } from '../../components/RouteLoader'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const location = useLocation()
  const { isAuthenticated, isRestoringSession } = useAuth()

  if (isRestoringSession) {
    return <RouteLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export function AdminRoute() {
  const { user } = useAuth()

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

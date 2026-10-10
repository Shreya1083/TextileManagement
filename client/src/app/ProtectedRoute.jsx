import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ roles }) {
  const { user, hasRole } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (roles && !hasRole(...roles)) return <Navigate to="/403" replace />

  return <Outlet />
}

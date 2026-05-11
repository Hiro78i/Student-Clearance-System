import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { needsOfficeAssignment } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { LoadingState } from '@/components/shared/LoadingState'

export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, loading, profile } = useAuth()
  const location = useLocation()

  // Still resolving session — don't redirect yet.
  if (loading) return <LoadingState />

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  // User is authenticated but their profile has no role yet (role_id is null
  // in Supabase or the roles table lookup failed). Redirect to a friendly
  // "account setup pending" page instead of a scary 403.
  if (allowedRoles?.length && !profile?.role) {
    return <Navigate replace to="/setup-pending" />
  }

  if (allowedRoles?.length && needsOfficeAssignment(profile)) {
    return <Navigate replace to="/setup-pending" />
  }

  if (allowedRoles?.length && !allowedRoles.includes(profile.role)) {
    return <Navigate replace to="/unauthorized" />
  }

  return <Outlet />
}

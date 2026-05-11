import { Navigate } from 'react-router-dom'
import { resolveHomePath } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { LoadingState } from '@/components/shared/LoadingState'

export function RoleRedirect() {
  const { profile, loading } = useAuth()

  if (loading) return <LoadingState />
  if (!profile) return <Navigate replace to="/login" />

  return <Navigate replace to={resolveHomePath(profile)} />
}

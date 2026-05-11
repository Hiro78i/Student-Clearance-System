import { LogOut, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS, needsOfficeAssignment } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { confirmAction, toast } from '@/lib/alerts'

export function SetupPendingPage() {
  const navigate = useNavigate()
  const { profile, logout } = useAuth()
  const isOfficeAwaitingAssignment = needsOfficeAssignment(profile)

  async function handleLogout() {
    const result = await confirmAction({
      title: 'Sign out?',
      text: 'You will return to the login page.',
      confirmButtonText: 'Sign out',
      icon: 'warning',
    })

    if (!result.isConfirmed) return

    await logout()
    toast('Signed out successfully')
    navigate('/login', { replace: true })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-8 shadow-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
          <ShieldAlert className="h-8 w-8 text-amber-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Account Setup Pending</h1>
          <p className="text-slate-600 leading-6">
            Hi <span className="font-semibold">{profile?.full_name || profile?.email}</span>!{' '}
            {isOfficeAwaitingAssignment ? (
              <>
                Your office staff account is active, but your <strong>office assignment is still pending</strong>.
              </>
            ) : (
              <>
                Your account was created but your <strong>role has not been assigned yet</strong> by the administrator.
              </>
            )}
          </p>
          <p className="text-sm text-slate-500 leading-6">
            {isOfficeAwaitingAssignment
              ? 'Please wait for the administrator to assign your office in the User Management or Office Management panel before you can access the office review pages.'
              : 'Please wait for the system administrator to assign your role (Student, Office Staff, Registrar, or Admin) in the Supabase dashboard or User Management panel.'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your account info</p>
          <p className="text-sm font-semibold text-slate-800">{profile?.email}</p>
          <p className="text-xs text-slate-500">
            Role:{' '}
            <span className="font-semibold text-slate-700">
              {profile?.role ? ROLE_LABELS[profile.role] : 'Not assigned'}
            </span>
          </p>
          <p className="text-xs text-slate-500">
            Office:{' '}
            <span className="font-semibold text-amber-600">
              {profile?.office_id ? 'Assigned' : 'Pending assignment'}
            </span>
          </p>
        </div>

        <Button
          className="w-full"
          onClick={handleLogout}
          variant="outline"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </main>
  )
}

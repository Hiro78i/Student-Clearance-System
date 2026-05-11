import { ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export function UnauthorizedPage() {
  const { profile } = useAuth()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">403 Unauthorized</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your account does not have permission to access this workspace.
        </p>
        <p className="mt-2 text-xs font-mono text-slate-500">
          Debug - Current Role: {profile?.role || 'None'}
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Return to dashboard</Link>
        </Button>
      </section>
    </main>
  )
}

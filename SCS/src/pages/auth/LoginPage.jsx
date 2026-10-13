import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, IdCard, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resolveHomePath, ROLES } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/lib/alerts'

const schema = z.object({
  identifier: z.string().min(1, 'Email address or student number is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  })

  async function onSubmit(values) {
    try {
      const profile = await login(values)
      toast('Welcome back')

      let destination = resolveHomePath(profile)
      const fromPath = location.state?.from?.pathname

      // Prevent unauthorized redirects if the user logged in with a different
      // role than the one that triggered the login redirect.
      if (fromPath) {
        if (
          (profile.role === ROLES.STUDENT && fromPath.startsWith('/student/')) ||
          (profile.role === ROLES.OFFICE && fromPath.startsWith('/office/')) ||
          (profile.role === ROLES.REGISTRAR && fromPath.startsWith('/registrar/')) ||
          (profile.role === ROLES.ADMIN && fromPath.startsWith('/admin/'))
        ) {
          destination = fromPath
        }
      }

      navigate(destination, { replace: true })
    } catch (error) {
      toast(error.message || 'Unable to sign in', 'error')
    }
  }

  return (
    <Card className="w-full max-w-[430px] rounded-none border border-slate-300 border-t-4 border-t-[#c78b18] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
      <CardHeader className="space-y-0 border-b border-slate-200 p-6 sm:p-8 sm:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a56a00]">
          Secure account access
        </p>
        <CardTitle className="mt-2 font-serif text-3xl font-bold text-[#082b5c]">
          Sign in to the portal
        </CardTitle>
        <CardDescription className="mt-3 leading-6 text-slate-600">
          Use your registered email address or student number to continue.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label className="font-semibold text-slate-800" htmlFor="identifier">
              Email address or student number
            </Label>
            <div className="relative">
              <IdCard className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="identifier"
                autoComplete="username"
                className="min-h-12 rounded-sm border-slate-300 bg-white pl-10 shadow-none focus-visible:ring-[#1456a0]"
                placeholder="Enter your account ID"
                {...register('identifier')}
              />
            </div>
            {errors.identifier && (
              <p className="text-sm font-medium text-rose-700" role="alert">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="font-semibold text-slate-800" htmlFor="password">
                Password
              </Label>
              <Link
                className="text-sm font-semibold text-[#1456a0] underline-offset-4 hover:underline"
                to="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="password"
                autoComplete="current-password"
                className="min-h-12 rounded-sm border-slate-300 bg-white pl-10 pr-12 shadow-none focus-visible:ring-[#1456a0]"
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1456a0]"
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm font-medium text-rose-700" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            className="min-h-12 w-full rounded-sm bg-[#0d4c92] text-base shadow-none hover:bg-[#082b5c]"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
          New student?{' '}
          <Link
            className="font-semibold text-[#1456a0] underline-offset-4 hover:underline"
            to="/register"
          >
            Create an account
          </Link>
        </div>

        <div className="mt-5 flex gap-3 bg-slate-100 p-3.5 text-xs leading-5 text-slate-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0d4c92]" />
          <p>
            This system is restricted to authorized students and personnel. Keep your
            account credentials private.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

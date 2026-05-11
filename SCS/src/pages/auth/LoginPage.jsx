import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, IdCard, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resolveHomePath, ROLES } from '@/constants/roles'
import { toast } from '@/lib/alerts'
import { useAuth } from '@/hooks/useAuth'
import mabiniLogo from '@/assets/mabinilogo.jpg'

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
    <Card className="mx-auto w-full max-w-[440px] border border-slate-200 bg-white shadow-[0_34px_90px_rgba(15,23,42,0.24)] ring-1 ring-slate-900/5">
      <CardHeader className="space-y-4 p-6 pb-0 sm:p-7 sm:pb-0">
        <div className="lg:hidden">
          <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-white">
            <img
              alt="Mabini logo"
              className="h-10 w-10 rounded-xl bg-white object-cover p-1"
              src={mabiniLogo}
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-blue-200">
                Mabini Colleges
              </p>
              <p className="text-sm font-semibold">Student Clearance System</p>
            </div>
          </div>
        </div>

        <div>
          <CardTitle className="text-3xl font-bold tracking-normal text-slate-950">
            Log in
          </CardTitle>
          <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
            Students can sign in with email or student number. Office staff use email.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-7">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label className="text-slate-800" htmlFor="identifier">
              Email or Student Number
            </Label>
            <div className="relative">
              <IdCard className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="identifier"
                autoComplete="username"
                className="min-h-11 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 shadow-none focus-visible:bg-white"
                placeholder="name@college.edu or 142020"
                {...register('identifier')}
              />
            </div>
            {errors.identifier && (
              <p className="text-sm font-medium text-rose-600">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-800" htmlFor="password">
              Password
            </Label>
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                autoComplete="current-password"
                className="min-h-11 rounded-2xl border-slate-200 bg-slate-50/80 pl-11 pr-12 shadow-none focus-visible:bg-white"
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-800"
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
              <p className="text-sm font-medium text-rose-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex justify-end text-sm">
            <Link
              className="font-semibold text-blue-700 transition hover:text-blue-900"
              to="/forgot-password"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            className="min-h-11 w-full rounded-2xl bg-blue-700 text-base shadow-lg shadow-blue-700/20 hover:bg-blue-800"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in securely'}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm font-medium text-slate-600">
          Need an account?{' '}
          <Link className="font-semibold text-blue-700 hover:text-blue-900" to="/register">
            Create account
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

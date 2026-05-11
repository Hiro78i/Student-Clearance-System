import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/alerts'

const schema = z
  .object({
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirmPassword: z.string().min(8, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export function ResetPasswordPage() {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit() {
    toast('Password has been updated')
  }

  return (
    <Card className="mx-auto w-full max-w-md border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-3xl font-bold">Reset password</CardTitle>
        <CardDescription>Choose a new secure password for your account.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && (
              <p className="text-sm font-medium text-rose-600">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm font-medium text-rose-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            Update password
          </Button>
        </form>
        <Link className="mt-5 inline-flex text-sm font-semibold text-blue-700" to="/login">
          Back to login
        </Link>
      </CardContent>
    </Card>
  )
}

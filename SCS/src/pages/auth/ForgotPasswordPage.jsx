import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/alerts'
import { authService } from '@/services/authService'

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
})

export function ForgotPasswordPage() {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values) {
    const response = await authService.resetPassword(values.email)
    if (response.error) {
      toast(response.error.message, 'error')
      return
    }
    toast('Password reset instructions sent')
  }

  return (
    <Card className="mx-auto w-full max-w-md border-0 shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="text-3xl font-bold">Forgot password</CardTitle>
        <CardDescription>
          Enter your registered email to receive password reset instructions.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" {...register('email')} />
            {errors.email && (
              <p className="text-sm font-medium text-rose-600">
                {errors.email.message}
              </p>
            )}
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            Send reset link
          </Button>
        </form>
        <Link className="mt-5 inline-flex text-sm font-semibold text-blue-700" to="/login">
          Back to login
        </Link>
      </CardContent>
    </Card>
  )
}

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useClearance } from '@/hooks/useClearance'
import { toast } from '@/lib/alerts'

const schema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm the password.'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

export function UserChangePasswordDialog({ user, onOpenChange, open }) {
  const { changeManagedUserPassword } = useClearance()
  const [submitError, setSubmitError] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  async function onSubmit(values) {
    setSubmitError('')
    try {
      await changeManagedUserPassword(user.id, values.newPassword)
      toast('Password changed successfully.')
      reset()
      onOpenChange(false)
    } catch (error) {
      const message = error?.message || 'Unable to change password.'
      setSubmitError(message)
      toast(message, 'error')
    }
  }

  function handleOpenChange(nextOpen) {
    if (isSubmitting) return
    if (!nextOpen) {
      reset()
      setSubmitError('')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogHeader>
        <DialogTitle>Change Password</DialogTitle>
        <DialogDescription>
          Set a new password for {user?.full_name || 'this user'}.
        </DialogDescription>
      </DialogHeader>
      <DialogContent>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {submitError && (
            <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <p className="text-sm text-rose-700">{submitError}</p>
            </div>
          )}

          <PasswordField
            error={errors.newPassword?.message}
            label="New Password"
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            disabled={isSubmitting}
            inputProps={{ autoComplete: 'new-password', ...register('newPassword') }}
          />

          <PasswordField
            error={errors.confirmPassword?.message}
            label="Confirm Password"
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            disabled={isSubmitting}
            inputProps={{ autoComplete: 'new-password', ...register('confirmPassword') }}
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button disabled={isSubmitting} onClick={() => handleOpenChange(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Updating…</>
              ) : (
                <><KeyRound className="h-4 w-4" />Change Password</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PasswordField({ disabled, error, inputProps, label, onToggle, show }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          disabled={disabled}
          style={{ paddingRight: '2.5rem' }}
          className="flex min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          {...inputProps}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
          className="text-slate-400 hover:text-slate-700 transition-colors"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
    </div>
  )
}


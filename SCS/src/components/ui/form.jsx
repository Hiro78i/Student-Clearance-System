import { cn } from '@/lib/utils'
import { Label } from './label'

export function FormField({ label, error, children, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      {children}
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
    </div>
  )
}

export function FormActions({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  )
}

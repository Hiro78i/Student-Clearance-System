import { cn } from '@/lib/utils'

export function Tabs({ value, onValueChange, children, className }) {
  return (
    <div className={cn('space-y-4', className)} data-value={value}>
      {typeof children === 'function' ? children({ value, onValueChange }) : children}
    </div>
  )
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex min-h-11 items-center rounded-xl bg-slate-100 p-1 text-slate-600',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ active, className, ...props }) {
  return (
    <button
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-semibold transition hover:text-slate-950',
        active && 'bg-white text-slate-950 shadow-sm',
        className,
      )}
      type="button"
      {...props}
    />
  )
}

export function TabsContent({ active, className, ...props }) {
  if (!active) return null
  return <div className={cn('outline-none', className)} {...props} />
}

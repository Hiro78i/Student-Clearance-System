import { cn } from '@/lib/utils'

export function DropdownMenu({ open, children }) {
  return <div className="relative">{typeof children === 'function' ? children(open) : children}</div>
}

export function DropdownMenuContent({ className, ...props }) {
  return (
    <div
      className={cn(
        'absolute right-0 z-50 mt-2 min-w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuItem({ className, ...props }) {
  return (
    <button
      className={cn(
        'flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100',
        className,
      )}
      type="button"
      {...props}
    />
  )
}

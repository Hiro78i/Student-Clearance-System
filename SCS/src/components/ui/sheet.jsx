import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export function Sheet({ open, onOpenChange, side = 'right', children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm">
      <div
        className={cn(
          'fixed inset-y-0 w-[min(28rem,92vw)] bg-white shadow-2xl',
          side === 'left' ? 'left-0' : 'right-0',
        )}
      >
        <div className="flex justify-end p-3">
          <Button
            onClick={() => onOpenChange(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SheetHeader({ className, ...props }) {
  return <div className={cn('px-6 pb-4', className)} {...props} />
}

export function SheetTitle({ className, ...props }) {
  return <h2 className={cn('text-xl font-bold text-slate-950', className)} {...props} />
}

export function SheetContent({ className, ...props }) {
  return <div className={cn('px-6 pb-6', className)} {...props} />
}

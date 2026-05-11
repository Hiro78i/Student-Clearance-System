import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl">
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

export function DialogHeader({ className, ...props }) {
  return <div className={cn('px-6 pb-3', className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  return <h2 className={cn('text-xl font-bold text-slate-950', className)} {...props} />
}

export function DialogDescription({ className, ...props }) {
  return <p className={cn('mt-2 text-sm text-slate-600', className)} {...props} />
}

export function DialogContent({ className, ...props }) {
  return <div className={cn('px-6 pb-6', className)} {...props} />
}

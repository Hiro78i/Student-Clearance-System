import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-blue-700 text-white shadow-sm hover:bg-blue-800',
        destructive: 'bg-rose-700 text-white shadow-sm hover:bg-rose-800',
        outline: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        ghost: 'text-slate-700 hover:bg-slate-100',
        success: 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800',
      },
      size: {
        default: 'px-4 py-2',
        sm: 'min-h-9 rounded-lg px-3 py-1.5 text-xs',
        lg: 'min-h-11 px-5 py-2.5',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export function Button({ className, variant, size, asChild = false, ...props }) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

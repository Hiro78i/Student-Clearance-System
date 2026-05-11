import { ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const toneClasses = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
}

export function StatCard({
  title,
  value,
  description,
  icon,
  tone = 'blue',
}) {
  const IconComponent = icon || ArrowUpRight

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
              {value}
            </p>
          </div>
          <div className={cn('rounded-2xl p-3 ring-1', toneClasses[tone])}>
            <IconComponent className="h-5 w-5" />
          </div>
        </div>
        {description && (
          <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

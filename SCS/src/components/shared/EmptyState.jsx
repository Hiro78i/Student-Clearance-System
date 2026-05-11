import { Inbox } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function EmptyState({ title, description, action }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Inbox className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
        {action && <div className="mt-5">{action}</div>}
      </CardContent>
    </Card>
  )
}

import { Skeleton } from '@/components/ui/skeleton'

export function LoadingState() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-28" />
      <Skeleton className="h-64" />
      <Skeleton className="h-40" />
    </div>
  )
}

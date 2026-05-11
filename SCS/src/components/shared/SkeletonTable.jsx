import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton className="h-14" key={index} />
      ))}
    </div>
  )
}

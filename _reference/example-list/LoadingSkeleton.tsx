import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function SkeletonCard() {
  return (
    <Card aria-hidden="true">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-3 w-2/5" />
      </CardContent>
    </Card>
  )
}

export function LoadingSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      aria-label="Loading users"
      aria-busy="true"
    >
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )
}

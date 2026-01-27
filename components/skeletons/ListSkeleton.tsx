import { Skeleton } from "@/components/ui/skeleton"

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  )
}

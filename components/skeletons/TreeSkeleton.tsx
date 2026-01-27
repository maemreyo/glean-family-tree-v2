import { Skeleton } from "@/components/ui/skeleton"

export function TreeSkeleton() {
  return (
    <div className="h-[500px] w-full rounded-lg border bg-white p-4 dark:bg-gray-800 dark:border-gray-700 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <Skeleton className="h-9 w-40 rounded-md" />
          <div className="flex gap-12">
            <Skeleton className="h-9 w-40 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
          <div className="flex gap-4">
             <Skeleton className="h-9 w-40 rounded-md" />
             <Skeleton className="h-9 w-40 rounded-md" />
             <Skeleton className="h-9 w-40 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

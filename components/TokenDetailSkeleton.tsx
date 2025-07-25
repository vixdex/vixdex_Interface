import { Skeleton } from "@/components/ui/skeleton"

export function TokenDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        ))}
      </div>
      <div className="h-[400px] w-full mt-6">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  )
}

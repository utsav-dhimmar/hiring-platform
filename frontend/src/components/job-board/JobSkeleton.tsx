import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton placeholder that mirrors the layout of a single job row in the data table.
 *
 * Rendered while the job list is loading to provide a visual loading state.
 */
export const JobSkeleton = () => (
  <div className="border rounded-2xl p-5 bg-background/30 animate-pulse border-muted-foreground/10">
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-48 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-16 rounded-md" />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 self-end lg:self-center">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-10 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

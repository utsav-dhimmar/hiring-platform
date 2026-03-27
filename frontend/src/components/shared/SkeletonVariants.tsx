import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Text skeleton loader with multiple lines.
 */
export const TextSkeleton = ({ lines = 1, className = "" }: { lines?: number; className?: string }) => (
  <div className={cn("space-y-2", className)}>
    {[...Array(lines)].map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "h-4 w-full",
          i === lines - 1 && lines > 1 ? "w-[60%]" : "w-full"
        )}
      />
    ))}
  </div>
);

/**
 * Table row skeleton loader for data tables.
 */
export const TableRowSkeleton = ({ columns, className = "" }: { columns: number; className?: string }) => (
  <tr className={className}>
    {[...Array(columns)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-[80%]" />
      </td>
    ))}
  </tr>
);

/**
 * Card skeleton loader for grid layouts.
 */
export const CardSkeleton = ({ className = "" }: { className?: string }) => (
  <div className={cn("rounded-xl border bg-card p-6 shadow-sm", className)}>
    <Skeleton className="h-[150px] w-full mb-4 rounded-lg" />
    <Skeleton className="h-6 w-[70%] mb-2" />
    <Skeleton className="h-4 w-[40%]" />
  </div>
);

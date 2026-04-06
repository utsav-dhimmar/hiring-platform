import { type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "../ui/card";

/**
 * Props for the StatCard component.
 */
interface StatCardProps {
  /** Label describing the statistic */
  label: string;
  /** The numeric or text value to display */
  value: string | number;
  /** Optional icon to display next to the label */
  icon?: ReactNode;
  /** Whether the stat is currently loading */
  loading?: boolean;
  /** Optional trend indicator showing percentage change */
  trend?: {
    /** The percentage value of the trend */
    value: number;
    /** Whether the trend is positive (up) or negative (down) */
    isUp: boolean;
  };
  /** Additional CSS class name */
  className?: string;
}

/**
 * Statistics card displaying a metric with optional trend.
 */
const StatCard = ({ label, value, icon, loading, trend, className = "" }: StatCardProps) => {
  return (
    <Card className={`border-0 shadow-md rounded-2xl aspect-square flex flex-col justify-center transition-all hover:shadow-lg hover:-translate-y-1 h-30 ${className}`}>
      <CardContent className="p-4.5 text-center flex flex-col items-center justify-center gap-1.5">
        <div className="flex flex-col items-center mb-1">
          {icon && <span className="text-primary text-2xl mb-2">{icon}</span>}
          <span className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-2">
            {label}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1">
          {loading ? (
            <Skeleton className="h-10 w-16 rounded-lg" />
          ) : (
            <h2 className="text-4xl font-extrabold text-foreground tracking-tight">{value}</h2>
          )}
          {trend && !loading && (
            <Badge variant={trend.isUp ? "default" : "destructive"} className="mt-1 font-medium">
              {trend.isUp ? "↑" : "↓"} {trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;

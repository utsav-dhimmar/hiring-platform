import { type ReactNode } from "react";
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
const StatCard = ({ label, value, icon, trend, className = "" }: StatCardProps) => {
  return (
    <Card className={`border-0 shadow-sm rounded-4 ${className}`}>
      <CardContent className="p-4 text-start">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold uppercase text-muted-foreground tracking-wide">
            {label}
          </span>
          {icon && <span className="text-primary">{icon}</span>}
        </div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-3xl font-bold mb-0 text-foreground">{value}</h2>
          {trend && (
            <Badge variant={trend.isUp ? "default" : "destructive"} className="ml-2">
              {trend.isUp ? "↑" : "↓"} {trend.value}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;

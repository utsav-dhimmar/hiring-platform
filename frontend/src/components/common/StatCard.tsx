import { type ReactNode } from "react";
import { Badge } from "react-bootstrap";
import { Card, CardBody } from "./Card";

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
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Users"
 *   value={150}
 *   icon={<UsersIcon />}
 *   trend={{ value: 12, isUp: true }}
 * />
 * ```
 */
const StatCard = ({ label, value, icon, trend, className = "" }: StatCardProps) => {
  return (
    <Card className={`analytics-card border-0 shadow-sm rounded-4 ${className}`}>
      <CardBody className="p-4 text-start">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-muted small fw-bold text-uppercase letter-spacing-wide">
            {label}
          </span>
          {icon && <span className="text-primary">{icon}</span>}
        </div>
        <div className="d-flex align-items-baseline justify-content-between">
          <h2 className="display-6 fw-bold mb-0 text-dark tabular-nums">{value}</h2>
          {trend && (
            <Badge
              bg={trend.isUp ? "success" : "danger"}
              className={`ms-2 px-2 py-1 rounded-pill bg-${trend.isUp ? "success" : "danger"}-subtle text-${trend.isUp ? "success" : "danger"}`}
            >
              {trend.isUp ? "↑" : "↓"} {trend.value}%
            </Badge>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default StatCard;

/**
 * Statistics card component for displaying key metrics.
 * Shows a label, value, optional icon, and trend indicator.
 */

import React, { type ReactNode } from "react";
import { Card, CardHeader, CardBody } from "./Card";

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
const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, className = "" }) => {
  return (
    <Card className={`analytics-card ${className}`}>
      <CardHeader className="d-flex justify-content-between align-items-center">
        <span>{label}</span>
        {icon && <span className="stat-icon">{icon}</span>}
      </CardHeader>
      <CardBody>
        <div className="d-flex align-items-end justify-content-between">
          <p className="analytics-value mb-0">{value}</p>
          {trend && (
            <span className={`trend-value ${trend.isUp ? "text-success" : "text-danger"} small`}>
              {trend.isUp ? "↑" : "↓"} {trend.value}%
            </span>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default StatCard;

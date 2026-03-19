/**
 * Status badge component for displaying boolean or string status values.
 * Automatically maps status values to appropriate color variants.
 */

import React from "react";
import { Badge } from "react-bootstrap";

/**
 * Props for the StatusBadge component.
 */
interface StatusBadgeProps {
  /** The status value to display (boolean or string) */
  status: string | boolean;
  /** Label to show when status is true (default: "Active") */
  trueLabel?: string;
  /** Label to show when status is false (default: "Inactive") */
  falseLabel?: string;
  /** Bootstrap variant for true status (default: "success") */
  trueVariant?: string;
  /** Bootstrap variant for false status (default: "danger") */
  falseVariant?: string;
  /** Custom mapping of string values to Bootstrap variants */
  mapping?: Record<string, string>;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Badge displaying status with automatic color mapping.
 * @example
 * ```tsx
 * <StatusBadge status={user.isActive} />
 * <StatusBadge status="pending" mapping={{ pending: 'warning' }} />
 * ```
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  trueLabel = "Active",
  falseLabel = "Inactive",
  trueVariant = "success",
  falseVariant = "danger",
  mapping,
  className = "",
}) => {
  let label: string;
  let variant: string;

  if (typeof status === "boolean") {
    label = status ? trueLabel : falseLabel;
    variant = status ? trueVariant : falseVariant;
  } else {
    label = status;
    variant = mapping?.[status.toLowerCase()] || "secondary";

    // Default mappings if none provided
    if (!mapping) {
      const s = status.toLowerCase();
      if (["active", "completed", "success", "pass", "published"].includes(s)) variant = "success";
      else if (["inactive", "failed", "error", "danger", "closed", "deleted"].includes(s))
        variant = "danger";
      else if (["pending", "warning", "draft", "processing"].includes(s)) variant = "warning";
      else if (["info", "new", "scheduled"].includes(s)) variant = "info";
    }
  }

  return (
    <Badge bg={variant} className={className}>
      {label}
    </Badge>
  );
};

export default StatusBadge;

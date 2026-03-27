/**
 * Status badge component for displaying boolean or string status values.
 * Automatically maps status values to appropriate color variants.
 */

import { badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  /** Variant for true status (default: "default" - success/green) */
  trueVariant?: "default" | "secondary" | "destructive" | "outline";
  /** Variant for false status (default: "destructive" - red) */
  falseVariant?: "default" | "secondary" | "destructive" | "outline";
  /** Custom mapping of string values to Badge variants */
  mapping?: Record<string, "default" | "secondary" | "destructive" | "outline">;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Badge displaying status with automatic color mapping.
 */
const StatusBadge = ({
  status,
  trueLabel = "Active",
  falseLabel = "Inactive",
  trueVariant = "default",
  falseVariant = "destructive",
  mapping,
  className = "",
}: StatusBadgeProps) => {
  let label: string;
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";

  if (typeof status === "boolean") {
    label = status ? trueLabel : falseLabel;
    variant = status ? trueVariant : falseVariant;
  } else {
    label = status;

    if (mapping) {
      variant = mapping[status.toLowerCase()] || "secondary";
    } else {
      const s = status.toLowerCase();
      if (["active", "completed", "success", "pass", "published"].includes(s)) {
        variant = "default";
      } else if (["inactive", "failed", "error", "closed", "deleted"].includes(s)) {
        variant = "destructive";
      } else if (["pending", "draft", "processing", "queued"].includes(s)) {
        variant = "secondary";
      } else if (["new", "scheduled"].includes(s)) {
        variant = "outline";
      }
    }
  }

  return <span className={cn(badgeVariants({ variant }), className)}>{label}</span>;
};

export default StatusBadge;

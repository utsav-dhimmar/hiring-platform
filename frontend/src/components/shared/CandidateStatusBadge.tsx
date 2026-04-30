import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Unified status badge for candidate-related statuses (Pass/Fail, HR Decision, Stage).
 * Ensures visual consistency across the platform.
 */
interface CandidateStatusBadgeProps {
  /** The status value to display */
  status: string | null | undefined;
  /** Optional additional CSS classes */
  className?: string;
  /** Custom label to override the status text */
  label?: string;
}

const CandidateStatusBadge: React.FC<CandidateStatusBadgeProps> = ({
  status,
  className,
  label: customLabel
}) => {
  if (!status) return null;

  const s = status.toLowerCase().trim();
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  let label = customLabel || status;

  // Success / Positive
  if (["pass", "approve", "active", "completed", "complete", "complet", "success"].includes(s)) {
    variant = "default";
  }
  // Destructive / Negative
  else if (["fail", "reject", "inactive", "error", "rejected"].includes(s)) {
    variant = "destructive";
  }
  // Neutral / Pending
  else if (["pending", "maybe", "processing", "draft"].includes(s)) {
    variant = "secondary";
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        "rounded-full px-2 py-0 text-[10px] uppercase font-bold w-fit tracking-wider",
        className
      )}
    >
      {label}
    </Badge>
  );
};

export default CandidateStatusBadge;

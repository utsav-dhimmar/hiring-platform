import React from "react";
import { cn } from "@/lib/utils";

/**
 * Valid HR Decision types.
 */
export type HRDecision = "approve" | "reject" | "maybe" | "pending" | string;

interface HRDecisionBadgeProps {
  /** The decision value from the candidate data */
  decision?: HRDecision | null;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * A custom badge for HR Decisions with consistent styling.
 * Logic:
 * - Approve: Green background, White text (Dark background)
 * - Reject: Red background, White text (Dark background)
 * - Maybe: Amber background, Black text (Light background)
 * - Pending: Slate background, Black text (Light background)
 * 
 * Supports Dark Mode with appropriate contrast.
 */
const HRDecisionBadge: React.FC<HRDecisionBadgeProps> = ({ decision, className }) => {
  const d = decision?.toLowerCase() || "pending";

  // Define styles for each decision state
  // "text would be black on dark it would white"
  // Interpret: Dark backgrounds get white text, Light backgrounds get black text.
  const variants: Record<string, { bg: string; text: string; label: string }> = {
    approve: { 
      bg: "bg-emerald-500 dark:bg-emerald-600", 
      text: "text-white", 
      label: "Approve" 
    },
    reject: { 
      bg: "bg-rose-500 dark:bg-rose-600", 
      text: "text-white", 
      label: "Reject" 
    },
    maybe: { 
      bg: "bg-amber-400 dark:bg-amber-500", 
      text: "text-black dark:text-white", 
      label: "Maybe" 
    },
    pending: { 
      bg: "bg-slate-200 dark:bg-slate-800", 
      text: "text-black dark:text-white", 
      label: "Pending" 
    },
  };

  const variant = variants[d] || variants.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-0 text-[10px] font-bold uppercase tracking-wider w-fit transition-colors",
        variant.bg,
        variant.text,
        className
      )}
    >
      {variant.label}
    </span>
  );
};

export default HRDecisionBadge;

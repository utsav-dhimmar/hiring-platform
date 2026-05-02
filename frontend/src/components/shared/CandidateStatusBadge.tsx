import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

  icon?: React.ReactNode;
}

function CandidateStatusBadge({ status, className, label: customLabel, icon }: CandidateStatusBadgeProps) {
  if (!status) return null;

  const s = status.toLowerCase().trim();
  let statusClasses = "";
  let label = customLabel || status;

  // Success / Positive
  if (["pass", "approve", "active", "completed", "complete", "complet", "success"].includes(s)) {
    statusClasses = " bg-green-300 dark:bg-green-300";
  }
  // Destructive / Negative
  else if (["fail", "reject", "inactive", "error", "rejected"].includes(s)) {
    statusClasses = "bg-red-300 dark:bg-red-300";
  }
  // Neutral / Pending
  else {
    statusClasses = "bg-slate-300/10 text-black border-slate-300/20 dark:bg-slate-300/20 dark:text-black border-slate-300/30";
  }

  return (
    <>
      <Badge
        variant={s === "pass" ? "default" : "destructive"}
        className={cn(
          "rounded-full px-2 py-0.5 flex items-center gap-1 w-fit border shadow-none text-black uppercase font-extrabold text-[0.65rem] tracking-wider",
          statusClasses,
          className
        )}
      >
        {icon && <>{icon}</>}
        {label}
      </Badge>
    </>
  );
};

export default CandidateStatusBadge;

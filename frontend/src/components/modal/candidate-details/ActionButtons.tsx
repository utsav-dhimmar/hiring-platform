import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Props for {@link ActionButtons}.
 */
interface ActionButtonsProps {
  onAction: (type: "approve" | "reject" | "maybe") => void;
  showMaybeButton: boolean;
  className?: string;
}

/**
 * Footer action bar with Approve, Maybe, and Reject buttons for a screening decision.
 * The "Maybe" button is conditionally rendered based on the candidate's current state.
 */
export function ActionButtons({
  onAction,
  showMaybeButton,
  className,
}: ActionButtonsProps) {
  return (
    <div className={cn("sticky bottom-0 z-10 border-t border-muted-foreground/10 bg-card/95 p-4 backdrop-blur supports-backdrop-filter:bg-card/80 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4", className)}>
      <Button
        onClick={() => onAction("approve")}
        variant="outline"
        className="w-full rounded-xl px-8 shadow-md uppercase font-medium sm:w-auto text-black bg-green-300 dark:bg-green-300 hover:text-black hover:bg-green-400 hover:border"
      >
        Approve
      </Button>
      {showMaybeButton && (
        <Button
          variant="outline"
          onClick={() => onAction("maybe")}
          className="w-full rounded-xl px-8 shadow-sm uppercase font-medium sm:w-auto border-primary dark:border-primary"
        >
          Maybe
        </Button>
      )}
      <Button
        variant="outline"
        onClick={() => onAction("reject")}
        className="w-full rounded-xl px-8 shadow-md uppercase font-medium sm:w-auto text-black bg-red-300 dark:bg-red-300 hover:text-black hover:bg-red-400 hover:border"
      >
        Reject
      </Button>
    </div>
  );
}

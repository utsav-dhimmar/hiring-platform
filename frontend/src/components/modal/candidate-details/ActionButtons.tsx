import { Button } from "@/components/ui/button";

/**
 * Props for {@link ActionButtons}.
 */
interface ActionButtonsProps {
  onAction: (type: "approve" | "reject" | "maybe") => void;
  showMaybeButton: boolean;
}

/**
 * Footer action bar with Approve, Maybe, and Reject buttons for a screening decision.
 * The "Maybe" button is conditionally rendered based on the candidate's current state.
 */
export function ActionButtons({
  onAction,
  showMaybeButton,
}: ActionButtonsProps) {
  return (
    <div className="sticky bottom-0 z-10 border-t border-muted-foreground/10 bg-card/95 p-4 backdrop-blur supports-backdrop-filter:bg-card/80 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
      <Button
        onClick={() => onAction("approve")}
        variant="default"
        className="w-full rounded-xl px-8 shadow-md uppercase font-bold sm:w-auto"
      >
        Approved
      </Button>
      {showMaybeButton && (
        <Button
          variant="outline"
          onClick={() => onAction("maybe")}
          className="w-full rounded-xl px-8 shadow-sm uppercase font-bold sm:w-auto"
        >
          Maybe
        </Button>
      )}
      <Button
        variant="destructive"
        onClick={() => onAction("reject")}
        className="w-full rounded-xl px-8 shadow-md uppercase font-bold sm:w-auto"
      >
        Rejected
      </Button>
    </div>
  );
}

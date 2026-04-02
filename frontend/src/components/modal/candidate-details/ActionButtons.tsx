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
    <div className="p-4 border-t border-muted-foreground/10 flex flex-wrap gap-4 items-center justify-center bg-muted/10">
      <Button
        onClick={() => onAction("approve")}
        variant="default"
        className="rounded-xl px-8 shadow-md uppercase font-bold"
      >
        Approved
      </Button>
      {showMaybeButton && (
        <Button
          variant="outline"
          onClick={() => onAction("maybe")}
          className="rounded-xl px-8 shadow-sm uppercase font-bold"
        >
          Maybe
        </Button>
      )}
      <Button
        variant="destructive"
        onClick={() => onAction("reject")}
        className="rounded-xl px-8 shadow-md uppercase font-bold"
      >
        Rejected
      </Button>
    </div>
  );
}

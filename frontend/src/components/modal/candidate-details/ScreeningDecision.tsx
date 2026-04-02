import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import type { ResumeScreeningDecision } from "@/apis/resumeScreening";

/**
 * Props for {@link ScreeningDecision}.
 */
interface ScreeningDecisionProps {
  decision: ResumeScreeningDecision;
}

/**
 * Read-only card that shows the HR screening decision (approve / reject / maybe),
 * the optional note, and the decision date. Rendered inside the analysis tab
 * when a decision already exists.
 */
export function ScreeningDecision({ decision }: ScreeningDecisionProps) {
  return (
    <section className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          HR Screening Decision
        </h3>
        <Badge
          variant={
            decision.decision === "approve"
              ? "default"
              : decision.decision === "reject"
                ? "destructive"
                : "secondary"
          }
          className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase"
        >
          {decision.decision === "approve"
            ? "approved"
            : decision.decision === "reject"
              ? "rejected"
              : decision.decision}
        </Badge>
      </div>
      {decision.note ? (
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          &ldquo;{decision.note}&rdquo;
        </p>
      ) : (
        <p className="text-xs text-muted-foreground italic">No note provided.</p>
      )}
      <div className="text-[10px]  font-medium">
        Decided on {new Date(decision.created_at).toLocaleDateString()}
      </div>
    </section>
  );
}

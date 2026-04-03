import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { History, MessageSquare } from "lucide-react";
import type { HrDecisionHistoryItem } from "@/apis/resumeScreening";

interface DecisionHistoryProps {
  decisions: HrDecisionHistoryItem[];
}

function getDecisionBadgeVariant(decision: HrDecisionHistoryItem["decision"]) {
  if (decision === "proceed") return "default";
  if (decision === "reject") return "destructive";
  return "secondary";
}

export function DecisionHistory({ decisions }: DecisionHistoryProps) {
  // TODO: issue from backend api which return [] 
  if (decisions.length === 0) {
    return (
      <section className="p-4 rounded-2xl bg-muted/30 border border-muted-foreground/10 space-y-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <History className="h-4 w-4" />
          HR Decision History
        </h3>
        <p className="text-sm text-muted-foreground">No previous HR decisions found.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <History className="h-4 w-4" />
          HR Decision History
        </h3>
        <span className="text-xs font-medium text-muted-foreground">
          {decisions.length} record{decisions.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="space-y-2">
        {decisions.map((decision, index) => (
          <Card
            key={decision.id}
            className="rounded-2xl border-muted-foreground/10 bg-card/60 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  #{decisions.length - index}
                </span>
                <Badge
                  variant={getDecisionBadgeVariant(decision.decision)}
                  className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase"
                >
                  {decision.decision}
                </Badge>
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">
                {new Date(decision.decided_at).toLocaleString()}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              {decision.notes ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {decision.notes}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No note provided.</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

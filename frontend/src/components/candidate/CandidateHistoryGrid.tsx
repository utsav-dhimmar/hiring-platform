import { HrDecision } from "@/components/modal/candidate-details/HrDecision";
// import { Badge } from "@/components/ui/badge";
// import { DateDisplay } from "@/components/shared/DateDisplay";
import {
  History,
  //  FileText
} from "lucide-react";
import type { HrDecisionHistoryItem } from "@/apis/candidateDecision";
import type { Transcript } from "@/types/transcript";

interface CandidateHistoryGridProps {
  /** Array of HR decisions to display */
  hrDecisionHistory: HrDecisionHistoryItem[];
  /** Array of related transcripts to display */
  transcriptHistory: Transcript[];
  /** Callback when a transcript card is clicked */
  onTranscriptClick: (transcriptId: string) => void;
}

/**
 * A layout component that displays the candidate's decision history and 
 * interview transcripts side-by-side in a responsive grid.
 */
export function CandidateHistoryGrid({
  hrDecisionHistory,
  transcriptHistory,
  // onTranscriptClick,
}: CandidateHistoryGridProps) {
  if (hrDecisionHistory.length === 0 && transcriptHistory.length === 0) {
    return null;
  }

  return (
    // <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
    <div className="h-full">
      {/* HR Decision History Column */}
      {hrDecisionHistory.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <History className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Decision History
            </span>
          </div>
          <div className="space-y-4 h-full">
            {hrDecisionHistory.map((decision) => (
              <HrDecision key={decision.id} decision={decision} />
            ))}
          </div>
        </section>
      )}

      {/* Transcript History Column */}
      {/* {transcriptHistory.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Recent Transcripts
            </span>
          </div>
          <div className=" p-4 bg-muted/10 space-y-3 h-full">
            {transcriptHistory.map((t) => (
              <button
                key={t.id}
                onClick={() => onTranscriptClick(t.id)}
                className="w-full text-left p-4 rounded-2xl bg-background/50 hover:bg-background border border-border/40 hover:border-primary/20 transition-all duration-300 group shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase group-hover:text-primary transition-colors">
                    ID: {t.id.split("-")[0]}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[9px] h-4 px-1.5 font-black uppercase bg-primary/5 border-primary/10 text-primary/70"
                  >
                    <DateDisplay date={t.generated_at} />
                  </Badge>
                </div>
                <p className="text-[11px] font-medium text-foreground/80 line-clamp-2 leading-relaxed">
                  {t.transcript_text || "View dialogue turns and analysis..."}
                </p>
              </button>
            ))}
          </div>
        </section>
      )} */}
    </div>
  );
}

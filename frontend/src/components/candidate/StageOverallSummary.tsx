import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface OverallSummaryData {
  /** Numeric score for this stage (0-5) */
  stage_score: number;
  /** Recommendation label (e.g., "Strongly Recommend") */
  recommendation: string;
  /** Overall AI summary of candidate performance */
  overall_summary: string;
  /** Summary of candidate strengths */
  strength_summary: string;
  /** Summary of candidate weaknesses */
  weakness_summary: string;
  /** Suggested followup questions */
  followups: string[];
  /** Overall percentage score (0-100) */
  percentage: number;
}

interface StageOverallSummaryProps {
  /** Summary data to display */
  data: OverallSummaryData;
}

/**
 * Card displaying overall candidate evaluation summary.
 * Includes score, recommendation, strengths, weaknesses, and followup questions.
 */
export function StageOverallSummary({ data }: StageOverallSummaryProps) {
  return (
    <Card className="border-2 border-primary/10 rounded-3xl overflow-hidden shadow-xl">
      <div className="bg-primary/5 px-8 py-6 border-b border-primary/10 flex items-center justify-between">
        <h2 className="text-lg font-black tracking-tight text-primary uppercase">Overall Summary</h2>
        <Badge className="h-10 px-4 rounded-full text-lg font-black bg-primary">
          {data.percentage}% Overall
        </Badge>
      </div>
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Stage Score</span>
            <p className="text-lg font-black text-foreground">{data.stage_score}/5.0</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recommendation</span>
            <p className="text-lg font-black text-primary uppercase">{data.recommendation}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-black uppercase text-muted-foreground tracking-wide block mb-1">Summary</span>
            <p className="text-base font-medium leading-relaxed">{data.overall_summary}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="text-xs font-black uppercase text-green-600 tracking-wide block mb-1">Strengths</span>
              <p className="text-sm font-medium opacity-80">{data.strength_summary}</p>
            </div>
            <div>
              <span className="text-xs font-black uppercase text-red-600 tracking-wide block mb-1">Weaknesses</span>
              <p className="text-sm font-medium opacity-80">{data.weakness_summary}</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-primary/10">
          <span className="text-xs font-black uppercase text-muted-foreground tracking-wide block mb-3">Suggest Followups</span>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.followups.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-bold bg-muted/30 p-3 rounded-xl border border-primary/5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

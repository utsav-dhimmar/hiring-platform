import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import type { CandidateResponse } from "@/types/resume";
import type { CandidateAnalysis } from "@/types/admin";

/**
 * Props for {@link AnalysisStats}.
 */
interface AnalysisStatsProps {
  candidate: CandidateResponse | CandidateAnalysis;
}

/**
 * Compact stats bar showing the candidate's match percentage, pass/fail status
 * (pass threshold is a resume score >= 65), and the job version used for analysis.
 */
export function AnalysisStats({ candidate }: AnalysisStatsProps) {
  const analysis = candidate.resume_analysis;
  const isPassed =
    (candidate.pass_fail === true ||
      String(candidate.pass_fail).toLowerCase() === "pass") &&
    (candidate.resume_score ?? 0) >= 65;

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-xs font-bold uppercase sm:text-sm whitespace-nowrap">
          Match Percentage
        </span>
        <span className="text-sm font-black text-blue-600 leading-none sm:text-base">
          {analysis?.match_percentage || 0}%
        </span>
      </div>

      <div className="hidden h-4 w-px bg-muted-foreground/10 sm:block" />

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-xs font-bold uppercase sm:text-sm whitespace-nowrap">
          Pass / Fail
        </span>
        <Badge
          variant={isPassed ? "default" : "destructive"}
          className={`rounded-full px-3 py-1 flex items-center gap-2 w-fit border-0 shadow-none ${isPassed
              ? "bg-green-500/10 text-green-600"
              : "bg-red-500/10 text-red-600"
            }`}
        >
          {isPassed ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="font-extrabold text-[10px] tracking-wider">
                PASSED
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5" />
              <span className="font-extrabold text-[10px] tracking-wider">
                FAILED
              </span>
            </>
          )}
        </Badge>
      </div>

      <div className="hidden h-4 w-px bg-muted-foreground/10 sm:block" />

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-1">
        <span className="text-xs font-bold uppercase sm:text-sm whitespace-nowrap">
          Analysis Version
        </span>
        <span className="text-sm font-black text-purple-600 leading-none sm:text-base">
          V{(candidate as any)?.applied_version_number || "N/A"}
        </span>
      </div>
    </div>
  );
}

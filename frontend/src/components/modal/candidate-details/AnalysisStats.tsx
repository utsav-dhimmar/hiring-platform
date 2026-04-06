import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import type { CandidateResponse } from "@/types/resume";
import type { CandidateAnalysis } from "@/types/admin";

/**
 * Props for {@link AnalysisStats}.
 */
interface AnalysisStatsProps {
  candidate: CandidateResponse | CandidateAnalysis;
  onVersionClick?: () => void;
  activeTab?: string;
  passing_threshold?: number;
}

/**
 * Compact stats bar showing the candidate's match percentage, pass/fail status
 * and the job version used for analysis.
 */
export function AnalysisStats({
  candidate,
  onVersionClick,
  activeTab,
  passing_threshold = 65,
}: AnalysisStatsProps) {
  const analysis = candidate.resume_analysis;
  const isPassed =
    candidate.pass_fail === true ||
    String(candidate.pass_fail).toLowerCase() === "pass" ||
    (candidate.resume_score ?? 0) >= passing_threshold;
  const isVersionTab = activeTab === "version-result";

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
          Result
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

      <button
        type="button"
        onClick={onVersionClick}
        className={`flex flex-wrap items-center gap-1.5 rounded-lg py-1 px-2.5 transition-all outline-none sm:gap-2 active:scale-95 ${isVersionTab
          ? "bg-purple-600/15 ring-2 ring-purple-600/30"
          : "hover:bg-purple-600/5 hover:ring-1 hover:ring-purple-600/10"
          }`}
      >
        <span className="text-xs font-bold uppercase sm:text-sm whitespace-nowrap">
          Analysis Version
        </span>
        <span className="text-sm font-black text-purple-600 leading-none sm:text-base">
          V{(candidate as any)?.applied_version_number || "N/A"}
        </span>
      </button>
    </div>
  );
}

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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-[10px] font-bold uppercase text-muted-foreground sm:text-xs whitespace-nowrap">
          Match Percentage
        </span>
        <span className="text-sm font-black text-blue-600 leading-none sm:text-base">
          {analysis?.match_percentage || 0}%
        </span>
      </div>

      <div className="h-4 w-px bg-muted-foreground/20" />

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-[10px] font-bold uppercase text-muted-foreground sm:text-xs whitespace-nowrap">
          Result
        </span>
        <Badge
          variant={isPassed ? "default" : "destructive"}
          className={`rounded-full px-2.5 py-0.5 flex items-center gap-1.5 w-fit border-0 shadow-none ${isPassed
            ? "bg-green-500/10 text-green-600"
            : "bg-red-500/10 text-red-600"
            }`}
        >
          {isPassed ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              <span className="font-extrabold text-[9px] tracking-wider">
                PASSED
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              <span className="font-extrabold text-[9px] tracking-wider">
                FAILED
              </span>
            </>
          )}
        </Badge>
      </div>

      <div className="h-4 w-px bg-muted-foreground/20" />

      <button
        type="button"
        onClick={onVersionClick}
        className={`flex items-center gap-2 rounded-lg py-1 px-2 transition-all outline-none active:scale-95 ${isVersionTab
          ? "bg-purple-600/15 ring-2 ring-purple-600/30"
          : "hover:bg-purple-600/5 hover:ring-1 hover:ring-purple-600/10"
          }`}
      >
        <span className="text-[10px] font-bold uppercase text-muted-foreground sm:text-xs whitespace-nowrap">
          Analysis Version
        </span>
        <span className="text-sm font-black text-purple-600 leading-none sm:text-base">
          V{(candidate as any)?.applied_version_number || "N/A"}
        </span>
      </button>
    </div>
  );
}

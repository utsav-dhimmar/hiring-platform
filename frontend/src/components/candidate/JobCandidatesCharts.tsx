import { TrendingUp, CircleCheck, ShieldAlert, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { CandidatesDistributionChart, StagesBarChart, LocationBarChart } from "@/components/shared/BarChart";
import { ResultPieChart } from "@/components/shared/ResultPieChart";
import type { JobStatsResponse } from "@/types/admin";

interface JobCandidatesChartsProps {
  loading: boolean;
  isRefreshing: boolean;
  stats: {
    totalCandidates: number;
    approveCount: number;
    rejectCount: number;
    maybeCount: number;
    undecidedCount: number;
  };
  jobStats: JobStatsResponse | null;
}

export function JobCandidatesCharts({
  loading,
  isRefreshing,
  stats,
  jobStats,
}: JobCandidatesChartsProps) {
  const passCount = jobStats?.result?.passed || 0;
  const failCount = jobStats?.result?.failed || 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-700">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[400px] rounded-3xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col gap-16 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700",
      isRefreshing && "opacity-60 transition-opacity duration-300"
    )}>
      {/* Distribution Chart */}
      <div className="group overflow-hidden relative w-full">
        <div className="flex items-center gap-3 mb-8 border-b border-muted-foreground/10 pb-4">
          <div className="p-2.5 bg-blue-500/10 rounded-2xl group-hover:rotate-6 transition-transform text-blue-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-black text-xl text-foreground tracking-tight uppercase">Decision Distribution</h4>
          </div>
        </div>
        <div className="w-full h-[500px]">
          <CandidatesDistributionChart stats={stats} />
        </div>
      </div>

      {/* Result Pie Chart */}
      <div className="group overflow-hidden relative w-full">
        <div className="flex items-center gap-3 mb-8 border-b border-muted-foreground/10 pb-4">
          <div className="p-2.5 bg-emerald-500/10 rounded-2xl group-hover:rotate-6 transition-transform text-emerald-500">
            <CircleCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-black text-xl text-foreground tracking-tight uppercase">Screening Results</h4>
            <p className="text-sm text-muted-foreground font-medium">Distribution of passing vs failing candidates</p>
          </div>
        </div>
        <div className="w-full h-[500px]">
          <ResultPieChart passCount={passCount} failCount={failCount} />
        </div>
      </div>

      {/* Stages Bar Chart */}
      <div className="group overflow-hidden relative w-full">
        <div className="flex items-center gap-3 mb-8 border-b border-muted-foreground/10 pb-4">
          <div className="p-2.5 bg-amber-500/10 rounded-2xl group-hover:rotate-6 transition-transform text-amber-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-black text-xl text-foreground tracking-tight uppercase">Recruitment Stages</h4>
            <p className="text-sm text-muted-foreground font-medium">Candidate info stages wise</p>
          </div>
        </div>
        <div className="w-full h-[500px]">
          <StagesBarChart stages={jobStats?.stages || {}} />
        </div>
      </div>

      {/* Location Bar Chart */}
      <div className="group overflow-hidden relative w-full">
        <div className="flex items-center gap-3 mb-8 border-b border-muted-foreground/10 pb-4">
          <div className="p-2.5 bg-purple-500/10 rounded-2xl group-hover:rotate-6 transition-transform text-purple-500">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-black text-xl text-foreground tracking-tight uppercase">Locations</h4>
            <p className="text-sm text-muted-foreground font-medium">Candidates Location wise</p>
          </div>
        </div>
        <div className="w-full h-[500px]">
          <LocationBarChart locations={jobStats?.location || {}} />
        </div>
      </div>
    </div>
  );
}

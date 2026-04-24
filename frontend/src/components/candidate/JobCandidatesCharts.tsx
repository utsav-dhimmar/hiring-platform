import { cn } from "@/lib/utils";
import { CandidatesDistributionChart, StagesBarChart, LocationBarChart } from "@/components/shared/BarChart";
import { ProgressBarChart } from "@/components/shared/Progressbar";
import { ResultPieChart } from "@/components/shared/ResultPieChart";
import type { JobStatsResponse } from "@/types/admin";
import { CHART_TEXTS } from "@/constants";

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
  const passCount = jobStats?.result?.passed ?? 0;
  const failCount = jobStats?.result?.failed ?? 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-700">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-[400px] rounded-3xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }
  const obj: { title: string; description: string; chart: React.JSX.Element, takeFullSpace?: boolean }[] = [{
    title: CHART_TEXTS.priorityTimeline.label,
    description: CHART_TEXTS.priorityTimeline.description,
    chart: <ProgressBarChart priorityTimeline={jobStats?.priority_timeline || null} />,
    takeFullSpace: true
  },
  {
    title: CHART_TEXTS.hrDecision.label,
    description: CHART_TEXTS.hrDecision.description,
    chart: <CandidatesDistributionChart stats={stats} />
  },
  {
    title: CHART_TEXTS.screeningResults.label,
    description: CHART_TEXTS.screeningResults.description,
    chart: <ResultPieChart passCount={passCount} failCount={failCount} />
  },
  {
    title: CHART_TEXTS.recruitmentStages.label,
    description: CHART_TEXTS.recruitmentStages.description,
    chart: <StagesBarChart stages={jobStats?.stages || {}} />,
    takeFullSpace: true
  },
  {
    title: CHART_TEXTS.locations.label,
    description: CHART_TEXTS.locations.description,
    chart: <LocationBarChart locations={jobStats?.location || {}} />,
    takeFullSpace: true
  },

  ];
  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 p-0.5",
      isRefreshing && "opacity-60 transition-opacity duration-300"
    )}>
      {
        obj.map(({ chart, title, description, takeFullSpace }) => (
          <div className={cn("group overflow-hidden relative w-full", takeFullSpace && "md:col-span-2")} key={title}>
            <div className="flex items-center gap-3 mb-2 border-b border-muted-foreground/10 pb-4">
              <div>
                <h4 className="font-black text-xl text-foreground tracking-tight uppercase">{title}</h4>
                <p className="text-sm text-muted-foreground font-medium">{description}</p>
              </div>
            </div>
            <div className="w-full h-[300px]">
              {chart}
            </div>
          </div>
        ))
      }
    </div>
  );
}

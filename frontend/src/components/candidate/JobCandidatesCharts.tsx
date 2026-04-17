import { useState } from "react";
import { LayoutGrid, TrendingUp, CircleCheck, ShieldAlert, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { JobCandidatesStats } from "./JobCandidatesStats";
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
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "result" | "stages" | "location">("overview");

  const passCount = jobStats?.result?.passed || 0;
  const failCount = jobStats?.result?.failed || 0;

  const style = {
    common: "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-500",
    active: "bg-background text-primary shadow-lg scale-100",
    inactive: "text-muted-foreground hover:text-foreground scale-95",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        {/* Pill Toggle Switcher */}
        <div className="flex bg-muted/50 p-1 rounded-full border border-muted-foreground/10 shadow-inner flex-wrap">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(style.common, activeTab === "overview" ? style.active : style.inactive)}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={cn(style.common, activeTab === "analytics" ? style.active : style.inactive)}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("result")}
            className={cn(style.common, activeTab === "result" ? style.active : style.inactive)}
          >
            <CircleCheck className="h-3.5 w-3.5" />
            Result
          </button>
          <button
            onClick={() => setActiveTab("stages")}
            className={cn(style.common, activeTab === "stages" ? style.active : style.inactive)}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Stages
          </button>
          <button
            onClick={() => setActiveTab("location")}
            className={cn(style.common, activeTab === "location" ? style.active : style.inactive)}
          >
            <MapPin className="h-3.5 w-3.5" />
            Location
          </button>
        </div>
      </div>

      <div className="relative min-h-[160px]">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 rounded-3xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className={cn(
            "animate-in fade-in slide-in-from-bottom-2 duration-700",
            isRefreshing && "opacity-60 transition-opacity duration-300"
          )}>
            {activeTab === "overview" ? (
              <JobCandidatesStats
                totalCandidates={stats.totalCandidates}
                approveCount={stats.approveCount}
                rejectCount={stats.rejectCount}
                maybeCount={stats.maybeCount}
                undecidedCount={stats.undecidedCount}
              />
            ) : activeTab === "analytics" ? (
              <div className="flex flex-col md:flex-row gap-8 items-center ">
                <div className="w-full h-[300px]">
                  <CandidatesDistributionChart stats={stats} />
                </div>
              </div>
            ) : activeTab === "result" ? (
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                <div className="w-full max-w-md h-[300px]">
                  <ResultPieChart
                    passCount={passCount}
                    failCount={failCount}
                  />
                </div>
              </div>
            ) : activeTab === "stages" ? (
              <div className="flex flex-col md:flex-row gap-8 items-center ">
                <div className="w-full h-[300px]">
                  <StagesBarChart stages={jobStats?.stages || {}} />
                </div>
              </div>
            ) : activeTab === "location" ? (
              <div className="flex flex-col md:flex-row gap-8 items-center ">
                <div className="w-full h-[300px]">
                  <LocationBarChart locations={jobStats?.location || {}} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

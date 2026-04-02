import { adminAnalyticsService } from "@/apis/admin/service";
import type { AnalyticsSummary, HiringReport } from "@/types/admin";
import { useAdminData } from "@/hooks/useAdminData";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";
import { StatCard, DataTable } from "@/components/shared";
import {
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";

export default function AdminStats() {
  const {
    data: dashboardData,
    loading,
    error,
    fetchData,
  } = useAdminData<{ analytics: AnalyticsSummary; report: HiringReport }>(
    async () => {
      try {
        const [analytics, report] = await Promise.all([
          adminAnalyticsService.getAnalytics(),
          adminAnalyticsService.getHiringReport(),
        ]);
        return [{ analytics, report }];
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
        throw err;
      }
    },
    { initialData: [] },
  );

  const analytics = dashboardData[0]?.analytics;
  const report = dashboardData[0]?.report;

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "job_title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Job Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.getValue("job_title")}</span>,
    },
    {
      accessorKey: "candidate_count",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-center w-full"
        >
          Candidates
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center font-bold">{row.getValue("candidate_count")}</div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 pt-0 pb-8">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Platform Statistics</h1>
        <DashboardBreadcrumbs />
      </div>

      {loading && dashboardData.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 border rounded-3xl bg-destructive/5">
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={fetchData} variant="outline" className="rounded-xl">
            Retry Loading Stats
          </Button>
        </div>
      ) : (
        <>
          {/* Main Analytics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3 m-1">
            <StatCard
              label="Total Users"
              value={analytics?.total_users ?? 0}

              className="bg-primary/5 border border-primary/10"
            />
            <StatCard
              label="Active Users"
              value={analytics?.active_users ?? 0}

              className="bg-green-500/5 border border-green-500/10"
            />
            <StatCard
              label="Total Jobs"
              value={analytics?.total_jobs ?? 0}

              className="bg-blue-500/5 border border-blue-500/10"
            />
            <StatCard
              label="Active Jobs"
              value={analytics?.active_jobs ?? 0}

              className="bg-indigo-500/5 border border-indigo-500/10"
            />
            <StatCard
              label="Total Candidates"
              value={analytics?.total_candidates ?? 0}

              className="bg-orange-500/5 border border-orange-500/10"
            />
            <StatCard
              label="Total Resumes"
              value={analytics?.total_resumes ?? 0}

              className="bg-purple-500/5 border border-purple-500/10"
            />
            <StatCard
              label="Resumes (Last 30d)"
              value={report?.resumes_uploaded_last_30_days ?? 0}

              className="bg-pink-500/5 border border-pink-500/10"
            />
            <StatCard
              label="Pass Rate"
              value={report?.pass_rate ? `${report.pass_rate.toFixed(1)}%` : "0%"}

              className="bg-yellow-500/5 border border-yellow-500/10"
            />
            <StatCard
              label="LLM Parsed"
              value={report?.llm_parsed_count ?? 0}
              className="bg-emerald-500/5 border border-emerald-500/10"
            />
            <StatCard
              label="HR Decided"
              value={report?.hr_decided_count ?? 0}
              className="bg-cyan-500/5 border border-cyan-500/10"
            />
            <StatCard
              label="No Action"
              value={report?.pending_count ?? 0}
              className="bg-amber-500/5 border border-amber-500/10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
            {/* Candidates by Job Table */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Candidates by Job</h2>
              </div>
              <div className="border rounded-2xl p-0 overflow-hidden bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-border/50">
                <DataTable
                  columns={columns}
                  data={report?.candidates_by_job || []}
                  searchKey="job_title"
                  searchPlaceholder="Search jobs..."
                />
              </div>
            </div>

            {/* Additional Reports */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold tracking-tight">Performance Summary</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="border rounded-2xl p-6 bg-linear-to-br from-primary/10 to-transparent border-primary/20 space-y-2">
                  <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Average Resume Score
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary">
                      {report?.average_resume_score
                        ? report.average_resume_score.toFixed(1)
                        : "0.0"}
                    </span>
                    <span className="text-lg font-semibold text-primary/60">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Overall average match score calculated across all analyzed resumes.
                  </p>
                </div>

                <div className="border rounded-2xl p-6 bg-card/50 border-border/50 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Job Ratio</span>
                      <span className="font-bold">
                        {analytics?.total_jobs
                          ? Math.round((analytics.active_jobs / analytics.total_jobs) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${analytics?.total_jobs ? (analytics.active_jobs / analytics.total_jobs) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active User Ratio</span>
                      <span className="font-bold">
                        {analytics?.total_users
                          ? Math.round((analytics.active_users / analytics.total_users) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${analytics?.total_users ? (analytics.active_users / analytics.total_users) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

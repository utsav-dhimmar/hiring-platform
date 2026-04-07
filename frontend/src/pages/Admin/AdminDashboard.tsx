/**
 * Main admin dashboard page.
 * Displays analytics summary and hiring reports for administrators.
 */

// import { useMemo } from "react";
// import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { adminAnalyticsService } from "@/apis/admin/service";
import type { AnalyticsSummary, HiringReport } from "@/types/admin";
import { AdminDataTable, AppPageShell, PageHeader, StatCard, type Column } from "@/components/shared";
import { useAdminData } from "@/hooks";
// import type { ChartConfig } from "@/components/ui/chart";
// import {
//   ChartContainer,
//   ChartTooltip,
//   ChartTooltipContent,
// } from "@/components/ui/chart";

const AdminDashboard = () => {
  const {
    data: dashboardData,
    loading,
    error,
    fetchData,
  } = useAdminData<{ analytics: AnalyticsSummary; report: HiringReport }>(
    async () => {
      const [analytics, report] = await Promise.all([
        adminAnalyticsService.getAnalytics(),
        adminAnalyticsService.getHiringReport(),
      ]);
      return [{ analytics, report }];
    },
    { initialData: [] },
  );

  const analytics = dashboardData[0]?.analytics;
  const report = dashboardData[0]?.report;

  // const chartData = useMemo(() => [
  //   { label: "Resumes", count: report?.resumes_uploaded_last_30_days ?? 0 },
  //   { label: "Passed", count: report?.total_passed ?? 0 },
  //   { label: "Pending", count: report?.total_pending ?? 0 },
  //   // { label: "Unprocessed", count: report?.total_unprocessed ?? 0 },
  //   { label: "HR Decided", count: report?.hr_decided_count ?? 0 },
  //   { label: "No Action", count: report?.pending_count ?? 0 },
  // ], [report]);

  // const chartConfig = {
  //   count: {
  //     label: "Candidates",
  //     color: "#3b82f6",
  //   },
  // } satisfies ChartConfig;

  const jobColumns: Column<any>[] = [
    { header: "Job Title", accessor: "job_title" },
    { header: "Department", accessor: "department" },
    { header: "Candidate Count", accessor: "candidate_count" },
  ];

  return (
    <AppPageShell width="wide">
      <PageHeader title="Panel Dashboard" />

      <div className="mb-6 space-y-4">
        <h2 className="text-xl font-semibold">Analytics Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          <StatCard label="Total Users" value={analytics?.total_users ?? 0} loading={loading} />
          <StatCard label="Active Users" value={analytics?.active_users ?? 0} loading={loading} />
          <StatCard label="Total Roles" value={analytics?.total_roles ?? 0} loading={loading} />
          <StatCard label="Total Jobs" value={analytics?.total_jobs ?? 0} loading={loading} />
          <StatCard label="Active Jobs" value={analytics?.active_jobs ?? 0} loading={loading} />
          <StatCard label="Total Candidates" value={analytics?.total_candidates ?? 0} loading={loading} />
          <StatCard label="Total Resumes" value={analytics?.total_resumes ?? 0} loading={loading} />
        </div>
      </div>

      <div className="space-y-5">
        <h2 className="text-xl font-semibold mb-4">Hiring Report Summary</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          <StatCard
            label="Resumes (Last 30 Days)"
            value={report?.resumes_uploaded_last_30_days ?? 0}
            loading={loading}
          />
          <StatCard
            label="Passed"
            value={report?.total_passed ?? 0}
            loading={loading}
          />
          {/* <StatCard
            label="Failed"
            value={report?.total_failed ?? 0}
            loading={loading}
          /> */}
          <StatCard
            label="Pending"
            value={report?.total_pending ?? 0}
            loading={loading}
          />
          <StatCard
            label="Unprocessed"
            value={report?.total_unprocessed ?? 0}
            loading={loading}
          />
          <StatCard
            label="HR Decided"
            value={report?.hr_decided_count ?? 0}
            loading={loading}
          />
          <StatCard
            label="No Action (HR)"
            value={report?.pending_count ?? 0}
            loading={loading}
          />
        </div>

        {/* <div className="app-surface-card p-5">
          <h3 className="text-lg font-medium mb-6">Hiring Report Analytics</h3>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} strokeOpacity={0.1} />
              <XAxis
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                axisLine={false}

              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}

              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
                barSize={45}
              />
            </BarChart>
          </ChartContainer>
        </div> */}

        <div className="app-surface-card p-4 sm:p-5">
          <h3 className="mb-3">Candidates by Job</h3>
          <AdminDataTable
            columns={jobColumns}
            data={report?.candidates_by_job || []}
            loading={loading}
            error={error}
            onRetry={fetchData}
            rowKey="job_id"
            emptyMessage="No job data available."
            className="border-0 shadow-none"
          />
        </div>
      </div>
    </AppPageShell>
  );
};

export default AdminDashboard;

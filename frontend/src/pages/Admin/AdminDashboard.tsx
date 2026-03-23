/**
 * Main admin dashboard page.
 * Displays analytics summary and hiring reports for administrators.
 */

import { adminAnalyticsService } from "../../apis/admin/service";
import type { AnalyticsSummary, HiringReport } from "../../apis/admin/types";
import { AdminDataTable, PageHeader, StatCard, type Column } from "../../components/common";
import "../../css/adminDashboard.css";
import { useAdminData } from "../../hooks";

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

  const jobColumns: Column<any>[] = [
    { header: "Job Title", accessor: "job_title" },
    { header: "Candidate Count", accessor: "candidate_count" },
  ];

  return (
    <div className="admin-dashboard">
      <PageHeader title="Admin Dashboard" />

      <div className="analytics-grid">
        <StatCard label="Total Users" value={analytics?.total_users ?? 0} />
        <StatCard label="Active Users" value={analytics?.active_users ?? 0} />
        <StatCard label="Total Jobs" value={analytics?.total_jobs ?? 0} />
        <StatCard label="Active Jobs" value={analytics?.active_jobs ?? 0} />
        <StatCard label="Total Candidates" value={analytics?.total_candidates ?? 0} />
        <StatCard label="Total Resumes" value={analytics?.total_resumes ?? 0} />
      </div>

      <div className="report-section mt-5">
        <h2 className="mb-4">Hiring Report Summary</h2>
        <div className="report-grid mb-4">
          <StatCard
            label="Resumes (Last 30 Days)"
            value={report?.resumes_uploaded_last_30_days ?? 0}
          />
          <StatCard label="Avg Resume Score" value={report?.average_resume_score ? report?.average_resume_score.toFixed(2) + "%" : "N/A"} />
          <StatCard label="Pass Rate" value={report?.pass_rate ? report.pass_rate.toFixed(2) + "%" : "N/A"} />
        </div>

        <div className="jobs-table-container">
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
    </div>
  );
};

export default AdminDashboard;

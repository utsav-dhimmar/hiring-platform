/**
 * Main admin dashboard page.
 * Displays analytics summary and hiring reports for administrators.
 */

import { useEffect, useState } from "react";
import { adminAnalyticsService } from "../../apis/admin/service";
import type { AnalyticsSummary, HiringReport } from "../../apis/admin/types";
import { Card, CardBody, CardHeader } from "../../components/common";
import "../../css/adminDashboard.css";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [report, setReport] = useState<HiringReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsData, reportData] = await Promise.all([
          adminAnalyticsService.getAnalytics(),
          adminAnalyticsService.getHiringReport(),
        ]);
        setAnalytics(analyticsData);
        setReport(reportData);
      } catch (err) {
        console.error("Failed to fetch admin data:", err);
        setError(
          "Failed to load dashboard data. Please make sure you have admin privileges.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="admin-loading">Loading dashboard...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="analytics-grid">
        <Card className="analytics-card">
          <CardHeader>Total Users</CardHeader>
          <CardBody>
            <p className="analytics-value">{analytics?.total_users}</p>
          </CardBody>
        </Card>
        <Card className="analytics-card">
          <CardHeader>Active Users</CardHeader>
          <CardBody>
            <p className="analytics-value">{analytics?.active_users}</p>
          </CardBody>
        </Card>
        <Card className="analytics-card">
          <CardHeader>Total Jobs</CardHeader>
          <CardBody>
            <p className="analytics-value">{analytics?.total_jobs}</p>
          </CardBody>
        </Card>
        <Card className="analytics-card">
          <CardHeader>Active Jobs</CardHeader>
          <CardBody>
            <p className="analytics-value">{analytics?.active_jobs}</p>
          </CardBody>
        </Card>
        <Card className="analytics-card">
          <CardHeader>Total Candidates</CardHeader>
          <CardBody>
            <p className="analytics-value">{analytics?.total_candidates}</p>
          </CardBody>
        </Card>
        <Card className="analytics-card">
          <CardHeader>Total Resumes</CardHeader>
          <CardBody>
            <p className="analytics-value">{analytics?.total_resumes}</p>
          </CardBody>
        </Card>
      </div>

      <div className="report-section">
        <h2>Hiring Report Summary</h2>
        <div className="report-grid">
          <Card>
            <CardHeader>Resumes (Last 30 Days)</CardHeader>
            <CardBody>
              <p className="report-value">
                {report?.resumes_uploaded_last_30_days}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Avg Resume Score</CardHeader>
            <CardBody>
              <p className="report-value">
                {report?.average_resume_score?.toFixed(2) || "N/A"}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>Pass Rate</CardHeader>
            <CardBody>
              <p className="report-value">
                {(report?.pass_rate &&
                  (report.pass_rate * 100).toFixed(1) + "%") ||
                  "N/A"}
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="jobs-table-container">
          <h3>Candidates by Job</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Candidate Count</th>
              </tr>
            </thead>
            <tbody>
              {report?.candidates_by_job.map((job) => (
                <tr key={job.job_id}>
                  <td>{job.job_title}</td>
                  <td>{job.candidate_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

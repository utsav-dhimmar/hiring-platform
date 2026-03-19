/**
 * Admin page for viewing recent file uploads.
 * Displays a list of recently uploaded resumes and documents.
 */

import { useEffect, useState } from "react";
import { adminAnalyticsService } from "../../apis/admin/service";
import type { RecentUploadRead } from "../../apis/admin/types";
import { Card, CardBody, DateDisplay } from "../../components/common";
import "../../css/adminDashboard.css";

const AdminRecentUploads = () => {
  const [uploads, setUploads] = useState<RecentUploadRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        setLoading(true);
        const data = await adminAnalyticsService.getRecentUploads();
        setUploads(data);
      } catch (err) {
        console.error("Failed to fetch recent uploads:", err);
        setError("Failed to load recent uploads.");
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, []);

  if (loading) return <div className="admin-loading">Loading uploads...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Recent Uploads</h1>
      <Card>
        <CardBody>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Size (KB)</th>
                  <th>Uploaded By</th>
                  <th>Candidate ID</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr key={upload.id}>
                    <td>
                      <strong>{upload.file_name || "N/A"}</strong>
                    </td>
                    <td>{upload.file_type || "N/A"}</td>
                    <td>
                      {upload.size ? (upload.size / 1024).toFixed(1) : "N/A"}
                    </td>
                    <td>
                      <small>{upload.uploaded_by}</small>
                    </td>
                    <td>
                      <small>{upload.candidate_id || "N/A"}</small>
                    </td>
                    <td>
                      <DateDisplay date={upload.created_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminRecentUploads;

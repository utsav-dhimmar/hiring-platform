/**
 * Admin page for viewing audit logs.
 * Displays a history of user actions and system events.
 */

import { useEffect, useState } from "react";
import { adminAnalyticsService } from "../../apis/admin/service";
import type { AuditLogRead } from "../../apis/admin/types";
import { Card, CardBody, DateDisplay } from "../../components/common";
import "./AdminDashboard.css";

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLogRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await adminAnalyticsService.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch audit logs:", err);
        setError("Failed to load audit logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading)
    return <div className="admin-loading">Loading audit logs...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h1>Audit Logs</h1>
      <Card>
        <CardBody>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User ID</th>
                  <th>Target Type</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <DateDisplay date={log.created_at} />
                    </td>
                    <td>
                      <strong>{log.action}</strong>
                    </td>
                    <td>
                      <small>{log.user_id}</small>
                    </td>
                    <td>{log.target_type || "N/A"}</td>
                    <td>
                      <pre style={{ fontSize: "0.75rem", margin: 0 }}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
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

export default AdminAuditLogs;

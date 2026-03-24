/**
 * Admin page for viewing audit logs.
 * Displays a history of user actions and system events.
 */

import { adminAnalyticsService } from "@/apis/admin/service";
import type { AuditLogRead } from "@/types/admin";
import { AdminDataTable, DateDisplay, PageHeader, type Column } from "@/components/shared";
import "@/css/adminDashboard.css";
import { useAdminData } from "@/hooks";

const AdminAuditLogs = () => {
  const {
    data: logs,
    loading,
    error,
    fetchData,
  } = useAdminData<AuditLogRead>(() => adminAnalyticsService.getAuditLogs());

  const columns: Column<AuditLogRead>[] = [
    {
      header: "Timestamp",
      accessor: (log) => <DateDisplay date={log.created_at} />,
    },
    {
      header: "Action",
      accessor: (log) => <strong>{log.action}</strong>,
    },
    {
      header: "User ID",
      accessor: (log) => <small>{log.user_id}</small>,
    },
    { header: "Target Type", accessor: (log) => log.target_type || "N/A" },
    {
      header: "Details",
      accessor: (log) => (
        <pre style={{ fontSize: "0.75rem", margin: 0 }}>{JSON.stringify(log.details, null, 2)}</pre>
      ),
    },
  ];

  return (
    <div className="admin-dashboard">
      <PageHeader title="Audit Logs" />

      <AdminDataTable
        columns={columns}
        data={logs}
        loading={loading}
        error={error}
        onRetry={fetchData}
        rowKey="id"
        emptyMessage="No audit logs found."
      />
    </div>
  );
};

export default AdminAuditLogs;

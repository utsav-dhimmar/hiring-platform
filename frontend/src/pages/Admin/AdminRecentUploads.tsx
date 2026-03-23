/**
 * Admin page for viewing recent file uploads.
 * Displays a list of recently uploaded resumes and documents.
 */

import { adminAnalyticsService } from "@/apis/admin/service";
import type { RecentUploadRead } from "@/types/admin";
import { AdminDataTable, DateDisplay, PageHeader, type Column } from "@/components/shared";
import "@/css/adminDashboard.css";
import { useAdminData } from "@/hooks";

const AdminRecentUploads = () => {
  const {
    data: uploads,
    loading,
    error,
    fetchData,
  } = useAdminData<RecentUploadRead>(() => adminAnalyticsService.getRecentUploads());

  const columns: Column<RecentUploadRead>[] = [
    {
      header: "File Name",
      accessor: (upload) => <strong>{upload.file_name || "N/A"}</strong>,
    },
    { header: "Type", accessor: (upload) => upload.file_type || "N/A" },
    {
      header: "Size (KB)",
      accessor: (upload) => (upload.size ? (upload.size / 1024).toFixed(1) : "N/A"),
    },
    {
      header: "Uploaded By",
      accessor: (upload) => <small>{upload.uploaded_by}</small>,
    },
    {
      header: "Candidate ID",
      accessor: (upload) => <small>{upload.candidate_id || "N/A"}</small>,
    },
    {
      header: "Date",
      accessor: (upload) => <DateDisplay date={upload.created_at} />,
    },
  ];

  return (
    <div className="admin-dashboard">
      <PageHeader title="Recent Uploads" />

      <AdminDataTable
        columns={columns}
        data={uploads}
        loading={loading}
        error={error}
        onRetry={fetchData}
        rowKey="id"
        emptyMessage="No recent uploads found."
      />
    </div>
  );
};

export default AdminRecentUploads;

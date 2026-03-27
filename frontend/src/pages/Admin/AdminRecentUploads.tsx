/**
 * Admin page for viewing recent file uploads.
 * Displays a list of recently uploaded resumes and documents.
 */

import { useState } from "react";
import { adminAnalyticsService } from "@/apis/admin/service";
import type { RecentUploadRead } from "@/types/admin";
import { DataTable, DateDisplay, PageHeader, ErrorDisplay } from "@/components/shared";
import { useAdminData } from "@/hooks";
import { ArrowUpDown } from "lucide-react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

const AdminRecentUploads = () => {
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    data: uploads,
    error,
    fetchData,
  } = useAdminData<RecentUploadRead>(() => adminAnalyticsService.getRecentUploads(0, 100));

  const columns: ColumnDef<RecentUploadRead>[] = [
    {
      accessorKey: "file_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          File Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium text-foreground">{row.original.file_name || "N/A"}</span>
      ),
    },
    {
      accessorKey: "file_type",
      header: "Type",
      cell: ({ row }) => (
        <span className="uppercase text-xs font-bold text-muted-foreground">
          {row.original.file_type || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) =>
        row.original.size ? `${(row.original.size / 1024).toFixed(1)} KB` : "N/A",
    },
    {
      accessorKey: "uploaded_by",
      header: "Uploaded By",
      cell: ({ row }) => (
        <span
          className="font-mono text-[10px] text-muted-foreground break-all max-w-[120px] block"
          title={row.original.uploaded_by}
        >
          {row.original.uploaded_by}
        </span>
      ),
    },
    {
      accessorKey: "candidate_id",
      header: "Candidate ID",
      cell: ({ row }) => (
        <span
          className="font-mono text-[10px] text-muted-foreground break-all max-w-[120px] block"
          title={row.original.candidate_id || "N/A"}
        >
          {row.original.candidate_id || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <DateDisplay date={row.original.created_at} />,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Recent Uploads" />

      {error && !uploads.length ? (
        <ErrorDisplay message={error} onRetry={fetchData} />
      ) : (
        <DataTable
          columns={columns}
          data={uploads}
          searchKey="file_name"
          searchPlaceholder="Filter files by name..."
          initialSorting={[{ id: "created_at", desc: true }]}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={setPagination}
        />
      )}
    </div>
  );
};

// Internal Button component for column headers to avoid circular dependency or missing import
import { Button } from "@/components/ui/button";

export default AdminRecentUploads;

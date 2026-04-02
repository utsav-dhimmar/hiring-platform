/**
 * Admin page for viewing audit logs.
 * Displays a history of user actions and system events.
 */
import { useState } from "react";
import { adminAnalyticsService } from "@/apis/admin/service";
import type { AuditLogRead } from "@/types/admin";
import { AppPageShell, DataTable, DateDisplay, PageHeader, ErrorDisplay } from "@/components/shared";
import { useAdminData } from "@/hooks";
import { ArrowUpDown } from "lucide-react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";

const AdminAuditLogs = () => {
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    data: logs,
    error,
    fetchData,
  } = useAdminData<AuditLogRead>(() => adminAnalyticsService.getAuditLogs(0, 100));

  const columns: ColumnDef<AuditLogRead>[] = [
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Timestamp
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <DateDisplay date={row.original.created_at} />,
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => <span className="font-bold text-primary">{row.original.action}</span>,
    },
    {
      accessorKey: "user_id",
      header: "User ID",
      cell: ({ row }) => (
        <span
          className="font-mono text-[10px] text-muted-foreground break-all max-w-[120px] block"
          title={row.original.user_id}
        >
          {row.original.user_id}
        </span>
      ),
    },
    {
      accessorKey: "target_type",
      header: "Target Type",
      cell: ({ row }) => (
        <span className="capitalize text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
          {row.original.target_type || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => (
        <div className="max-w-[300px] overflow-hidden">
          <pre className="text-[10px] bg-muted/50 p-2 rounded-lg border overflow-x-auto whitespace-pre-wrap max-h-[100px]">
            {JSON.stringify(row.original.details, null, 2)}
          </pre>
        </div>
      ),
    },
  ];

  return (
    <AppPageShell width="wide">
      <PageHeader title="Audit Logs" mobileMenuTrigger />

      {error && !logs.length ? (
        <ErrorDisplay message={error} onRetry={fetchData} />
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          searchKey="action"
          searchPlaceholder="Filter by action..."
          initialSorting={[{ id: "created_at", desc: true }]}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={setPagination}
        />
      )}
    </AppPageShell>
  );
};

// Internal Button component for column headers to avoid circular dependency or missing import
import { Button } from "@/components/ui/button";

export default AdminAuditLogs;

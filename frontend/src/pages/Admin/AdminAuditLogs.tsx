/**
 * Admin page for viewing audit logs.
 * Displays a history of user actions and system events.
 */
import { useState, useEffect } from "react";
import { adminAnalyticsService } from "@/apis/admin/service";
import type { AuditLogRead } from "@/types/admin";
import { AppPageShell, DataTable, DateDisplay, PageHeader, ErrorDisplay } from "@/components/shared";
import { useAdminData } from "@/hooks";
import { ArrowUpDown } from "lucide-react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { toTitleCase } from "@/lib/utils";

const AdminAuditLogs = () => {
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchValue, setSearchValue] = useState("");

  const {
    data: logs,
    total,
    loading,
    error,
    fetchData,
  } = useAdminData<AuditLogRead>(
    () => adminAnalyticsService.getAuditLogs(pageIndex * pageSize, pageSize, searchValue)
  );

  // Refetch data when pagination or search changes
  useEffect(() => {
    fetchData();
  }, [pageIndex, pageSize, searchValue, fetchData]);

  // Handle search with pagination reset
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const columns: ColumnDef<AuditLogRead>[] = [
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
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = toTitleCase(row.original.action);
        return <span className="font-bold text-primary">{action}</span>
      },
    },
    {
      accessorKey: "user_name",
      header: "User Name",
      cell: ({ row }) => (
        <span
          className="font-medium text-foreground"
          title={row.original.user_name}
        >
          {row.original.user_name}
        </span>
      ),
    },
    /*
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
    */
  ];

  return (
    <AppPageShell width="wide">
      <PageHeader title="Audit Logs" />

      {error && !logs.length ? (
        <ErrorDisplay message={error} onRetry={fetchData} />
      ) : (
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          searchKey="action"
          searchPlaceholder="Filter by action..."
          initialSorting={[{ id: "created_at", desc: true }]}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={setPagination}
          onSearchChange={handleSearchChange}
          searchValue={searchValue}
          isServerSide={true}
          pageCount={Math.ceil(total / pageSize)}
          totalRecords={total}
        />

      )}
    </AppPageShell>
  );
};



export default AdminAuditLogs;

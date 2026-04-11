/**
 * Admin page for viewing recent file uploads.
 * Displays a list of recently uploaded resumes and documents.
 */

import { useState, useEffect } from "react";
import { adminAnalyticsService } from "@/apis/admin/service";
import type { RecentUploadRead } from "@/types/admin";
import AppPageShell from "@/components/shared/AppPageShell";
import { DataTable } from "@/components/shared/DataTable";
import { DateDisplay } from "@/components/shared/DateDisplay";
import PageHeader from "@/components/shared/PageHeader";
import ErrorDisplay from "@/components/shared/ErrorDisplay";
import { useAdminData } from "@/hooks";
import { ArrowUpDown } from "lucide-react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatFileSize } from "@/utils/converters";


export type FileSizeUnit = "auto" | "B" | "KB" | "MB";

const AdminRecentUploads = () => {
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchValue, setSearchValue] = useState("");

  const {
    data: uploads,
    total,
    loading,
    error,
    fetchData,
  } = useAdminData<RecentUploadRead>(
    () => adminAnalyticsService.getRecentUploads(pageIndex * pageSize, pageSize, searchValue),
    { fetchOnMount: false },

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

  const [fileSizeUnit, setFileSizeUnit] = useState<FileSizeUnit>("auto");

  const columns: ColumnDef<RecentUploadRead>[] = [
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
        row.original.size ? formatFileSize(row.original.size, fileSizeUnit) : "N/A",
    },
    {
      accessorKey: "uploader_name",
      header: "Uploaded By",
      cell: ({ row }) => (
        <span
          className="font-medium text-foreground"
          title={row.original.uploader_name || "N/A"}
        >
          {row.original.uploader_name || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "candidate_name",
      header: "Candidate",
      cell: ({ row }) => (
        <span
          className="font-medium text-foreground"
          title={row.original.candidate_name || "N/A"}
        >
          {row.original.candidate_name || "N/A"}
        </span>
      ),
    },

  ];

  return (
    <AppPageShell width="wide">
      <PageHeader title="Recent Uploads" />
      {error && !uploads.length ? (
        <ErrorDisplay message={error} onRetry={fetchData} />
      ) : (
        <DataTable
          columns={columns}
          data={uploads}
          loading={loading}
          searchKey="file_name"
          searchPlaceholder="Filter files by name..."
          initialSorting={[{ id: "created_at", desc: true }]}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={setPagination}
          onSearchChange={handleSearchChange}
          searchValue={searchValue}
          isServerSide={true}
          pageCount={Math.ceil(total / pageSize)}
          totalRecords={total}
          tableActions={

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Unit:</span>
              <Select
                value={fileSizeUnit}
                onValueChange={(value) => setFileSizeUnit(value as FileSizeUnit)}
              >
                <SelectTrigger className="w-[90px] h-9 rounded-xl border-border/70 bg-background/90 transition-all focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="KB">KB</SelectItem>
                  <SelectItem value="MB">MB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />
      )}
    </AppPageShell>
  );
};


export default AdminRecentUploads;

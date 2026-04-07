/**
 * Admin page for managing job postings.
 * Displays all jobs with ability to create, edit, and delete.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminJobService } from "@/apis/admin/service";
import type { JobRead } from "@/types/admin";
import {
  AppPageShell,
  DateDisplay,
  PageHeader,
  StatusBadge,
  SkillsBadgeList,
  useToast,
  ErrorDisplay,
  DataTable,
} from "@/components/shared";
import { DeleteModal } from "@/components/modal";
import { useAdminData, useDeleteConfirmation } from "@/hooks";
import { Edit2, Users, ArrowUpDown, Trash2Icon } from "lucide-react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Button } from "@/components";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/lib/permissions";

const AdminJobs = () => {
  const navigate = useNavigate();
  const toast = useToast();


  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    data: jobs,
    total,
    loading,
    error,
    fetchData: fetchJobs,
  } = useAdminData<JobRead>(() => adminJobService.getAllJobs(pageIndex * pageSize, pageSize));

  // Refetch when pagination changes
  useEffect(() => {
    fetchJobs();
  }, [pageIndex, pageSize, fetchJobs]);

  const {
    showModal: showDeleteModal,
    handleDeleteClick,
    handleClose: handleCloseDelete,
    handleConfirm: handleConfirmDelete,
    isDeleting,
    error: deleteError,
    message: deleteMessage,
  } = useDeleteConfirmation<JobRead>({
    deleteFn: (id) => adminJobService.deleteJob(id as string),
    onSuccess: () => {
      fetchJobs();
      toast.success("Job deleted successfully");
    },
    itemTitle: (job) => `job "${job.title}"`,
  });


  const handleViewCandidates = (jobId: string) => {
    navigate(`/dashboard/admin/jobs/${jobId}/candidates`);
  };

  const handleToggleStatus = async (job: JobRead) => {
    try {
      await adminJobService.updateJob(job.id, { is_active: !job.is_active });
      toast.success(`Job ${!job.is_active ? "activated" : "deactivated"} successfully`);
      fetchJobs();
    } catch (error) {
      console.error("Failed to toggle job status:", error);
      toast.error("Failed to update job status");
    }
  };

  const columns: ColumnDef<JobRead>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-lg">{row.original.title}</span>
          <span className="text-sm text-muted-foreground">
            {row.original.department?.name || row.original.department_name || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <PermissionGuard permissions={PERMISSIONS.JOBS_MANAGE} hideWhenDenied>
          <button
            onClick={() => handleToggleStatus(row.original)}
            className="hover:opacity-80 transition-opacity cursor-pointer flex"
            title={`Click to ${row.original.is_active ? "deactivate" : "activate"}`}
          >
            <StatusBadge status={row.original.is_active} />
          </button>
        </PermissionGuard>
      ),
    },
    {
      accessorKey: "skills",
      header: "Skills",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <SkillsBadgeList skills={row.original.skills} maxVisible={2} />
        </div>
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
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <DateDisplay date={row.original.created_at} showTime={false} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const job = row.original;
        return (
          <div className="flex items-center gap-2 justify-end">
            <PermissionGuard permissions={PERMISSIONS.JOBS_MANAGE} hideWhenDenied>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                title="Edit Job"
                onClick={() => navigate(`/dashboard/jobs/${job.id}/edit`, {
                  state: {
                    jobId: job.id
                  }
                })}
              >
                <Edit2 className="h-4 w-4" />
                <span className="sr-only">Edit Job</span>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissions={PERMISSIONS.JOBS_MANAGE} hideWhenDenied>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                title="Delete Job"
                onClick={() => handleDeleteClick(job)}
              >
                <Trash2Icon className="h-4 w-4" />
                <span className="sr-only">Delete Job</span>
              </Button>
            </PermissionGuard>
            <PermissionGuard permissions={PERMISSIONS.CANDIDATES_ACCESS} hideWhenDenied>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl hover:bg-blue-500/10 hover:text-blue-500 transition-all"
                title="View Candidates"
                onClick={() => handleViewCandidates(job.id)}
              >
                <Users className="h-4 w-4" />
                <span className="sr-only">View Candidates</span>
              </Button>
            </PermissionGuard>
          </div>
        );
      },
    },
  ];

  return (
    <AppPageShell width="wide">
      <PageHeader
        title="Job Management"

      />

      {error && !jobs.length ? (
        <ErrorDisplay message={error} onRetry={fetchJobs} />
      ) : (
        <DataTable
          columns={columns}
          data={jobs}
          loading={loading}
          searchKey="title"
          searchPlaceholder="Filter jobs by title..."
          initialSorting={[
            { id: "title", desc: false },
            { id: "created_at", desc: true },
          ]}
          isServerSide={true}
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={Math.ceil(total / pageSize)}
          onPaginationChange={setPagination}
        />
      )}

      <DeleteModal
        show={showDeleteModal}
        handleClose={handleCloseDelete}
        handleConfirm={handleConfirmDelete}
        title="Delete Job"
        message={deleteMessage}
        isLoading={isDeleting}
        error={deleteError}
      />
    </AppPageShell>
  );
};

export default AdminJobs;

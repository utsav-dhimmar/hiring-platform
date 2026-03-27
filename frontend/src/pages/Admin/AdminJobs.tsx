/**
 * Admin page for managing job postings.
 * Displays all jobs with ability to create, edit, and delete.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminJobService } from "@/apis/admin/service";
import type { JobRead } from "@/types/admin";
import {
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
    navigate(`/admin/jobs/${jobId}/candidates`);
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
      cell: ({ row }) => <StatusBadge status={row.original.is_active} />,
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
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 pt-0 pb-8">
      <PageHeader
        title="Job Management"

      />

      {loading ? (
        <div className="flex flex-col gap-4">
          <div className="w-full h-64 bg-muted animate-pulse rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorDisplay message={error} onRetry={fetchJobs} />
      ) : (
        <DataTable
          columns={columns}
          data={jobs}
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
    </div>
  );
};

export default AdminJobs;

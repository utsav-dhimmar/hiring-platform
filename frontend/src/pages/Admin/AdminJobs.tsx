import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { adminJobService } from "@/apis/admin/service";
import { AppPageShell, DataTable } from "@/components/shared";
import type { Job } from "@/types/job";
import { extractErrorMessage } from "@/utils/error";
import { slugify } from "@/utils/slug";
import type { PaginationState } from "@tanstack/react-table";

// Sub-components
import { JobSkeleton } from "@/components/job-board/JobSkeleton";
import { JobBoardHeader } from "@/components/job-board/JobBoardHeader";
import { NoJobsFound } from "@/components/job-board/NoJobsFound";
import { JobDeleteDialog } from "@/components/job-board/JobDeleteDialog";
import { getJobColumns } from "@/components/job-board/JobColumns";
import { JobTableFilters } from "@/components/job-board/JobTableFilters";
import { useJobTableFilters } from "@/hooks/useJobTableFilters";
import { JobActivityModal } from "@/components/job-board/JobActivityModal";

/**
 * AdminJobs page component.
 * Mirrored from the dashboard job-board to provide consistent experience with filtration.
 * Uses server-side pagination for better performance with large datasets.
 */
const AdminJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedJobForActivity, setSelectedJobForActivity] = useState<Job | null>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const {
    titleFilter,
    setTitleFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    dateRange,
    setDateRange,
    departmentOptions,
    filteredJobs,
    hasActiveFilters,
    clearFilters,
    minDate
  } = useJobTableFilters(jobs);

  /** Fetches jobs using the admin service with current pagination. */
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const skip = pagination.pageIndex * pagination.pageSize;
      const limit = pagination.pageSize;
      const response = await adminJobService.getAllJobs(skip, limit);
      setJobs(response.data as unknown as Job[]);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      const errorMessage = extractErrorMessage(error, "Failed to load jobs.");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    fetchJobs();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [fetchJobs]);

  /** Opens the delete-confirmation dialog for the given job. */
  const handleDeleteClick = (job: Job) => {
    setJobToDelete(job);
    setIsDeleteDialogOpen(true);
  };

  /** Deletes the selected job via the admin API, refreshes the list, and closes the dialog. */
  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    try {
      await adminJobService.deleteJob(jobToDelete.id);
      toast.success("Job deleted successfully");
      fetchJobs();
    } catch (error) {
      console.error("Failed to delete job:", error);
      const errorMessage = extractErrorMessage(error, "Failed to delete job.");
      toast.error(errorMessage);
    } finally {
      setIsDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  /** Toggles `is_active` for a job via admin service and refreshes the list on success. */
  const handleToggleStatus = useCallback(
    async (job: Job) => {
      try {
        await adminJobService.updateJob(job.id, { is_active: !job.is_active });
        toast.success(`Job ${!job.is_active ? "activated" : "deactivated"} successfully`);
        fetchJobs();
      } catch (error) {
        console.error("Failed to toggle job status:", error);
        const errorMessage = extractErrorMessage(error, "Failed to update job status");
        toast.error(errorMessage);
      }
    },
    [fetchJobs],
  );

  /** Memoized column definitions. */
  const columns = useMemo(
    () =>
      getJobColumns({
        onToggleStatus: handleToggleStatus,
        onDelete: handleDeleteClick,
        onEdit: (job) => {
          setLoadingJobId(job.id);
          const slug = slugify(job.title);
          navigate(`/dashboard/jobs/${slug}/edit`, { state: { jobId: job.id } });
        },
        onCandidates: (job) => {
          const slug = slugify(job.title);
          navigate(`/dashboard/jobs/${slug}/candidates`, {
            state: { jobId: job.id },
          });
        },
        onViewSessions: (job) => {
          setSelectedJobForActivity(job);
          setIsActivityModalOpen(true);
        },
        loadingJobId,
      }),
    [navigate, handleToggleStatus, loadingJobId],
  );

  return (
    <AppPageShell width="wide">
      <JobBoardHeader />

      <div className="app-surface-card p-3 sm:p-4">
        {loading && jobs.length === 0 ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <JobSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <NoJobsFound />
        ) : (
          <div className="space-y-4">
            <JobTableFilters
              titleFilter={titleFilter}
              setTitleFilter={setTitleFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              departmentFilter={departmentFilter}
              setDepartmentFilter={setDepartmentFilter}
              dateRange={dateRange}
              setDateRange={setDateRange}
              departmentOptions={departmentOptions}
              hasActiveFilters={hasActiveFilters}
              clearFilters={clearFilters}
              resultCount={filteredJobs.length}
              totalCount={total}
              minDate={minDate}
            />
            <DataTable
              columns={columns}
              data={filteredJobs}
              loading={loading}
              isServerSide={true}
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              pageCount={Math.ceil(total / pagination.pageSize)}
              onPaginationChange={setPagination}
              totalRecords={total}
            />
          </div>
        )}
      </div>

      <JobDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        job={jobToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      <JobActivityModal
        isOpen={isActivityModalOpen}
        onOpenChange={setIsActivityModalOpen}
        job={selectedJobForActivity}
      />
    </AppPageShell>
  );
};

export default AdminJobs;

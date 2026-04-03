import jobService from "@/apis/job";
import { AppPageShell, DataTable } from "@/components/shared";
import type { Job } from "@/types/job";
import { extractErrorMessage } from "@/utils/error";
import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { slugify } from "@/utils/slug";

// Sub-components
import { JobSkeleton } from "@/components/job-board/JobSkeleton";
import { JobBoardHeader } from "@/components/job-board/JobBoardHeader";
import { NoJobsFound } from "@/components/job-board/NoJobsFound";
import { JobDeleteDialog } from "@/components/job-board/JobDeleteDialog";
import { getJobColumns } from "@/components/job-board/JobColumns";

/**
 * JobBoard page component for the dashboard.
 *
 * Displays a searchable data table of the jobs with
 * actions for editing, toggling active status, viewing candidates, and deleting.
 * Jobs are fetched on mount and refreshed after every mutation.
 *
 * @remarks
 * Navigation to edit/candidate routes uses a URL-safe slug derived from the
 * job title, while the numeric `job.id` is passed via router state.
 */
export default function JobBoard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  /** Fetches all jobs from the API and replaces the local job list. Shows a toast on failure. */
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await jobService.getJobs();
      setJobs(response.data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      const errorMessage = extractErrorMessage(error, "Failed to load jobs.");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  /** Opens the delete-confirmation dialog for the given job. */
  const handleDeleteClick = (job: Job) => {
    setJobToDelete(job);
    setIsDeleteDialogOpen(true);
  };

  /** Deletes the selected job via the API, refreshes the list, and closes the dialog. */
  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    try {
      await jobService.deleteJob(jobToDelete.id);
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

  /** Toggles `is_active` for a job and refreshes the list on success. */
  const handleToggleStatus = useCallback(
    async (job: Job) => {
      try {
        await jobService.updateJob(job.id, { is_active: !job.is_active });
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

  /** Memoized column definitions that bind table row actions to navigation and mutation handlers. */
  const columns = useMemo(
    () =>
      getJobColumns({
        onToggleStatus: handleToggleStatus,
        onDelete: handleDeleteClick,
        onEdit: (job) => {
          const slug = slugify(job.title);
          navigate(`/dashboard/jobs/${slug}/edit`, { state: { jobId: job.id } });
        },
        onCandidates: (job) => {
          const slug = slugify(job.title);
          navigate(`/dashboard/jobs/${slug}/candidates`, {
            state: { jobId: job.id },
          });
        },
      }),
    [navigate, handleToggleStatus],
  );

  return (
    <AppPageShell width="wide">
      <JobBoardHeader />

      <div className="app-surface-card p-3 sm:p-4">
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <JobSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <NoJobsFound />
        ) : (
          <DataTable
            columns={columns}
            data={jobs}
            searchKey="title"
            searchPlaceholder="Filter jobs by title..."
          />
        )}
      </div>

      <JobDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        job={jobToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </AppPageShell>
  );
}

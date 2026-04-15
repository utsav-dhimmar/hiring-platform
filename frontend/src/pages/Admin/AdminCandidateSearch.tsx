/**
 * Admin page for searching candidates globally or for a specific job.
 * Provides advanced search and filtering for HR.
 */
import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation, useSearchParams } from "react-router-dom";
import { adminCandidateService, adminJobService } from "@/apis/admin/service";
import type { JobRead } from "@/types/admin";
import type { CandidateResponse } from "@/types/resume";
import AppPageShell from "@/components/shared/AppPageShell";
import ErrorDisplay from "@/components/shared/ErrorDisplay";
import PageHeader from "@/components/shared/PageHeader";
import JobSummaryCard from "@/components/shared/JobSummaryCard";
import CandidateSearchTable from "@/components/candidate/CandidateSearchTable";
import QuickResumeUpload from "@/components/candidate/QuickResumeUpload";
import {
  CandidateDetailsModal,
  // CandidateAnalysisModal,
  // DeleteModal,
} from "@/components/modal";
import { JobCandidatesSkeleton } from "@/components/candidate/JobCandidatesSkeleton";
import { resumeService } from "@/apis/resume";
import { useAdminData /*, useDeleteConfirmation*/ } from "@/hooks";
import type { PaginationState } from "@tanstack/react-table";
import { Button } from "@/components";
import { slugify } from "@/utils/slug";

const AdminCandidateSearch = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/dashboard/admin");
  // const toast = useToast();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [job, setJob] = useState<JobRead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Detail Modal State
  const [showDetail, setShowDetail] = useState(false);
  // const [showAnalysisDetails, setShowAnalysisDetails] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateResponse | null>(null);
  // const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [jobMapping, setJobMapping] = useState<{ id: string; slug: string }[]>([]);

  // Fetch job mappings for slug resolution
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const response = await adminJobService.getAllJobs(0, 500);
        const mapping = response.data.map((j: any) => ({
          id: j.id,
          slug: slugify(j.title),
        }));
        setJobMapping(mapping);
      } catch (err) {
        console.error("Failed to fetch job mappings:", err);
      }
    };
    fetchMappings();
  }, []);

  // Extract filters from searchParams and resolve job slugs to IDs
  const filters = useMemo(() => {
    const jobSlugs = searchParams.getAll("job");
    const jobIds = jobSlugs
      .map(slug => jobMapping.find(m => m.slug === slug)?.id)
      .filter((id): id is string => !!id);

    return {
      job: jobIds,
      status: searchParams.getAll("status"),
      city: searchParams.getAll("city"),
      hr_decision: searchParams.getAll("hr_decision"),
    };
  }, [searchParams, jobMapping]);

  const fetchCandidatesFn = useCallback(async () => {
    const skip = pagination.pageIndex * pagination.pageSize;
    const limit = pagination.pageSize;

    let result: { data: CandidateResponse[]; total: number } = {
      data: [],
      total: 0,
    };

    if (jobId) {
      if (activeSearch.trim()) {
        result = await adminCandidateService.searchJobCandidates(
          jobId,
          activeSearch,
          skip,
          limit,
          filters // job ID is already in path, but others (status, city, etc) are useful
        );
      } else {
        result = await adminCandidateService.getCandidatesForJob(
          jobId,
          skip,
          limit,
          filters
        );
      }

      try {
        const resumesData = await resumeService.getJobResumes(jobId);
        result.data = result.data.map((candidate) => {
          const resume = resumesData.resumes.find(
            (r) => r.candidate_id === candidate.id,
          );
          return {
            ...candidate,
            resume_id: resume?.resume_id || candidate.resume_id,
          };
        });
      } catch (err) {
        console.error("Failed to fetch resume IDs for candidates:", err);
      }
    } else {
      // Global search - optional query to show all candidates by default
      result = await adminCandidateService.searchCandidates(
        activeSearch.trim() || undefined,
        skip,
        limit,
        filters
      );
    }
    return result;
  }, [jobId, activeSearch, pagination.pageIndex, pagination.pageSize, filters]);

  const {
    data: candidates,
    total,
    loading,
    error,
    fetchData: fetchCandidates,
  } = useAdminData<CandidateResponse>(
    fetchCandidatesFn,
    { fetchOnMount: false }
  );

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const jobData = await adminJobService.getJobById(jobId);
      setJob(jobData);
    } catch (err) {
      console.error("Failed to fetch job info:", err);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId, fetchJob]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to first page when search changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [activeSearch]);

  // Refetch when pagination, search, or filters change
  useEffect(() => {
    fetchCandidates();
  }, [pagination.pageIndex, pagination.pageSize, activeSearch, filters, fetchCandidates]);

  const handleShowMore = (candidate: CandidateResponse) => {
    setSelectedCandidate(candidate);
    setShowDetail(true);
  };

  // const handleShowAnalysisDetails = (candidate: CandidateResponse) => {
  //   setSelectedCandidate(candidate);
  //   setSelectedResumeId(candidate.resume_id || null);
  //   setShowAnalysisDetails(true);
  // };

  // const {
  //   showModal: showDeleteModal,
  //   handleDeleteClick,
  //   handleClose: handleCloseDelete,
  //   handleConfirm: handleConfirmDelete,
  //   isDeleting,
  //   error: deleteError,
  // } = useDeleteConfirmation<CandidateResponse>({
  //   deleteFn: async (id) => {
  //     const candidate = candidates.find((c) => c.id === id);
  //     if (!candidate?.resume_id || !jobId) {
  //       throw new Error("Cannot delete: Missing job context or resume ID.");
  //     }
  //     await resumeService.deleteResume(jobId, candidate.resume_id);
  //   },
  //   onSuccess: () => {
  //     fetchCandidates();
  //     toast.success("Candidate deleted successfully");
  //   },
  //   itemTitle: (c) => `${c.first_name} ${c.last_name}`,
  // });

  return (
    <AppPageShell width="wide" gap="tight">
      <PageHeader
        title={jobId ? `Candidates for ${job?.title || "Job"}` : "Candidate Search"}

        actions={
          jobId && (
            <>
              <QuickResumeUpload
                jobId={jobId}
                onSuccess={fetchCandidates}
                variant="default"
              />
              <Button
                variant="secondary"
                onClick={() =>
                  navigate(
                    isAdminPath ? "/dashboard/admin/jobs" : "/dashboard/jobs",
                  )
                }
              >
                Back to Jobs
              </Button>
            </>
          )
        }
      />

      {job && <JobSummaryCard job={job} />}

      {error ? (
        <ErrorDisplay message={error} onRetry={fetchCandidates} />
      ) : loading && candidates.length === 0 ? (
        <div className="mt-6">
          <JobCandidatesSkeleton count={pagination.pageSize} />
        </div>
      ) : (
        <div className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
          <CandidateSearchTable
            candidates={candidates}
            total={total}
            pagination={pagination}
            onPaginationChange={setPagination}
            onShowMore={handleShowMore}
            nameFilter={searchQuery}
            onNameFilterChange={setSearchQuery}
            showJobContext={!jobId}
            // onShowAnalysisDetails={handleShowAnalysisDetails}
            // onDelete={handleDeleteClick}
          />
        </div>
      )}

      {/* Candidate Detail Modal */}
      <CandidateDetailsModal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        candidate={selectedCandidate}
        jobId={jobId}
      />

      {/* <DeleteModal
        show={showDeleteModal}
        handleClose={handleCloseDelete}
        handleConfirm={handleConfirmDelete}
        title="Delete Candidate"
        message={`Are you sure you want to delete this candidate? This action cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      /> */}
    </AppPageShell>
  );
};

export default AdminCandidateSearch;

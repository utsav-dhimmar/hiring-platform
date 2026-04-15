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
import jobService from "@/apis/job";

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
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateResponse | null>(null);

  const [searchParams] = useSearchParams();

  /**
   * Job slug→ID mapping stored in state so that loading it after mount 
   * triggers a re-fetch of candidates with correct ID filters.
   */
  const [jobMappings, setJobMappings] = useState<{ id: string; slug: string }[]>([]);

  // Fetch job title→ID mapping once on mount. Stored in a ref — no re-render, no cascade.
  useEffect(() => {
    jobService
      .getJobTitles()
      .then((response) => {
        const jobsArray = Array.isArray(response) ? response : (response as any)?.data;
        if (Array.isArray(jobsArray)) {
          setJobMappings(jobsArray.map((j: any) => ({
            id: j.id,
            slug: slugify(j.title || ""),
          })));
        }
      })
      .catch((err) => console.error("Failed to fetch job mappings:", err));
  }, []);

  /**
   * Derive filter deps from individual param key strings rather than the whole
   * `searchParams` object. This prevents `filters` from recomputing (and firing
   * an extra candidate fetch) when unrelated params like `?q=` change.
   */
  const statusKey = searchParams.getAll("status").join("\0");
  const cityKey = searchParams.getAll("city").join("\0");
  const hrKey = searchParams.getAll("hr_decision").join("\0");
  const jobKey = searchParams.getAll("job").join("\0");

  const filters = useMemo(() => {
    const jobSlugs = jobKey ? jobKey.split("\0") : [];
    const jobIds = jobSlugs
      .map((slug) => jobMappings.find((m) => m.slug === slug)?.id)
      .filter((id): id is string => !!id);

    return {
      job: jobIds,
      status: statusKey ? statusKey.split("\0") : [],
      city: cityKey ? cityKey.split("\0") : [],
      hr_decision: hrKey ? hrKey.split("\0") : [],
    };
  }, [statusKey, cityKey, hrKey, jobKey, jobMappings]);

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
    {
      fetchOnMount: false,
      // Start in a loading state so the skeleton renders immediately and
      // CandidateSearchTable (which contains useCandidateTableFilters) never
      // mounts before the first fetch completes, avoiding repeated hook effects.
      initialLoading: true,
    }
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

  /**
   * When the search term changes, either reset page to 0 (the pagination effect
   * below will then fire the fetch) OR — if already on page 0 — call fetch
   * directly. This prevents the double-fetch that occurred when activeSearch
   * was in both this reset effect AND the general fetch effect below.
   */
  useEffect(() => {
    if (pagination.pageIndex !== 0) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    } else {
      fetchCandidates();
    }
    // fetchCandidates is stable (ref-based inside useAdminData); pagination.pageIndex
    // is read only to branch — adding it would create a dependency cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSearch]);

  // Refetch when pagination or filters change (activeSearch handled separately above).
  useEffect(() => {
    fetchCandidates();
  }, [pagination.pageIndex, pagination.pageSize, filters, fetchCandidates]);

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

/**
 * Admin page for searching candidates globally or for a specific job.
 * Provides advanced search and filtering for HR.
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminCandidateService, adminJobService } from "@/apis/admin/service";
import type { JobRead } from "@/types/admin";
import type { CandidateResponse } from "@/types/resume";
import {
  Button,
  ErrorDisplay,
  PageHeader,
  CandidateSearchForm,
  JobSummaryCard,
} from "@/components/shared";
import CandidateTable from "@/components/candidate/CandidateTable";
import QuickResumeUpload from "@/components/candidate/QuickResumeUpload";
import { CandidateDetailModal, ResumeScreeningDetailModal, DeleteModal } from "@/components/modal";
import { resumeService } from "@/apis/resume";
import { extractErrorMessage } from "@/utils/error";

const AdminCandidateSearch = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [job, setJob] = useState<JobRead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [showDetail, setShowDetail] = useState(false);
  const [showScreeningDetails, setShowScreeningDetails] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResponse | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  // Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    console.log("fetchCandidates");
    setLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * pageSize;
      let result: { data: CandidateResponse[]; total: number } = { data: [], total: 0 };

      if (jobId) {
        let candidatesData: CandidateResponse[] = [];
        if (searchQuery.trim()) {
          const resp = await adminCandidateService.searchJobCandidates(
            jobId,
            searchQuery,
            skip,
            pageSize,
          );
          candidatesData = resp.data;
          result.total = resp.total;
        } else {
          const resp = await adminCandidateService.getCandidatesForJob(jobId, skip, pageSize);
          candidatesData = resp.data;
          result.total = resp.total;
        }

        const resumesData = await resumeService.getJobResumes(jobId);
        result.data = candidatesData.map((candidate) => {
          const resume = resumesData.resumes.find((r) => r.candidate_id === candidate.id);
          return {
            ...candidate,
            resume_id: resume?.resume_id || candidate.resume_id,
          };
        });
      } else if (searchQuery.trim()) {
        result = await adminCandidateService.searchCandidates(searchQuery, skip, pageSize);
      }

      setCandidates(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError(extractErrorMessage(err, "Failed to load candidates."));
    } finally {
      setLoading(false);
    }
  }, [jobId, searchQuery]);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const jobData = await adminJobService.getJobById(jobId);
      setJob(jobData);
    } catch (err) {
      console.error("Failed to fetch job info:", err);
      // Optional: set a separate job fetch error if needed
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
    fetchCandidates();
  }, [jobId, fetchCandidates, fetchJob, page]);

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    fetchCandidates();
  };

  const handleShowMore = (candidate: CandidateResponse) => {
    setSelectedCandidate(candidate);
    setShowDetail(true);
  };

  const handleShowScreeningDetails = (candidate: CandidateResponse) => {
    setSelectedResumeId(candidate.resume_id || null);
    setShowScreeningDetails(true);
  };

  const handleDeleteClick = (candidate: CandidateResponse) => {
    setSelectedCandidate(candidate);
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCandidate || !jobId) return;

    const resumeId = selectedCandidate.resume_id;
    if (!resumeId) {
      setDeleteError("Cannot delete candidate: Missing resume ID information.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await resumeService.deleteResume(jobId, resumeId);
      setShowDeleteModal(false);
      setSelectedCandidate(null);
      // Refresh the list
      fetchCandidates();
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteError(extractErrorMessage(err, "Failed to delete candidate."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="bg-white p-1 mb-1 rounded-xl shadow-sm border border-border">
        <PageHeader
          title={jobId ? `Candidates for ${job?.title || "Job"}` : "Global Candidate Search"}
          className="mb-0 border-0 p-0"
          actions={
            jobId && (
              <div className="flex gap-2 items-center">
                <QuickResumeUpload jobId={jobId} onSuccess={fetchCandidates} variant="default" />
                <Button variant="secondary" onClick={() => navigate("/admin/jobs")}>
                  Back to Jobs
                </Button>
              </div>
            )
          }
        />
      </div>

      {job && <JobSummaryCard job={job} />}

      <CandidateSearchForm
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        loading={loading}
      />

      {error && <ErrorDisplay message={error} onRetry={fetchCandidates} />}

      <CandidateTable
        candidates={candidates}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        loading={loading}
        error={null}
        onRetry={fetchCandidates}
        emptyMessage={
          searchQuery ? "No candidates found matching your search." : "No candidates found."
        }
        onShowMore={handleShowMore}
        onShowScreeningDetails={handleShowScreeningDetails}
        onDelete={handleDeleteClick}
      />

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        candidate={selectedCandidate}
      />

      <ResumeScreeningDetailModal
        show={showScreeningDetails}
        onHide={() => setShowScreeningDetails(false)}
        jobId={jobId || (selectedCandidate as any)?.job_id}
        resumeId={selectedResumeId}
      />

      <DeleteModal
        show={showDeleteModal}
        handleClose={() => setShowDeleteModal(false)}
        handleConfirm={handleConfirmDelete}
        title="Delete Candidate"
        message={`Are you sure you want to delete ${selectedCandidate?.first_name || "this candidate"
          }? This action cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

export default AdminCandidateSearch;

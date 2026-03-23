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
import { CandidateDetailModal } from "@/components/modal";
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
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResponse | null>(null);

  const fetchCandidates = useCallback(async () => {
    console.log("fetchCandidates");
    setLoading(true);
    setError(null);
    try {
      const skip = (page - 1) * pageSize;
      let result: { data: CandidateResponse[]; total: number } = { data: [], total: 0 };

      if (jobId) {
        if (searchQuery.trim()) {
          result = await adminCandidateService.searchJobCandidates(
            jobId,
            searchQuery,
            skip,
            pageSize,
          );
        } else {
          result = await adminCandidateService.getCandidatesForJob(jobId, skip, pageSize);
        }
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

  return (
    <div className="admin-dashboard">
      <div className="bg-white p-1 mb-1 rounded-4 shadow-sm border border-light">
        <PageHeader
          title={jobId ? `Candidates for ${job?.title || "Job"}` : "Global Candidate Search"}
          className="mb-0 border-0 p-0"
          actions={
            jobId && (
              <div className="d-flex gap-2 align-items-center">
                <QuickResumeUpload jobId={jobId} onSuccess={fetchCandidates} variant="primary" />
                <Button variant="outline-secondary" onClick={() => navigate("/admin/jobs")}>
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
      />

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        candidate={selectedCandidate}
      />
    </div>
  );
};

export default AdminCandidateSearch;

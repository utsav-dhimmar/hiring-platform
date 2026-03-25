import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import { ErrorDisplay } from "@/components/shared";
import { CandidateDetailModal, JobDetailsModal } from "@/components/modal";
import {
  adminJobService,
  adminCandidateService,
} from "@/apis/admin/service";
import { resumeService } from "@/apis/resume";
import type { Job } from "@/types/job";
import type { CandidateResponse } from "@/types/resume";
import { useAdminData } from "@/hooks";
import { extractErrorMessage } from "@/utils/error";


// Extracted Components
import JobCandidatesHeader from "@/pages/JobCandidates/components/JobCandidatesHeader";
import ResumeScreeningView from "@/pages/JobCandidates/components/ResumeScreeningView";

const JobCandidatesPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const activeStage = "resume-screening";

  // Search State

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Detail Modal State
  const [showDetail, setShowDetail] = useState(false);
  const [showJobInfo, setShowJobInfo] = useState(false);
  const [showScreeningDetails, setShowScreeningDetails] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResponse | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);


  const fetchJobAndCandidates = useCallback(async () => {
    if (!jobId) return [];

    const [jobData, candidatesData] = await Promise.all([
      adminJobService.getJobById(jobId),
      resumeService.getJobCandidates(jobId),
    ]);

    setJob(jobData);

    return candidatesData.candidates;
  }, [jobId]);

  const {
    data: candidates,
    setData: setCandidates,
    loading,
    error,
    fetchData,
    setError,
  } = useAdminData<CandidateResponse>(fetchJobAndCandidates, {
    fetchOnMount: !!jobId,
  });



  // Polling for in-progress resumes
  useEffect(() => {
    // Only poll if not searching and we have resumes and on resume screening stage
    if (activeStage !== "resume-screening" || searchQuery !== "" || candidates.length === 0) return;

    const hasInProgress = candidates.some(
      (c) => c.processing_status && !["completed", "failed"].includes(c.processing_status),
    );

    if (hasInProgress) {
      const interval = setInterval(() => {
        fetchData(); // This might be noisy, but it's consistent with existing logic
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [candidates, fetchData, searchQuery, activeStage]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    setIsSearching(true);
    setError(null);
    try {
      let candidatesData: CandidateResponse[] = [];
      if (searchQuery.trim()) {
        const result = await adminCandidateService.searchJobCandidates(jobId, searchQuery);
        candidatesData = result.data;
      } else {
        const resp = await resumeService.getJobCandidates(jobId);
        candidatesData = resp.candidates;
      }
      setCandidates(candidatesData);
    } catch (err) {
      console.error("Search failed:", err);
      setError(extractErrorMessage(err, "Search failed."));
    } finally {
      setIsSearching(false);
    }
  };

  const handleShowMore = (candidate: CandidateResponse) => {
    setSelectedCandidate(candidate);
    setShowDetail(true);
  };

  const handleShowScreeningDetails = (candidate: CandidateResponse) => {
    setSelectedResumeId(candidate.resume_id || null);
    setShowScreeningDetails(true);
  };


  if (!loading && (error || !job)) {
    return (
      <Container className="py-5">
        <ErrorDisplay message={error || "Job not found."} onRetry={() => navigate("/")} fullPage />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <JobCandidatesHeader
        jobId={jobId}
        job={job}
        onRefresh={fetchData}
        onShowJobInfo={() => setShowJobInfo(true)}
      />

      <ResumeScreeningView
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        isSearching={isSearching}
        candidates={candidates}
        loading={loading}
        error={error}
        fetchData={fetchData}
        onShowMore={handleShowMore}
        onShowScreeningDetails={handleShowScreeningDetails}
        jobId={jobId}
      />

      <JobDetailsModal show={showJobInfo} onHide={() => setShowJobInfo(false)} job={job} />

      <CandidateDetailModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        candidate={selectedCandidate}
      />

    </Container>
  );

};

export default JobCandidatesPage;

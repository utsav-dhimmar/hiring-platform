import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container } from "react-bootstrap";
import { ErrorDisplay } from "@/components/shared";
import { CandidateDetailModal, JobDetailsModal } from "@/components/modal";
import {
  adminJobService,
  adminCandidateService,
  adminResultsService,
} from "@/apis/admin/service";
import { resumeService } from "@/apis/resume";
import type { Job } from "@/types/job";
import type { CandidateResponse } from "@/types/resume";
import type { HRRoundResult } from "@/types/admin";
import { useAdminData } from "@/hooks";
import { extractErrorMessage } from "@/utils/error";

// Extracted Components
import JobCandidatesHeader from "@/pages/JobCandidates/components/JobCandidatesHeader";
import StageTabs from "@/pages/JobCandidates/components/StageTabs";
import ResumeScreeningView from "@/pages/JobCandidates/components/ResumeScreeningView";
import HRRoundView from "@/pages/JobCandidates/components/HRRoundView";

type Stage = "resume-screening" | "hr-round";

const JobCandidatesPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [activeStage, setActiveStage] = useState<Stage>("resume-screening");

  // HR Round results state
  const [hrResults, setHrResults] = useState<HRRoundResult[]>([]);
  const [hrLoading, setHrLoading] = useState(false);
  const [hrError, setHrError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Detail Modal State
  const [showDetail, setShowDetail] = useState(false);
  const [showJobInfo, setShowJobInfo] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResponse | null>(null);

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

  const fetchHRResults = useCallback(async () => {
    if (!jobId) return;
    setHrLoading(true);
    setHrError(null);
    try {
      const data = await adminResultsService.getHRRoundResults(jobId);
      setHrResults(data.results);
    } catch (err) {
      setHrError(extractErrorMessage(err, "Failed to fetch HR results."));
    } finally {
      setHrLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (activeStage === "hr-round") {
      fetchHRResults();
    }
  }, [activeStage, fetchHRResults]);

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

      <StageTabs activeStage={activeStage} onStageChange={setActiveStage} />

      {activeStage === "resume-screening" && (
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
          jobId={jobId}
        />
      )}

      {activeStage === "hr-round" && (
        <HRRoundView
          hrResults={hrResults}
          hrLoading={hrLoading}
          hrError={hrError}
          fetchHRResults={fetchHRResults}
          jobId={jobId}
        />
      )}

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

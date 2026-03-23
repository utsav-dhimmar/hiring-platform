/**
 * Job candidates page displaying all applicants for a specific job.
 * Shows resume analysis results, scores, and pass/fail decisions.
 * Includes polling for processing status and detailed candidate modals.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Badge, Breadcrumb } from "react-bootstrap";
import {
  Card,
  CardHeader,
  Button,
  PageHeader,
  ErrorDisplay,
  CandidateSearchForm,
} from "../../components/common";
import { CandidateDetailModal, JobDetailsModal } from "../../components/modal";
import CandidateTable from "../../components/candidate/CandidateTable";
import { adminJobService, adminCandidateService } from "../../apis/admin/service";
import { resumeService } from "../../apis/services/resume";
import type { Job } from "../../apis/types/job";
import type { CandidateResponse } from "../../apis/types/resume";
import { useAdminData } from "../../hooks";

import { extractErrorMessage } from "../../utils/error";

const JobCandidatesPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);

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

  // Polling for in-progress resumes
  useEffect(() => {
    // Only poll if not searching and we have resumes
    if (searchQuery !== "" || candidates.length === 0) return;

    const hasInProgress = candidates.some(
      (c) => c.processing_status && !["completed", "failed"].includes(c.processing_status),
    );

    if (hasInProgress) {
      const interval = setInterval(() => {
        fetchData(); // This might be noisy, but it's consistent with existing logic
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [candidates, fetchData, searchQuery]);

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
      <div className="mb-4">
        <Breadcrumb className="bg-transparent p-0 mb-2">
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
            Jobs
          </Breadcrumb.Item>
          <Breadcrumb.Item active className="text-muted fw-medium">
            {job?.title}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border border-light mb-4">
        <PageHeader
          title={`Candidates for ${job?.title}`}
          subtitle={`${job?.department} | ${job?.is_active ? "Active" : "Inactive"}`}
          className="mb-0 border-0 p-0 shadow-none"
          actions={
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={() => setShowJobInfo(true)}>
                Job Details
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate("/")}>
                Back to Jobs
              </Button>
            </div>
          }
        />
      </div>

      <CandidateSearchForm
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        loading={isSearching}
        placeholder="Search candidates for this job by name or email..."
      />

      <Row>
        <Col>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">{searchQuery ? "Search Results" : "Applicant List"}</h3>
              <Badge bg="primary">{candidates.length} Candidate Found</Badge>
            </CardHeader>
            <CandidateTable
              candidates={candidates}
              loading={loading || (isSearching && candidates.length === 0)}
              error={error}
              onRetry={fetchData}
              className="border-0 shadow-none"
              emptyMessage={
                searchQuery
                  ? `No candidates found matching "${searchQuery}"`
                  : "No candidates have applied for this job yet."
              }
              onShowMore={handleShowMore}
              showEvaluateAction={true}
              jobId={jobId}
            />
          </Card>
        </Col>
      </Row>

      <JobDetailsModal
        show={showJobInfo}
        onHide={() => setShowJobInfo(false)}
        job={job}
      />

      <CandidateDetailModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        candidate={selectedCandidate}
      />
    </Container>
  );
};

export default JobCandidatesPage;

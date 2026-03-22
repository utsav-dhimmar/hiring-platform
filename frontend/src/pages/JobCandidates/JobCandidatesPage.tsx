/**
 * Job candidates page displaying all applicants for a specific job.
 * Shows resume analysis results, scores, and pass/fail decisions.
 * Includes polling for processing status and detailed candidate modals.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Spinner, Badge, Breadcrumb, Modal, Form } from "react-bootstrap";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  DateDisplay,
  Input,
  PageHeader,
  AdminDataTable,
  type Column,
  StatusBadge,
  ErrorDisplay,
} from "../../components/common";
import { CandidateDetailModal } from "../../components/modal";
import { adminJobService, adminCandidateService } from "../../apis/admin/service";
import { resumeService } from "../../apis/services/resume";
import type { Job } from "../../apis/types/job";
import type { CandidateResponse, JobResumeInfoResponse } from "../../apis/types/resume";
import { useAdminData } from "../../hooks";

import { extractErrorMessage } from "../../utils/error";

const mapCandidateToResumeInfo = (
  jobId: string,
  candidate: CandidateResponse,
): JobResumeInfoResponse => ({
  job_id: jobId,
  candidate_id: candidate.id,
  candidate_first_name: candidate.first_name,
  candidate_last_name: candidate.last_name,
  candidate_email: candidate.email,
  candidate_phone: candidate.phone,
  file_id: candidate.id,
  resume_id: candidate.id,
  file_name: "N/A",
  file_type: "N/A",
  size: 0,
  source_url: "",
  uploaded_at: candidate.created_at,
  parsed: candidate.is_parsed,
  processing: {
    status: candidate.processing_status ?? "completed",
    error: candidate.processing_error ?? null,
  },
  analysis: candidate.resume_analysis,
  resume_score: candidate.resume_score,
  pass_fail: candidate.pass_fail,
});

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
  const [selectedResume, setSelectedResume] = useState<JobResumeInfoResponse | null>(null);

  const fetchJobAndCandidates = useCallback(async () => {
    if (!jobId) return [];

    const [jobData, candidatesData] = await Promise.all([
      adminJobService.getJobById(jobId),
      resumeService.getJobCandidates(jobId),
    ]);

    setJob(jobData);
    return candidatesData.candidates.map((candidate) => mapCandidateToResumeInfo(jobId, candidate));
  }, [jobId]);

  const {
    data: resumes,
    setData: setResumes,
    loading,
    error,
    fetchData,
    setError,
  } = useAdminData<JobResumeInfoResponse>(fetchJobAndCandidates, {
    fetchOnMount: !!jobId,
  });

  // Map JobResumeInfoResponse to CandidateResponse for the shared modal
  const mappedCandidate = useMemo(() => {
    if (!selectedResume) return null;
    return {
      id: selectedResume.candidate_id,
      first_name: selectedResume.candidate_first_name,
      last_name: selectedResume.candidate_last_name,
      email: selectedResume.candidate_email,
      phone: selectedResume.candidate_phone,
      current_status: null,
      created_at: selectedResume.uploaded_at,
      resume_analysis: selectedResume.analysis,
      resume_score: selectedResume.resume_score,
      pass_fail: selectedResume.pass_fail,
      is_parsed: selectedResume.parsed,
      processing_status: selectedResume.processing?.status || null,
      processing_error: selectedResume.processing?.error || null,
    } as CandidateResponse;
  }, [selectedResume]);

  // Polling for in-progress resumes
  useEffect(() => {
    // Only poll if not searching and we have resumes
    if (searchQuery !== "" || resumes.length === 0) return;

    const hasInProgress = resumes.some(
      (r) => r.processing?.status && !["completed", "failed"].includes(r.processing.status),
    );

    if (hasInProgress) {
      const interval = setInterval(() => {
        fetchData(); // This might be noisy, but it's consistent with existing logic
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [resumes, fetchData, searchQuery]);

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
      setResumes(candidatesData.map((candidate) => mapCandidateToResumeInfo(jobId, candidate)));
    } catch (err) {
      console.error("Search failed:", err);
      setError(extractErrorMessage(err, "Search failed."));
    } finally {
      setIsSearching(false);
    }
  };

  const handleShowMore = (resume: JobResumeInfoResponse) => {
    setSelectedResume(resume);
    setShowDetail(true);
  };

  const columns: Column<JobResumeInfoResponse>[] = [
    {
      header: "Name",
      accessor: (resume) => (
        <strong>
          {resume.parsed ? (
            `${resume.candidate_first_name ?? ""} ${resume.candidate_last_name ?? ""}`.trim() ||
            "N/A"
          ) : (
            <span className="text-muted italic">Processing...</span>
          )}
        </strong>
      ),
    },
    { header: "Email", accessor: "candidate_email" },
    {
      header: "Score",
      accessor: (resume) =>
        resume.resume_score !== null ? (
          <Badge
            bg={resume.resume_score >= 65 ? "success" : "warning"}
            className={`px-3 py-2 rounded-pill bg-${resume.resume_score >= 65 ? "success" : "warning"}-subtle text-${resume.resume_score >= 65 ? "success" : "warning"}`}
          >
            {resume.resume_score.toFixed(1)}%
          </Badge>
        ) : (
          <span className="text-muted">N/A</span>
        ),
    },
    {
      header: "Pass/Fail",
      style: { width: "120px", minWidth: "120px" },
      accessor: (resume) => (
        <StatusBadge
          status={resume.pass_fail === null ? "pending" : resume.pass_fail ? "pass" : "fail"}
          mapping={{
            pass: "success",
            fail: "danger",
            pending: "secondary",
          }}
        />
      ),
    },
    {
      header: "Status",
      style: { width: "150px", minWidth: "150px" },
      accessor: (resume) => {
        const status = resume.processing?.status;
        if (status === "processing" || status === "queued") {
          return (
            <Badge bg="info" className="d-inline-flex align-items-center gap-1">
              <Spinner animation="border" size="sm" />
              Processing
            </Badge>
          );
        }
        return <StatusBadge status={status === "failed" ? "failed" : "completed"} />;
      },
    },
    {
      header: "Actions",
      className: "text-end text-nowrap",
      style: { width: "250px", minWidth: "250px" },
      accessor: (resume) => (
        <div className="d-flex gap-2 justify-content-end align-items-center flex-nowrap">
          <Button
            variant="outline-primary"
            size="sm"
            className="flex-shrink-0"
            onClick={() => handleShowMore(resume)}
          >
            Show More
          </Button>
          {resume.pass_fail !== false && (
            <Button
              variant="primary"
              size="sm"
              className="flex-shrink-0"
              onClick={() =>
                navigate(`/jobs/${jobId}/candidates/${resume.candidate_id}/evaluation`)
              }
              disabled={
                resume.processing?.status === "processing" || resume.processing?.status === "queued"
              }
            >
              Evaluate
            </Button>
          )}
        </div>
      ),
    },
  ];

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

      <Card className="mb-4">
        <CardBody>
          <Form onSubmit={handleSearch}>
            <Row className="g-2">
              <Col>
                <Input
                  placeholder="Search candidates for this job by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Col>
              <Col xs="auto">
                <Button variant="primary" type="submit" isLoading={isSearching}>
                  Search
                </Button>
              </Col>
            </Row>
          </Form>
        </CardBody>
      </Card>

      <Row>
        <Col>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">{searchQuery ? "Search Results" : "Applicant List"}</h3>
              <Badge bg="primary">{resumes.length} Candidate Found</Badge>
            </CardHeader>
            <AdminDataTable
              columns={columns}
              data={resumes}
              loading={loading || (isSearching && resumes.length === 0)}
              error={error}
              onRetry={fetchData}
              rowKey="resume_id"
              className="border-0 shadow-none"
              emptyMessage={
                searchQuery
                  ? `No candidates found matching "${searchQuery}"`
                  : "No candidates have applied for this job yet."
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Job Information Modal */}
      {job && (
        <Modal
          show={showJobInfo}
          onHide={() => setShowJobInfo(false)}
          size="lg"
          className="modal-dialog-scrollable"
        >
          <Modal.Header closeButton>
            <Modal.Title>Job Details: {job.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="mb-4">
              <Col md={6}>
                <h5>Basic Info</h5>
                <p className="mb-1">
                  <strong>Department:</strong> {job.department || "N/A"}
                </p>
                <p className="mb-1">
                  <strong>Status:</strong> <StatusBadge status={job.is_active} />
                </p>
                <p className="mb-1">
                  <strong>Created At:</strong>{" "}
                  <DateDisplay date={job.created_at} showTime={false} />
                </p>
              </Col>
            </Row>
            <hr />
            <h5>Job Description</h5>
            <div className="bg-light p-3 rounded" style={{ whiteSpace: "pre-wrap" }}>
              {job.jd_text || "No description provided."}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowJobInfo(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        candidate={mappedCandidate}
      />
    </Container>
  );
};

export default JobCandidatesPage;

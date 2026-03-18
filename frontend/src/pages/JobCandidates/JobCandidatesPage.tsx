/**
 * Job candidates page displaying all applicants for a specific job.
 * Shows resume analysis results, scores, and pass/fail decisions.
 * Includes polling for processing status and detailed candidate modals.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, Badge, Breadcrumb, Modal } from "react-bootstrap";
import { Card, CardHeader, CardBody, Button } from "../../components/common";
import { resumeService } from "../../apis/services/resumeService";
import type { Job } from "../../apis/types/job";
import type { JobResumeInfoResponse } from "../../apis/types/resume";

const JobCandidatesPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<JobResumeInfoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [showDetail, setShowDetail] = useState(false);
  const [showJobInfo, setShowJobInfo] = useState(false);
  const [selectedResume, setSelectedResume] = useState<JobResumeInfoResponse | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!jobId) return;

    if (!silent) setLoading(true);
    try {
      const resumesData = await resumeService.getJobResumes(jobId);

      if (!resumesData.job) {
        setError("Job not found.");
      } else {
        setJob(resumesData.job);
        setResumes(resumesData.resumes);
        setError(null);
      }
    } catch (err) {
      console.error("Failed to fetch job resumes:", err);
      if (!silent) setError("Failed to load candidates. Please try again later.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling for in-progress resumes
  useEffect(() => {
    const hasInProgress = resumes.some(r => 
      r.processing?.status && !["completed", "failed"].includes(r.processing.status)
    );

    if (hasInProgress) {
      const interval = setInterval(() => {
        fetchData(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [resumes, fetchData]);

  const handleShowMore = (resume: JobResumeInfoResponse) => {
    setSelectedResume(resume);
    setShowDetail(true);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading candidates...</p>
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          {error || "Job not found."}
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate("/")}>
              Back to Jobs
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Jobs</Breadcrumb.Item>
        <Breadcrumb.Item active>{job.title}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Candidates for {job.title}</h1>
          <p className="text-muted mb-0">{job.department} | {job.is_active ? "Active" : "Inactive"}</p>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => setShowJobInfo(true)}>
            Show Job Info
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate("/")}>
            Back to Jobs
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Applicant List</h3>
              <Badge bg="primary">{resumes.length} Total</Badge>
            </CardHeader>
            <CardBody>
              {resumes.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>No candidates have applied for this job yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Score</th>
                        <th>Pass/Fail</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumes.map((resume) => (
                        <tr key={resume.resume_id}>
                          <td>
                            <strong>
                              {resume.parsed ? (
                                `${resume.candidate_first_name} ${resume.candidate_last_name}`.trim()
                              ) : (
                                <span className="text-muted italic">Processing...</span>
                              )}
                            </strong>
                          </td>
                          <td>{resume.candidate_email}</td>
                          <td>
                            {resume.resume_score !== null ? (
                              <Badge bg={resume.resume_score >= 65 ? "success" : "warning"}>
                                {resume.resume_score.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td>
                            {resume.pass_fail !== null ? (
                              <Badge bg={resume.pass_fail ? "success" : "danger"}>
                                {resume.pass_fail ? "PASS" : "FAIL"}
                              </Badge>
                            ) : (
                              <Badge bg="secondary">PENDING</Badge>
                            )}
                          </td>
                          <td>
                            {resume.processing?.status === "processing" || resume.processing?.status === "queued" ? (
                              <Badge bg="info" className="d-inline-flex align-items-center gap-1">
                                <Spinner animation="border" size="sm" />
                                Processing
                              </Badge>
                            ) : resume.processing?.status === "failed" ? (
                              <Badge bg="danger">Failed</Badge>
                            ) : (
                              <Badge bg="success">Completed</Badge>
                            )}
                          </td>
                          <td className="text-end">
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => handleShowMore(resume)}
                            >
                              Show More
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Job Information Modal */}
      <Modal show={showJobInfo} onHide={() => setShowJobInfo(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Job Details: {job.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-4">
            <Col md={6}>
              <h5>Basic Info</h5>
              <p className="mb-1"><strong>Department:</strong> {job.department || "N/A"}</p>
              <p className="mb-1"><strong>Status:</strong> <Badge bg={job.is_active ? "success" : "secondary"}>{job.is_active ? "Active" : "Inactive"}</Badge></p>
              <p className="mb-1"><strong>Created At:</strong> {(() => {
                const date = new Date(job.created_at);
                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
              })()}</p>
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

      {/* Candidate Detail Modal */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            Candidate Analysis: {selectedResume?.candidate_first_name} {selectedResume?.candidate_last_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedResume && (
            <div className="p-2">
              <Row className="mb-4">
                <Col md={6}>
                  <h5>Basic Information</h5>
                  <p className="mb-1"><strong>Email:</strong> {selectedResume.candidate_email}</p>
                  <p className="mb-1"><strong>File:</strong> {selectedResume.file_name}</p>
                  <p className="mb-1"><strong>Status:</strong> <Badge bg="info">{selectedResume.processing?.status}</Badge></p>
                </Col>
                <Col md={6}>
                  <h5>Screening Results</h5>
                  <p className="mb-1">
                    <strong>Score:</strong> {selectedResume.resume_score ? (
                      <Badge bg={selectedResume.resume_score >= 65 ? "success" : "warning"}>
                        {selectedResume.resume_score.toFixed(1)}%
                      </Badge>
                    ) : "N/A"}
                  </p>
                  <p className="mb-1">
                    <strong>Pass/Fail:</strong> {selectedResume.pass_fail !== null ? (
                      <Badge bg={selectedResume.pass_fail ? "success" : "danger"}>
                        {selectedResume.pass_fail ? "PASS" : "FAIL"}
                      </Badge>
                    ) : "PENDING"}
                  </p>
                </Col>
              </Row>

              <hr />

              {selectedResume.analysis ? (
                <>
                  <div className="mb-4">
                    <h5>Strength Summary</h5>
                    <p className="text-muted">{selectedResume.analysis.strength_summary}</p>
                  </div>

                  <div className="mb-4">
                    <h5>Experience Alignment</h5>
                    <p className="text-muted">{selectedResume.analysis.experience_alignment}</p>
                  </div>

                  <Row>
                    <Col md={6}>
                      <h5>Missing Skills</h5>
                      {selectedResume.analysis.missing_skills?.length > 0 ? (
                        <div className="d-flex flex-wrap gap-2">
                          {selectedResume.analysis.missing_skills.map((skill, idx) => (
                            <Badge key={idx} bg="danger" pill className="fw-normal">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-success">No major missing skills identified.</p>
                      )}
                    </Col>
                    <Col md={6}>
                      <h5>Extraordinary Points</h5>
                      {selectedResume.analysis.extraordinary_points?.length > 0 ? (
                        <ul className="ps-3 mb-0">
                          {selectedResume.analysis.extraordinary_points.map((point, idx) => (
                            <li key={idx} className="text-success mb-1">{point}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted">None identified.</p>
                      )}
                    </Col>
                  </Row>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No detailed analysis available for this candidate.</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetail(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default JobCandidatesPage;

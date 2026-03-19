/**
 * Home page displaying available jobs and resume upload functionality.
 * Allows users to browse open positions and submit resumes.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Alert, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { adminCandidateService } from "../../apis/admin/service";
import jobService from "../../apis/services/job";
import { resumeService } from "../../apis/services/resume";
import type { Job } from "../../apis/types/job";
import type { CandidateResponse } from "../../apis/types/resume";
import { Button, Card, CardBody, CardHeader } from "../../components/common";
import { CandidateDetailModal } from "../../components/modal";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout, selectCurrentUser } from "../../store/slices/authSlice";

const HomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // Candidate Search State
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
  const [searchingCandidates, setSearchingCandidates] = useState(false);
  const [showCandidateDetail, setShowCandidateDetail] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResponse | null>(null);

  const isAuthorized =
    user?.role_name?.toLowerCase() === "admin" ||
    user?.role_name?.toLowerCase() === "hr" ||
    user?.permissions?.includes("admin:access") ||
    user?.permissions?.includes("admin:all");

  const viewCandidates = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const goToAdmin = () => {
    navigate("/admin");
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobService.getJobs();
        setJobs(data);
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        setMessage({ type: "danger", text: "Failed to load jobs." });
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleFileUpload = async (jobId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [jobId]: true }));
    setMessage(null);

    try {
      await resumeService.uploadResume(jobId, file);
      setMessage({ type: "success", text: "Resume uploaded successfully!" });
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({ type: "danger", text: "Failed to upload resume." });
    } finally {
      setUploading((prev) => ({ ...prev, [jobId]: false }));
      // Clear file input
      event.target.value = "";
    }
  };

  const handleCandidateSearch = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!candidateQuery.trim()) {
        setCandidates([]);
        return;
      }

      setSearchingCandidates(true);
      try {
        const data = await adminCandidateService.searchCandidates(candidateQuery);
        setCandidates(data);
      } catch (error) {
        console.error("Failed to search candidates:", error);
        setMessage({ type: "danger", text: "Failed to search candidates." });
      } finally {
        setSearchingCandidates(false);
      }
    },
    [candidateQuery],
  );

  const handleShowCandidateDetail = (candidate: CandidateResponse) => {
    setSelectedCandidate(candidate);
    setShowCandidateDetail(true);
  };

  return (
    <Container className="py-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Welcome to Hiring Platform</h1>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          {isAuthorized && (
            <Button variant="primary" onClick={goToAdmin}>
              Admin Dashboard
            </Button>
          )}
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </Col>
      </Row>

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* {isAuthorized && (
        <Row className="mb-5">
          <Col>
            <Card>
              <CardHeader>
                <h3 className="mb-0">Quick Candidate Search</h3>
              </CardHeader>
              <CardBody>
                <Form onSubmit={handleCandidateSearch} className="mb-4">
                  <Row className="g-2">
                    <Col>
                      <Input
                        placeholder="Search candidates by name or email..."
                        value={candidateQuery}
                        onChange={(e) => setCandidateQuery(e.target.value)}
                      />
                    </Col>
                    <Col xs="auto">
                      <Button
                        variant="primary"
                        type="submit"
                        isLoading={searchingCandidates}
                      >
                        Search
                      </Button>
                    </Col>
                  </Row>
                </Form>

                {searchingCandidates && candidates.length === 0 ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Searching...</p>
                  </div>
                ) : candidateQuery && candidates.length === 0 && !searchingCandidates ? (
                  <div className="text-center py-4 text-muted">
                    <p>No candidates found matching "{candidateQuery}"</p>
                  </div>
                ) : candidates.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Score</th>
                          <th>Result</th>
                          <th>Applied At</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map((candidate) => (
                          <tr key={candidate.id}>
                            <td>
                              {candidate.first_name} {candidate.last_name}
                            </td>
                            <td>{candidate.email}</td>
                            <td>
                              {candidate.resume_score !== null ? (
                                <Badge
                                  bg={
                                    candidate.resume_score >= 65
                                      ? "success"
                                      : "warning"
                                  }
                                >
                                  {candidate.resume_score.toFixed(1)}%
                                </Badge>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                            <td>
                              {candidate.pass_fail !== null ? (
                                <Badge
                                  bg={candidate.pass_fail ? "success" : "danger"}
                                >
                                  {candidate.pass_fail ? "PASS" : "FAIL"}
                                </Badge>
                              ) : (
                                <Badge bg="secondary">PENDING</Badge>
                              )}
                            </td>
                            <td>
                              <DateDisplay
                                date={candidate.created_at}
                                showTime={false}
                              />
                            </td>
                            <td className="text-end">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowCandidateDetail(candidate)}
                              >
                                View Profile
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )} */}

      <Row>
        <Col>
          <Card>
            <CardHeader>
              <h3 className="mb-0">Available Jobs</h3>
            </CardHeader>
            <CardBody>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>No jobs available at the moment.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id}>
                          <td>
                            <strong>{job.title}</strong>
                          </td>
                          <td>{job.department || "N/A"}</td>
                          <td>
                            <span className={`badge bg-${job.is_active ? "success" : "secondary"}`}>
                              {job.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-inline-flex align-items-center gap-2">
                              {uploading[job.id] ? (
                                <Spinner animation="border" size="sm" />
                              ) : (
                                <Form.Group controlId={`upload-${job.id}`}>
                                  <Form.Control
                                    type="file"
                                    size="sm"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      handleFileUpload(job.id, e)
                                    }
                                    accept=".pdf,.doc,.docx"
                                  />
                                </Form.Group>
                              )}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => viewCandidates(job.id)}
                              >
                                View Candidates
                              </Button>
                            </div>
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

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        show={showCandidateDetail}
        onHide={() => setShowCandidateDetail(false)}
        candidate={selectedCandidate}
      />
    </Container>
  );
};

export default HomePage;

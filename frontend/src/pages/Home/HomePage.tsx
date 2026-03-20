/**
 * Home page displaying available jobs and resume upload functionality.
 * Allows users to browse open positions and submit resumes.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Alert, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import jobService from "../../apis/services/job";
import { authService } from "../../apis/services/auth";
import { resumeService } from "../../apis/services/resume";
import type { Job } from "../../apis/types/job";
import { Button, Card, CardBody, CardHeader, JobSearch } from "../../components/common";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout, selectCurrentUser } from "../../store/slices/authSlice";
import { extractErrorMessage } from "../../utils/error";

const HomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchingJobs, setSearchingJobs] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

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

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobService.getJobs();
      setJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      const errorMessage = extractErrorMessage(error, "Failed to load jobs.");
      setMessage({ type: "danger", text: errorMessage });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleJobsFound = (results: Job[]) => {
    setJobs(results);
  };

  const handleClearSearch = () => {
    fetchJobs();
  };

  const handleSearchError = (errorMsg: string) => {
    setMessage({ type: "danger", text: errorMsg });
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Backend logout failed:", error);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  const handleFileUpload = async (jobId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation for file size (5MB)
    const MAX_SIZE_MB = Number(import.meta.env.VITE_RESUME_MAX_SIZE_MB) || 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setMessage({
        type: "danger",
        text: `Resume size must be <= ${MAX_SIZE_MB} MB.`,
      });
      event.target.value = "";
      return;
    }

    setUploading((prev) => ({ ...prev, [jobId]: true }));
    setMessage(null);

    try {
      await resumeService.uploadResume(jobId, file);
      setMessage({ type: "success", text: "Resume uploaded successfully!" });
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = extractErrorMessage(error, "Failed to upload resume.");
      setMessage({ type: "danger", text: errorMessage });
    } finally {
      setUploading((prev) => ({ ...prev, [jobId]: false }));
      // Clear file input
      event.target.value = "";
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0 fw-bold text-primary">Hiring Platform</h2>
        <div className="d-flex gap-2">
          {isAuthorized && (
            <Button variant="primary" onClick={goToAdmin}>
              Admin Dashboard
            </Button>
          )}
          <Button variant="outline-danger" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Row>
        <Col>
          <Card>
            <CardHeader>
              <h3 className="mb-0">Available Jobs</h3>
            </CardHeader>
            <CardBody>
              <div className="mb-4 position-relative">
                <JobSearch
                  onResultsFound={handleJobsFound}
                  onClear={handleClearSearch}
                  onError={handleSearchError}
                  onSearching={setSearchingJobs}
                />
                {searchingJobs && (
                  <div className="position-absolute end-0 top-50 translate-middle-y me-5">
                    <Spinner animation="border" size="sm" variant="primary" />
                  </div>
                )}
              </div>

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
                  <table className="table table-hover align-middle border-0">
                    <thead className="bg-light text-muted small text-uppercase fw-bold">
                      <tr>
                        <th className="px-4 py-3 border-0">Job Title</th>
                        <th className="px-4 py-3 border-0">Department</th>
                        <th className="px-4 py-3 border-0">Status</th>
                        <th className="px-4 py-3 border-0 text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="border-0">
                      {jobs.map((job) => (
                        <tr key={job.id} className="border-bottom">
                          <td className="px-4 py-3 border-0">
                            <div className="fw-semibold text-dark">{job.title}</div>
                          </td>
                          <td className="px-4 py-3 border-0 text-muted">
                            {job.department || "N/A"}
                          </td>
                          <td className="px-4 py-3 border-0">
                            <span
                              className={`badge px-3 py-2 rounded-pill bg-${job.is_active ? "success" : "secondary"}-subtle text-${job.is_active ? "success" : "secondary"}`}
                            >
                              {job.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-0 text-end">
                            <div className="d-inline-flex align-items-center gap-2">
                              {uploading[job.id] ? (
                                <Spinner animation="border" size="sm" variant="primary" />
                              ) : (
                                <Form.Group controlId={`upload-${job.id}`} className="mb-0">
                                  <Form.Control
                                    type="file"
                                    size="sm"
                                    className="d-none"
                                    id={`file-input-${job.id}`}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      handleFileUpload(job.id, e)
                                    }
                                    accept=".pdf,.doc,.docx"
                                  />
                                  <label
                                    htmlFor={`file-input-${job.id}`}
                                    className="btn btn-sm btn-outline-primary mb-0 cursor-pointer"
                                  >
                                    Upload Resume
                                  </label>
                                </Form.Group>
                              )}
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => viewCandidates(job.id)}
                              >
                                Candidates
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
    </Container>
  );
};

export default HomePage;

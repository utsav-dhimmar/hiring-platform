/**
 * Home page displaying available jobs and resume upload functionality.
 * Allows users to browse open positions and submit resumes.
 */

import React, { useCallback, useEffect, useState } from "react";
import { Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import jobService from "@/apis/job";
import { resumeService } from "@/apis/resume";
import type { Job } from "@/types/job";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  JobSearch,
  TableRowSkeleton,
  useToast,
} from "@/components/shared";
import { extractErrorMessage } from "@/utils/error";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { authService } from "@/apis/auth";

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchingJobs, setSearchingJobs] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  const goToAdmin = () => {
    navigate("/admin");
  };

  const viewCandidates = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobService.getJobs();
      setJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      const errorMessage = extractErrorMessage(error, "Failed to load jobs.");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
    toast.error(errorMsg);
  };

  const handleFileUpload = async (
    jobId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_MB = Number(import.meta.env.VITE_RESUME_MAX_SIZE_MB) || 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.warn(`Resume size must be <= ${MAX_SIZE_MB} MB.`);
      event.target.value = "";
      return;
    }

    setUploading((prev) => ({ ...prev, [jobId]: true }));

    try {
      await resumeService.uploadResume(jobId, file);
      toast.success("Resume uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = extractErrorMessage(
        error,
        "Failed to upload resume.",
      );
      toast.error(errorMessage);
    } finally {
      setUploading((prev) => ({ ...prev, [jobId]: false }));
      event.target.value = "";
    }
  };

  return (
    <Container className="py-2 animate-fade-in">
      <Row className="mb-4 align-items-center">
        <Col>
          <h2 className="fw-bold mb-0">Active Job Openings</h2>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          <Button
            variant="outline-primary"
            onClick={goToAdmin}
            className="btn-header-action"
          >
            Panel
          </Button>
          <Button
            variant="outline-danger"
            onClick={handleLogout}
            className="btn-header-action"
          >
            Logout
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="bg-white border-0 pt-4 px-4">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0 fw-bold">Job Postings</h4>
                <div className="text-muted small">
                  {loading ? "Counting..." : `${jobs.length} Positions`}
                </div>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <div className="mb-4 position-relative">
                <JobSearch
                  onResultsFound={handleJobsFound}
                  onClear={handleClearSearch}
                  onError={handleSearchError}
                  onSearching={setSearchingJobs}
                />
                {searchingJobs && (
                  <div className="position-absolute end-0 top-50 translate-middle-y me-5 pe-2">
                    <Spinner animation="border" size="sm" variant="primary" />
                  </div>
                )}
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light text-muted small text-uppercase fw-bold">
                    <tr>
                      <th className="px-4 py-3 border-0">Job Title</th>
                      <th className="px-4 py-3 border-0">Department</th>
                      <th className="px-4 py-3 border-0">Status</th>
                      <th className="px-4 py-3 border-0 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="border-0">
                    {loading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRowSkeleton key={i} columns={4} />
                      ))
                    ) : jobs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-5">
                          <div className="py-4">
                            <h5 className="text-dark fw-bold">No jobs found</h5>
                            <p className="text-muted">
                              Try adjusting your search or check back later.
                            </p>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={handleClearSearch}
                            >
                              Clear Search
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr key={job.id} className="border-bottom border-light">
                          <td className="px-4 py-3 border-0">
                            <div className="fw-semibold text-dark">
                              {job.title}
                            </div>
                          </td>
                          <td className="px-4 py-3 border-0 text-muted">
                            {job.department?.name ??
                              job.department_name ??
                              "General"}
                          </td>
                          <td className="px-4 py-3 border-0">
                            <span
                              className={`badge px-3 py-2 rounded-pill bg-${job.is_active ? "success" : "secondary"}-subtle text-${job.is_active ? "success" : "secondary"}`}
                            >
                              {job.is_active ? "Active" : "Closed"}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-0 text-end">
                            <div className="d-inline-flex align-items-center gap-2">
                              {uploading[job.id] ? (
                                <div className="d-flex align-items-center gap-2 text-primary small fw-medium px-2">
                                  <Spinner animation="border" size="sm" />
                                  <span>Uploading...</span>
                                </div>
                              ) : (
                                <Form.Group className="mb-0">
                                  <Form.Control
                                    type="file"
                                    size="sm"
                                    className="d-none"
                                    id={`file-input-${job.id}`}
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) => handleFileUpload(job.id, e)}
                                    accept=".pdf,.doc,.docx"
                                  />
                                  <label
                                    htmlFor={`file-input-${job.id}`}
                                    className="btn btn-outline-primary btn-table-action mb-0"
                                    style={{ cursor: "pointer" }}
                                  >
                                    Upload Resume
                                  </label>
                                </Form.Group>
                              )}
                              <Button
                                variant="primary"
                                onClick={() => viewCandidates(job.id)}
                                className="btn-table-action"
                              >
                                Candidates
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;

/**
 * Home page displaying available jobs and resume upload functionality.
 * Allows users to browse open positions and submit resumes.
 */

import React, { useEffect, useState } from "react";
import { Alert, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import jobService from "../../apis/services/jobService";
import { resumeService } from "../../apis/services/resumeService";
import type { Job } from "../../apis/types/job";
import { Button, Card, CardBody, CardHeader } from "../../components/common";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout, selectCurrentUser } from "../../store/slices/authSlice";

const HomePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ type: string; text: string } | null>(
    null,
  );

  const isAdmin = user?.role_name?.toLowerCase() === 'admin';

  const viewCandidates = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  const goToAdmin = () => {
    navigate('/admin');
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

  const handleFileUpload = async (
    jobId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [jobId]: true }));
    setMessage(null);

    try {
      const response = await resumeService.uploadResume(jobId, file);
      console.log(response);
      setMessage({
        type: "success",
        text: `Resume uploaded successfully for job! Resuem ID : ${response.resume_id}`,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({ type: "danger", text: "Failed to upload resume." });
    } finally {
      setUploading((prev) => ({ ...prev, [jobId]: false }));
      // Clear file input
      event.target.value = "";
    }
  };

  return (
    <Container className="py-5">
      <Row className="mb-4 align-items-center">
        <Col>
          <h1>Welcome to Hiring Platform</h1>
        </Col>
        <Col xs="auto" className="d-flex gap-2">
          {isAdmin && (
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
        <Alert
          variant={message.type}
          dismissible
          onClose={() => setMessage(null)}
        >
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
                            <span
                              className={`badge bg-${job.is_active ? "success" : "secondary"}`}
                            >
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
                                    onChange={(
                                      e: React.ChangeEvent<HTMLInputElement>,
                                    ) => handleFileUpload(job.id, e)}
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
    </Container>
  );
};

export default HomePage;

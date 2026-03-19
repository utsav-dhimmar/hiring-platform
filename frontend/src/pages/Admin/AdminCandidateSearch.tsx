/**
 * Admin page for searching candidates globally or for a specific job.
 * Provides advanced search and filtering for HR.
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge, Spinner, Modal } from "react-bootstrap";
import {
  adminCandidateService,
  adminJobService,
} from "../../apis/admin/service";
import type { CandidateResponse } from "../../apis/types/resume";
import type { JobRead } from "../../apis/admin/types";
import {
  Card,
  CardBody,
  Button,
  Input,
  DateDisplay,
} from "../../components/common";

import "../../css/adminDashboard.css";

const AdminCandidateSearch = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState<CandidateResponse[]>([]);
  const [job, setJob] = useState<JobRead | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Detail Modal State
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<CandidateResponse | null>(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: CandidateResponse[] = [];
      if (jobId) {
        if (searchQuery.trim()) {
          data = await adminCandidateService.searchJobCandidates(
            jobId,
            searchQuery,
          );
        } else {
          data = await adminCandidateService.getCandidatesForJob(jobId);
        }
      } else if (searchQuery.trim()) {
        data = await adminCandidateService.searchCandidates(searchQuery);
      }
      setCandidates(data);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError("Failed to load candidates.");
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
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
    fetchCandidates();
  }, [jobId, fetchCandidates, fetchJob]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };

  const handleShowMore = (candidate: CandidateResponse) => {
    setSelectedCandidate(candidate);
    setShowDetail(true);
  };

  return (
    <div className="admin-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          {jobId
            ? `Candidates for ${job?.title || "Job"}`
            : "Global Candidate Search"}
        </h1>
        {jobId && (
          <Button
            variant="outline-secondary"
            onClick={() => navigate("/admin/jobs")}
          >
            Back to Jobs
          </Button>
        )}
      </div>

      <Card className="mb-4">
        <CardBody>
          <form onSubmit={handleSearch} className="d-flex gap-2">
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="primary" type="submit" isLoading={loading}>
              Search
            </Button>
          </form>
        </CardBody>
      </Card>

      {error && <div className="alert alert-danger">{error}</div>}

      <Card>
        <CardBody>
          {loading && candidates.length === 0 ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Searching candidates...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>
                {searchQuery
                  ? "No candidates found matching your search."
                  : "No candidates found."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Score</th>
                    <th>Result</th>
                    <th>Applied At</th>
                    <th>Actions</th>
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
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleShowMore(candidate)}
                        >
                          View Details
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

      {/* Candidate Detail Modal */}
      <Modal show={showDetail} onHide={() => setShowDetail(false)} size="lg" className="modal-dialog-scrollable">
        <Modal.Header closeButton>
          <Modal.Title>
            Candidate Profile: {selectedCandidate?.first_name}{" "}
            {selectedCandidate?.last_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCandidate && (
            <div className="p-3">
              <div className="row mb-4">
                <div className="col-md-6">
                  <h5 className="border-bottom pb-2">Contact Information</h5>
                  <p className="mb-1">
                    <strong>Email:</strong> {selectedCandidate.email}
                  </p>
                  <p className="mb-1">
                    <strong>Phone:</strong> {selectedCandidate.phone || "N/A"}
                  </p>
                  <p className="mb-1">
                    <strong>Current Status:</strong>{" "}
                    {selectedCandidate.current_status || "Applied"}
                  </p>
                </div>
                <div className="col-md-6">
                  <h5 className="border-bottom pb-2">Screening Overview</h5>
                  <p className="mb-1">
                    <strong>Score:</strong>{" "}
                    {selectedCandidate.resume_score ? (
                      <Badge
                        bg={
                          selectedCandidate.resume_score >= 65
                            ? "success"
                            : "warning"
                        }
                      >
                        {selectedCandidate.resume_score.toFixed(1)}%
                      </Badge>
                    ) : (
                      "N/A"
                    )}
                  </p>
                  <p className="mb-1">
                    <strong>Pass/Fail:</strong>{" "}
                    {selectedCandidate.pass_fail !== null ? (
                      <Badge
                        bg={selectedCandidate.pass_fail ? "success" : "danger"}
                      >
                        {selectedCandidate.pass_fail ? "PASS" : "FAIL"}
                      </Badge>
                    ) : (
                      "PENDING"
                    )}
                  </p>
                  <p className="mb-1">
                    <strong>Parsing:</strong>{" "}
                    {selectedCandidate.is_parsed ? "Success" : "Pending/Failed"}
                  </p>
                </div>
              </div>

              {selectedCandidate.resume_analysis ? (
                <>
                  <div className="mb-4">
                    <h5 className="border-bottom pb-2">Strength Summary</h5>
                    <p className="text-muted">
                      {selectedCandidate.resume_analysis.strength_summary}
                    </p>
                  </div>

                  <div className="mb-4">
                    <h5 className="border-bottom pb-2">Experience Alignment</h5>
                    <p className="text-muted">
                      {selectedCandidate.resume_analysis.experience_alignment}
                    </p>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <h5 className="border-bottom pb-2">Missing Skills</h5>
                      {selectedCandidate.resume_analysis.missing_skills
                        ?.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {selectedCandidate.resume_analysis.missing_skills.map(
                            (skill, idx) => (
                              <Badge
                                key={idx}
                                bg="danger"
                                pill
                                className="fw-normal"
                              >
                                {skill}
                              </Badge>
                            ),
                          )}
                        </div>
                      ) : (
                        <p className="text-success small">
                          No major missing skills identified.
                        </p>
                      )}
                    </div>
                    <div className="col-md-6">
                      <h5 className="border-bottom pb-2">
                        Extraordinary Points
                      </h5>
                      {selectedCandidate.resume_analysis.extraordinary_points
                        ?.length > 0 ? (
                        <ul className="ps-3 mb-0 small">
                          {selectedCandidate.resume_analysis.extraordinary_points.map(
                            (point, idx) => (
                              <li key={idx} className="text-success mb-1">
                                {point}
                              </li>
                            ),
                          )}
                        </ul>
                      ) : (
                        <p className="text-muted small">None identified.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 bg-light rounded">
                  <p className="text-muted mb-0">
                    No detailed AI analysis available for this candidate.
                  </p>
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
    </div>
  );
};

export default AdminCandidateSearch;

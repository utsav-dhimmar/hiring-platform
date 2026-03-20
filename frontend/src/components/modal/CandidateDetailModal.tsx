/**
 * Modal component for displaying detailed candidate information.
 * Shows contact info, screening overview, and AI-powered resume analysis.
 */

import { Badge, Modal } from "react-bootstrap";
import type { CandidateResponse, MissingSkill } from "../../apis/types/resume";
import { Button } from "../common";

interface CandidateDetailModalProps {
  /** Controls visibility of the modal */
  show: boolean;
  /** Callback to close the modal */
  onHide: () => void;
  /** The candidate data to display */
  candidate: CandidateResponse | null;
}

const formatMissingSkill = (skill: MissingSkill | string) =>
  typeof skill === "string" ? skill : `${skill.name} (${skill.score.toFixed(0)}%)`;

const CandidateDetailModal = ({ show, onHide, candidate }: CandidateDetailModalProps) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" className="modal-dialog-scrollable">
      <Modal.Header closeButton>
        <Modal.Title>
          Candidate Profile: {candidate?.first_name} {candidate?.last_name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {candidate && (
          <div className="p-3">
            <div className="row mb-4">
              <div className="col-md-6">
                <h5 className="border-bottom pb-2">Contact Information</h5>
                <p className="mb-1">
                  <strong>Email:</strong> {candidate.email}
                </p>
                <p className="mb-1">
                  <strong>Phone:</strong> {candidate.phone || "N/A"}
                </p>
                <p className="mb-1">
                  <strong>Current Status:</strong> {candidate.current_status || "Applied"}
                </p>
              </div>
              <div className="col-md-6">
                <h5 className="border-bottom pb-2">Screening Overview</h5>
                <p className="mb-1">
                  <strong>Score:</strong>{" "}
                  {candidate.resume_score !== null ? (
                    <Badge bg={candidate.resume_score >= 65 ? "success" : "warning"}>
                      {candidate.resume_score.toFixed(1)}%
                    </Badge>
                  ) : (
                    "N/A"
                  )}
                </p>
                <p className="mb-1">
                  <strong>Pass/Fail:</strong>{" "}
                  {candidate.pass_fail !== null ? (
                    <Badge bg={candidate.pass_fail ? "success" : "danger"}>
                      {candidate.pass_fail ? "PASS" : "FAIL"}
                    </Badge>
                  ) : (
                    "PENDING"
                  )}
                </p>
                <p className="mb-1">
                  <strong>Parsing:</strong> {candidate.is_parsed ? "Success" : (
                    candidate.processing_status === "failed" 
                      ? <span className="text-danger">Failed</span> 
                      : "Pending"
                  )}
                </p>
                {candidate.processing_status === "failed" && candidate.processing_error && (
                  <p className="mb-1 text-danger small">
                    <strong>Error:</strong> {candidate.processing_error}
                  </p>
                )}
              </div>
            </div>

            {candidate.resume_analysis ? (
              <>
                <div className="mb-4">
                  <h5 className="border-bottom pb-2">Strength Summary</h5>
                  <p className="text-muted">{candidate.resume_analysis.strength_summary}</p>
                </div>

                <div className="mb-4">
                  <h5 className="border-bottom pb-2">Experience Alignment</h5>
                  <p className="text-muted">{candidate.resume_analysis.experience_alignment}</p>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <h5 className="border-bottom pb-2">Missing Skills</h5>
                    {candidate.resume_analysis.missing_skills?.length > 0 ? (
                      <div className="d-flex flex-wrap gap-1">
                        {candidate.resume_analysis.missing_skills.map((skill, idx) => (
                          <Badge key={idx} bg="danger" pill className="fw-normal">
                            {formatMissingSkill(skill)}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-success small">No major missing skills identified.</p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <h5 className="border-bottom pb-2">Extraordinary Points</h5>
                    {candidate.resume_analysis.extraordinary_points?.length > 0 ? (
                      <ul className="ps-3 mb-0 small">
                        {candidate.resume_analysis.extraordinary_points.map((point, idx) => (
                          <li key={idx} className="text-success mb-1">
                            {point}
                          </li>
                        ))}
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
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CandidateDetailModal;

import type { ReactElement } from "react";
import { Badge } from "react-bootstrap";
import { Card, CardBody } from "../common";
import type { CandidateResponse } from "../../apis/types/resume";

/**
 * Props for the CandidateInfoSidebar component.
 */
interface CandidateInfoSidebarProps {
  /** The candidate data to display in the sidebar */
  candidate: CandidateResponse;
}

/**
 * Sidebar component displaying key information about a candidate.
 * Shows email, resume score, and current application status.
 */
const CandidateInfoSidebar = ({ candidate }: CandidateInfoSidebarProps): ReactElement => {
  return (
    <Card className="border-0 shadow-sm rounded-4">
      <CardBody className="p-4">
        <h6 className="text-muted small text-uppercase fw-bold mb-3 letter-spacing-wide">
          Candidate Info
        </h6>
        <div className="mb-3 pb-3 border-bottom border-light">
          <small className="text-muted d-block mb-1">Email Address</small>
          <p className="mb-0 fw-medium">{candidate.email}</p>
        </div>
        <div className="mb-3 pb-3 border-bottom border-light">
          <small className="text-muted d-block mb-1">Resume Score</small>
          <div className="d-flex align-items-center">
            <h4 className="mb-0 fw-bold">{candidate.resume_score?.toFixed(1)}%</h4>
            <Badge bg="primary" className="ms-2 rounded-pill bg-primary-subtle text-primary">
              Top 10%
            </Badge>
          </div>
        </div>
        <div>
          <small className="text-muted d-block mb-1">Current Status</small>
          <Badge bg="info" className="rounded-pill bg-info-subtle text-info px-3 py-2">
            {candidate.current_status || "In Process"}
          </Badge>
        </div>
      </CardBody>
    </Card>
  );
};

export default CandidateInfoSidebar;

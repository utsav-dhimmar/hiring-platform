import type { ReactElement } from "react";
import { Modal, Row, Col } from "react-bootstrap";
import { Button, StatusBadge, DateDisplay } from "../common";
import type { Job } from "../../apis/types/job";

interface JobDetailsModalProps {
  show: boolean;
  onHide: () => void;
  job: Job | null;
}

const JobDetailsModal = ({ show, onHide, job }: JobDetailsModalProps): ReactElement | null => {
  if (!job) return null;

  return (
    <Modal
      show={show}
      onHide={onHide}
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
              <strong>Department:</strong> {job.department?.name ?? job.department_name ?? "N/A"}
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
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default JobDetailsModal;

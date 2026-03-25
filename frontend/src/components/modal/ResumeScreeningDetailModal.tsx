import { useEffect, useState, useCallback } from "react";
import { Modal, Badge, Spinner, Row, Col } from "react-bootstrap";
import { Button, ErrorDisplay, Card } from "@/components/shared";
import { adminJobService } from "@/apis/admin/service";
import type { JobResumeInfoResponse } from "@/types/resume";
import { extractErrorMessage } from "@/utils/error";

interface ResumeScreeningDetailModalProps {
  show: boolean;
  onHide: () => void;
  jobId: string | undefined;
  resumeId: string | null;
}

const ResumeScreeningDetailModal = ({
  show,
  onHide,
  jobId,
  resumeId,
}: ResumeScreeningDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<JobResumeInfoResponse | null>(null);

  const fetchData = useCallback(async () => {
    if (!jobId || !resumeId) return;

    setLoading(true);
    setError(null);
    try {
      const result = await adminJobService.getJobResumeDetail(jobId, resumeId);
      setData(result);
    } catch (err) {
      console.error("Failed to fetch resume screening details:", err);
      setError(extractErrorMessage(err, "Failed to load screening details."));
    } finally {
      setLoading(false);
    }
  }, [jobId, resumeId]);

  useEffect(() => {
    if (show && jobId && resumeId) {
      fetchData();
    } else if (!show) {
      setData(null);
      setError(null);
    }
  }, [show, jobId, resumeId, fetchData]);

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">
          Detailed Screening: {data?.candidate_first_name}{" "}
          {data?.candidate_last_name}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-3">
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading screening details...</p>
          </div>
        )}

        {error && <ErrorDisplay message={error} onRetry={fetchData} />}

        {!loading && !error && data && (
          <div className="resume-details">
            <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-light rounded-3 border border-light">
              <div>
                <div className="text-muted small mb-1">Status</div>
                <Badge
                  bg={
                    data.pass_fail
                      ? "success"
                      : data.pass_fail === false
                        ? "danger"
                        : "secondary"
                  }
                >
                  {data.pass_fail === true
                    ? "PASS"
                    : data.pass_fail === false
                      ? "FAIL"
                      : "PENDING"}
                </Badge>
              </div>
              <div className="text-end">
                <div className="text-muted small mb-1">Score</div>
                <div
                  className={`fs-4 fw-bold ${data.resume_score && data.resume_score >= 65 ? "text-success" : "text-warning"}`}
                >
                  {data.resume_score !== null
                    ? `${data.resume_score.toFixed(1)}%`
                    : "N/A"}
                </div>
              </div>
            </div>

            {/* AI Summary Section */}
            {data.analysis && (
              <section className="mb-4">
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <span className="bg-primary-subtle p-1 rounded text-primary">
                    <i className="bi bi-robot"></i>
                  </span>
                  AI Match Analysis
                </h5>
                <Card className="border-0 shadow-sm mb-3">
                  <div className="p-3">
                    <h6 className="fw-bold small text-uppercase text-muted mb-2">
                      Strength Summary
                    </h6>
                    <p className="mb-0 text-dark" style={{ lineHeight: "1.6" }}>
                      {data.analysis.strength_summary}
                    </p>
                  </div>
                </Card>
                <Card className="border-0 shadow-sm">
                  <div className="p-3">
                    <h6 className="fw-bold small text-uppercase text-muted mb-2">
                      Experience Alignment
                    </h6>
                    <p className="mb-0 text-dark" style={{ lineHeight: "1.6" }}>
                      {data.analysis.experience_alignment}
                    </p>
                  </div>
                </Card>
              </section>
            )}

            {/* Custom Extractions Section  */}
            <section className="mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <span className="bg-info-subtle p-1 rounded text-info">
                  <i className="bi bi-clipboard-data"></i>
                </span>
                Resume Metadata
              </h5>
              <Row className="g-3">
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm p-3">
                    <div className="small text-muted mb-1">File Name</div>
                    <div
                      className="fw-medium text-truncate"
                      title={data.file_name}
                    >
                      {data.file_name}
                    </div>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="h-100 border-0 shadow-sm p-3">
                    <div className="small text-muted mb-1">Uploaded At</div>
                    <div className="fw-medium">
                      {new Date(data.uploaded_at).toLocaleString()}
                    </div>
                  </Card>
                </Col>
              </Row>
            </section>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="border-top-0 pt-0">
        <Button variant="outline-secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ResumeScreeningDetailModal;

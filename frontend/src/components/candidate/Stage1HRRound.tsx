/**
 * Stage 1 HR Screening Round component.
 * Handles recording upload, AI analysis display, and decision submission.
 */

import React, { useState } from "react";
import { Col, Form, ProgressBar, Row, Spinner } from "react-bootstrap";
import { Button, Card, CardBody, CardHeader, StatusBadge } from "../common";
import type { Stage1Info } from "../../apis/types/stage";

interface Stage1HRRoundProps {
  /** Current Stage 1 data */
  stageInfo: Stage1Info | null;
  /** Callback to handle transcript upload */
  onUploadTranscript: (file: File) => Promise<void>;
  /** Callback to handle HR decision */
  onMakeDecision: (decision: boolean) => Promise<void>;
  /** Whether an operation is in progress */
  isLoading?: boolean;
}

const EvaluationItem = ({ label, score }: { label: string; score: number }) => (
  <div className="mb-3">
    <div className="d-flex justify-content-between mb-1">
      <span className="small fw-bold">{label}</span>
      <span className="small">{score}/10</span>
    </div>
    <ProgressBar
      now={score * 10}
      variant={score >= 7 ? "success" : score >= 5 ? "warning" : "danger"}
      style={{ height: "6px" }}
    />
  </div>
);

const Stage1HRRound: React.FC<Stage1HRRoundProps> = ({
  stageInfo,
  onUploadTranscript,
  onMakeDecision,
  isLoading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await onUploadTranscript(selectedFile);
      setSelectedFile(null);
    }
  };

  if (!stageInfo) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Stage 1 has not been initiated for this candidate.</p>
        <Button variant="primary">Initiate HR Screening</Button>
      </div>
    );
  }

  const { status, analysis, hr_decision } = stageInfo;

  return (
    <div className="stage-1-hr-round">
      <Card className="mb-4">
        <CardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Stage 1: HR Screening Round</h5>
          <StatusBadge status={status} />
        </CardHeader>
        <CardBody>
          {status === "pending" && !stageInfo.transcript_id && (
            <div className="upload-section py-4 text-center border rounded bg-light mb-4">
              <h6>Upload Interview Transcript</h6>
              <p className="text-muted small mb-3">Accepted formats: TXT, JSON, DOCX (Max 10MB)</p>
              <Form.Group className="mb-3 d-flex justify-content-center">
                <div style={{ maxWidth: "300px" }}>
                  <Form.Control
                    type="file"
                    accept=".txt,.json,.doc,.docx,application/json,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </div>
              </Form.Group>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || isLoading}
                isLoading={isLoading}
              >
                Upload & Analyze
              </Button>
            </div>
          )}

          {(status === "processing" || (status === "pending" && stageInfo.transcript_id)) && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="mb-3" />
              <h5>Analyzing Transcript...</h5>
              <p className="text-muted">
                The AI is analyzing the interview transcript and evaluating the candidate. This may
                take a few moments.
              </p>
            </div>
          )}

          {status === "completed" && analysis && (
            <div className="results-section">
              <Row className="mb-4">
                <Col md={8}>
                  <div className="mb-4">
                    <h6 className="border-bottom pb-2">Response Summary</h6>
                    <p className="text-muted">{analysis.response_summary}</p>
                  </div>
                  <div className="mb-4">
                    <h6 className="border-bottom pb-2">Communication Evaluation</h6>
                    <p className="text-muted">{analysis.communication_evaluation}</p>
                  </div>
                  <div className="bg-light p-3 rounded">
                    <h6 className="mb-2">AI Recommendation</h6>
                    <p className="mb-0 fw-bold text-primary">{analysis.recommendation}</p>
                  </div>
                </Col>
                <Col md={4}>
                  <Card className="border shadow-none">
                    <CardBody>
                      <h6 className="text-center mb-4">Evaluation Scores</h6>
                      <div className="text-center mb-4">
                        <div className="display-4 fw-bold text-primary">
                          {analysis.overall_score.toFixed(0)}
                        </div>
                        <div className="text-muted small">Overall Score</div>
                      </div>

                      <EvaluationItem label="Communication" score={analysis.communication_skill} />
                      <EvaluationItem label="Confidence" score={analysis.confidence} />
                      <EvaluationItem label="Cultural Fit" score={analysis.cultural_fit} />
                      <EvaluationItem
                        label="Profile Understanding"
                        score={analysis.profile_understanding}
                      />
                      <EvaluationItem
                        label="Tech-Stack Alignment"
                        score={analysis.tech_stack_alignment}
                      />
                      <EvaluationItem label="Salary Alignment" score={analysis.salary_alignment} />
                    </CardBody>
                  </Card>
                </Col>
              </Row>

              <hr />

              <div className="decision-section mt-4">
                <h6 className="mb-3">HR Decision</h6>
                {hr_decision === null ? (
                  <div className="d-flex gap-3">
                    <Button
                      variant="success"
                      className="flex-grow-1"
                      onClick={() => onMakeDecision(true)}
                      disabled={isLoading}
                    >
                      Proceed to Stage 2
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-grow-1"
                      onClick={() => onMakeDecision(false)}
                      disabled={isLoading}
                    >
                      Reject Candidate
                    </Button>
                  </div>
                ) : (
                  <div
                    className={`alert ${hr_decision ? "alert-success" : "alert-danger"} d-flex justify-content-between align-items-center mb-0`}
                  >
                    <span>
                      Decision: <strong>{hr_decision ? "PROCEEDED TO STAGE 2" : "REJECTED"}</strong>
                    </span>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => onMakeDecision(!hr_decision)}
                      disabled={isLoading}
                    >
                      Change Decision
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="alert alert-danger mb-0">
              <h6>Analysis Failed</h6>
              <p className="mb-3">There was an error processing the interview recording.</p>
              <Button variant="danger" size="sm" onClick={() => setSelectedFile(null)}>
                Try Again
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default Stage1HRRound;

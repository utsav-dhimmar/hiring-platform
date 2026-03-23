/**
 * Stage 1 HR Screening Round component.
 * Handles recording upload, AI analysis display, and decision submission.
 */

import React, { useState } from "react";
import { Col, Form, ProgressBar, Row, Spinner } from "react-bootstrap";
import { Button, Card, CardBody, StatusBadge } from "../common";
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

/**
 * Individual evaluation metric display with a progress bar and score.
 */
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

const Stage1HRRound = ({ stageInfo, onUploadTranscript, onMakeDecision, isLoading = false }: Stage1HRRoundProps) => {
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
      <div className="stage-1-hr-round animate-fade-in">
        <Card className="mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="bg-white px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">Stage 1: HR Screening Round</h5>
            <StatusBadge status={status} />
          </div>
          <CardBody className="p-4">
            {status === "pending" && !stageInfo.transcript_id && (
              <div className="upload-section py-5 px-4 text-center border-2 border-dashed rounded-4 bg-light mb-4 transition-all hover-bg-light-blue">
                <div className="mb-3 text-primary">
                  <i className="bi bi-cloud-arrow-up display-4"></i>
                </div>
                <h6 className="fw-bold mb-2">Upload Interview Transcript</h6>
                <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: "400px" }}>
                  Accept interview transcripts in TXT, JSON, or DOCX formats. Our AI will analyze
                  the conversation to provide skills and culture fit scores.
                </p>
                <Form.Group className="mb-4 d-flex justify-content-center">
                  <div style={{ maxWidth: "350px" }} className="w-100">
                    <Form.Control
                      type="file"
                      className="form-control-lg rounded-3 border-light shadow-sm"
                      accept=".txt,.json,.doc,.docx,application/json,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                  </div>
                </Form.Group>
                <Button
                  variant="primary"
                  size="lg"
                  className="px-5 rounded-pill shadow-sm fw-bold"
                  onClick={handleUpload}
                  disabled={!selectedFile || isLoading}
                  isLoading={isLoading}
                >
                  Start Analysis
                </Button>
              </div>
            )}

            {(status === "processing" || (status === "pending" && stageInfo.transcript_id)) && (
              <div className="text-center py-5">
                <div className="mb-4">
                  <Spinner
                    animation="border"
                    variant="primary"
                    style={{ width: "3rem", height: "3rem" }}
                  />
                </div>
                <h5 className="fw-bold mb-2">Analyzing Transcript...</h5>
                <p className="text-muted mx-auto" style={{ maxWidth: "450px" }}>
                  Our AI is meticulously reviewing the interview transcript to evaluate skills,
                  confidence, and cultural alignment. This usually takes less than a minute.
                </p>
              </div>
            )}

            {status === "completed" && analysis && (
              <div className="results-section">
                <Row className="g-4">
                  <Col lg={7} xl={8}>
                    <div className="mb-4">
                      <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-wide">
                        Response Summary
                      </h6>
                      <div className="p-3 bg-light rounded-3 border-0 text-dark leading-relaxed">
                        {analysis.response_summary}
                      </div>
                    </div>
                    <div className="mb-4">
                      <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-wide">
                        Communication Evaluation
                      </h6>
                      <div className="p-3 bg-light rounded-3 border-0 text-dark leading-relaxed">
                        {analysis.communication_evaluation}
                      </div>
                    </div>
                    <div className="bg-primary-subtle p-4 rounded-4 border-0">
                      <h6 className="text-primary fw-bold mb-2 d-flex align-items-center">
                        <i className="bi bi-robot me-2"></i>
                        AI Recommendation
                      </h6>
                      <p className="mb-0 fs-5 fw-medium text-primary-emphasis leading-tight">
                        {analysis.recommendation}
                      </p>
                    </div>
                  </Col>
                  <Col lg={5} xl={4}>
                    <Card className="border-0 bg-white shadow-sm rounded-4">
                      <CardBody className="p-4">
                        <h6 className="text-center text-muted small text-uppercase fw-bold mb-4 letter-spacing-wide">
                          Evaluation Scores
                        </h6>
                        <div className="text-center mb-5">
                          <div className="position-relative d-inline-block">
                            <h2 className="display-4 fw-bold text-primary mb-0 tabular-nums">
                              {analysis.overall_score.toFixed(0)}
                            </h2>
                            <span className="text-muted small position-absolute top-0 start-100 ms-1 fw-bold">
                              /100
                            </span>
                          </div>
                          <div className="text-muted small fw-medium mt-1">
                            Overall Compatibility
                          </div>
                        </div>

                        <div className="scores-list">
                          <EvaluationItem
                            label="Communication"
                            score={analysis.communication_skill}
                          />
                          <EvaluationItem label="Confidence" score={analysis.confidence} />
                          <EvaluationItem label="Cultural Fit" score={analysis.cultural_fit} />
                          <EvaluationItem
                            label="Profile Awareness"
                            score={analysis.profile_understanding}
                          />
                          <EvaluationItem
                            label="Tech Alignment"
                            score={analysis.tech_stack_alignment}
                          />
                          <EvaluationItem label="Salary Match" score={analysis.salary_alignment} />
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                </Row>

                <hr className="my-5 opacity-10" />

                <div className="decision-section">
                  <h6 className="text-center text-muted small text-uppercase fw-bold mb-4 letter-spacing-wide">
                    Strategic Decision
                  </h6>
                  {hr_decision === null ? (
                    <div className="d-flex gap-3 justify-content-center">
                      <Button
                        variant="success"
                        className="px-5 py-3 rounded-3 fw-bold shadow-sm flex-grow-1"
                        onClick={() => onMakeDecision(true)}
                        disabled={isLoading}
                      >
                        Approve for Next Stage
                      </Button>
                      <Button
                        variant="outline-danger"
                        className="px-5 py-3 rounded-3 fw-bold flex-grow-1"
                        onClick={() => onMakeDecision(false)}
                        disabled={isLoading}
                      >
                        Decline Candidate
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={`p-4 rounded-4 d-flex justify-content-between align-items-center border-0 shadow-sm ${hr_decision ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"}`}
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className={`rounded-circle p-2 me-3 ${hr_decision ? "bg-success text-white" : "bg-danger text-white"}`}
                        >
                          <i className={`bi bi-${hr_decision ? "check-lg" : "x-lg"} fs-5`}></i>
                        </div>
                        <div>
                          <small className="d-block opacity-75 fw-bold text-uppercase letter-spacing-wide">
                            Final Decision
                          </small>
                          <h5 className="mb-0 fw-bold">
                            {hr_decision ? "Advancing to Next Round" : "Candidate Rejected"}
                          </h5>
                        </div>
                      </div>
                      <Button
                        variant={hr_decision ? "outline-success" : "outline-danger"}
                        size="sm"
                        className="px-4 py-2 rounded-pill fw-bold bg-white"
                        onClick={() => onMakeDecision(!hr_decision)}
                        disabled={isLoading}
                      >
                        Re-evaluate
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {status === "failed" && (
              <div className="p-5 text-center bg-danger-subtle rounded-4">
                <div className="text-danger mb-3">
                  <i className="bi bi-exclamation-triangle-fill display-5"></i>
                </div>
                <h5 className="fw-bold text-danger mb-2">Analysis Interrupted</h5>
                <p className="text-danger-emphasis mb-4">
                  We encountered an issue while processing the recording. Please ensure the file is
                  valid and try again.
                </p>
                <Button
                  variant="danger"
                  className="px-5 rounded-pill fw-bold"
                  onClick={() => setSelectedFile(null)}
                >
                  Retry Upload
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default Stage1HRRound;

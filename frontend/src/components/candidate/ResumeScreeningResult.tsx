import { Row, Col, Badge, ListGroup } from "react-bootstrap";
import { Card, CardBody } from "@/components/shared";
import type { CandidateResponse } from "@/types/resume";

interface ResumeScreeningResultProps {
  candidate: CandidateResponse;
}

const ResumeScreeningResult = ({ candidate }: ResumeScreeningResultProps) => {
  const analysis = candidate.resume_analysis;

  if (!analysis) {
    return (
      <Card className="border-0 shadow-sm rounded-4">
        <CardBody className="p-5 text-center">
          <div className="mb-3 text-muted">
            <i className="bi bi-file-earmark-text display-4"></i>
          </div>
          <h5>No Resume Analysis Available</h5>
          <p className="text-muted">
            The resume for this candidate hasn't been analyzed yet or the analysis failed.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="resume-screening-result animate-fade-in">
      <Card className="mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="bg-white px-4 py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">Stage 0: Resume Screening Results</h5>
          <Badge
            bg={candidate.resume_score && candidate.resume_score >= 70 ? "success" : "warning"}
            className="rounded-pill px-3 py-2"
          >
            Match Score: {candidate.resume_score?.toFixed(1)}%
          </Badge>
        </div>
        <CardBody className="p-4">
          <Row className="g-4">
            <Col lg={12}>
              <div className="mb-4">
                <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-wide d-flex align-items-center">
                  <i className="bi bi-person-check me-2 text-primary"></i>
                  Experience Alignment
                </h6>
                <div className="p-3 bg-light rounded-3 border-0 text-dark leading-relaxed">
                  {analysis.experience_alignment}
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-wide d-flex align-items-center">
                  <i className="bi bi-hand-thumbs-up me-2 text-success"></i>
                  Strength Summary
                </h6>
                <div className="p-3 bg-light rounded-3 border-0 text-dark leading-relaxed">
                  {analysis.strength_summary}
                </div>
              </div>

              <div className="mb-4">
                <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-wide d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle me-2 text-warning"></i>
                  Skill Gap Analysis
                </h6>
                <div className="p-3 bg-light rounded-3 border-0 text-dark leading-relaxed">
                  {analysis.skill_gap_analysis}
                </div>
              </div>
            </Col>

            <Col md={6}>
              <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-wide">
                Missing Skills
              </h6>
              {analysis.missing_skills && analysis.missing_skills.length > 0 ? (
                <ListGroup variant="flush" className="rounded-3 border">
                  {analysis.missing_skills.map((skill, idx) => (
                    <ListGroup.Item
                      key={idx}
                      className="d-flex justify-content-between align-items-center py-2"
                    >
                      <span>{skill.name}</span>
                      <Badge bg="secondary" pill>
                        Importance: {skill.score}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted small italic">No critical skills missing.</p>
              )}
            </Col>

            <Col md={6}>
              <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-wide">
                Extraordinary Points
              </h6>
              {analysis.extraordinary_points && analysis.extraordinary_points.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {analysis.extraordinary_points.map((point, idx) => (
                    <Badge
                      key={idx}
                      bg="info"
                      className="bg-info-subtle text-info-emphasis border border-info-subtle px-3 py-2 rounded-pill"
                    >
                      {point}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted small italic">No extraordinary points noted.</p>
              )}
            </Col>
          </Row>

          <div className="mt-5 p-4 bg-primary-subtle rounded-4 border-0">
            <div className="d-flex align-items-center mb-2">
              <div
                className="bg-primary text-white rounded-circle p-2 me-3 d-flex align-items-center justify-content-center"
                style={{ width: "32px", height: "32px" }}
              >
                <i className="bi bi-info-circle-fill"></i>
              </div>
              <h6 className="text-primary fw-bold mb-0">Status Note</h6>
            </div>
            <p className="mb-0 text-primary-emphasis">
              Candidate passed the initial screening with a match score of{" "}
              <strong>{candidate.resume_score?.toFixed(1)}%</strong>.
              {/* {candidate.pass_fail ? " They have been moved forward in the hiring pipeline." : ""} */}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ResumeScreeningResult;

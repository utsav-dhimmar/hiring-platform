/**
 * Candidate Evaluation Page.
 * Dynamically manages all interview stages for a specific candidate based on job config.
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Breadcrumb, Row, Col, Nav, Badge } from "react-bootstrap";
import {
  PageHeader,
  Card,
  CardBody,
  ErrorDisplay,
  LoadingSpinner,
  Button,
} from "../../components/common";
import Stage1HRRound from "../../components/candidate/Stage1HRRound";
import { adminCandidateService, adminJobService } from "../../apis/admin/service";
import type { CandidateResponse } from "../../apis/types/resume";
import type { Job } from "../../apis/types/job";
import type { JobStageConfig, StageEvaluation, Stage1Info } from "../../apis/types/stage";

const CandidateEvaluationPage: React.FC = () => {
  const { jobId, candidateId } = useParams<{ jobId: string; candidateId: string }>();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<CandidateResponse | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [jobStages, setJobStages] = useState<JobStageConfig[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, StageEvaluation>>({});

  // Keep legacy state for now while we transition
  const [stage1, setStage1] = useState<Stage1Info | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("stage0");

  useEffect(() => {
    const fetchData = async () => {
      if (!jobId || !candidateId) return;

      try {
        setLoading(true);
        const [jobData, candidateData] = await Promise.all([
          adminJobService.getJobById(jobId),
          adminCandidateService
            .getCandidatesForJob(jobId)
            .then(
              (candidates: CandidateResponse[]) =>
                candidates.find((c: CandidateResponse) => c.id === candidateId) || null,
            ),
        ]);

        if (!jobData || !candidateData) {
          setError("Job or Candidate not found");
          return;
        }

        setJob(jobData);
        setCandidate(candidateData);

        // Try to fetch dynamic stages and evaluations
        try {
          // If API isn't ready, this will fail and we fallback to mock data
          const stages = await adminJobService.getJobStages(jobId);
          const evals = await adminCandidateService.getCandidateEvaluations(candidateId);

          setJobStages(stages.sort((a, b) => a.stage_order - b.stage_order));

          const evalMap: Record<string, StageEvaluation> = {};
          evals.forEach((e) => {
            evalMap[e.job_stage_config_id] = e;
          });
          setEvaluations(evalMap);

          if (stages.length > 0) {
            setActiveTab(stages[0].id);
          }
        } catch (apiError) {
          console.warn("Dynamic stages API not ready, using mock fallback");
          // Mock Dynamic Stages
          const mockStages: JobStageConfig[] = [
            {
              id: "config-1",
              job_id: jobId,
              template_id: "tpl-hr",
              stage_order: 1,
              config: null,
              is_mandatory: true,
              template: {
                id: "tpl-hr",
                name: "Stage 1: HR Screening Round",
                description: "HR screening call",
                default_config: null,
              },
            },
            {
              id: "config-2",
              job_id: jobId,
              template_id: "tpl-tech",
              stage_order: 2,
              config: null,
              is_mandatory: true,
              template: {
                id: "tpl-tech",
                name: "Stage 2: Technical Practical Round",
                description: "Technical practical round",
                default_config: null,
              },
            },
            {
              id: "config-3",
              job_id: jobId,
              template_id: "tpl-panel",
              stage_order: 3,
              config: null,
              is_mandatory: true,
              template: {
                id: "tpl-panel",
                name: "Stage 3: Technical + HR Panel",
                description: "Panel interview",
                default_config: null,
              },
            },
          ];

          setJobStages(mockStages);

          // Mock Eval for Stage 1
          const mockEval: StageEvaluation = {
            id: "eval-1",
            candidate_id: candidateId,
            job_stage_config_id: "config-1",
            status: "pending",
            analysis: null,
            decision: null,
            created_at: new Date().toISOString(),
          };
          setEvaluations({ "config-1": mockEval });

          // Mock legacy stage1
          setStage1({
            id: mockEval.id,
            candidate_id: candidateId,
            job_id: jobId,
            transcript_id: null,
            status: "pending",
            analysis: null,
            hr_decision: null,
            created_at: new Date().toISOString(),
            completed_at: null,
          });

          if (mockStages.length > 0) {
            setActiveTab(mockStages[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch evaluation data:", err);
        setError("Failed to load candidate evaluation data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, candidateId]);

  const handleUploadTranscript = async (file: File) => {
    console.log("Uploading transcript:", file.name);
    // Update legacy state
    setStage1((prev) =>
      prev ? { ...prev, status: "processing", transcript_id: "trans-123" } : null,
    );

    // Update dynamic state if it matches active tab
    if (activeTab === "config-1") {
      setEvaluations((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          status: "processing",
        },
      }));
    }

    // Simulate API delay
    setTimeout(() => {
      const mockAnalysis = {
        communication_skill: 8,
        confidence: 9,
        cultural_fit: 7,
        profile_understanding: 8,
        tech_stack_alignment: 6,
        salary_alignment: 9,
        overall_score: 78,
        response_summary:
          "The candidate demonstrated strong communication skills and confidence. They have a good understanding of the role but may need some training on our specific tech stack.",
        communication_evaluation:
          "Clear and articulate. Professional tone throughout the conversation.",
        recommendation: "Proceed to Stage 2 - Technical Practical Round.",
      };

      setStage1((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              analysis: mockAnalysis,
            }
          : null,
      );

      if (activeTab === "config-1") {
        setEvaluations((prev) => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            status: "completed",
            analysis: mockAnalysis,
          },
        }));
      }
    }, 3000);
  };

  const handleMakeDecision = async (decision: boolean) => {
    console.log("Making decision:", decision);
    setStage1((prev) => (prev ? { ...prev, hr_decision: decision } : null));
    if (activeTab === "config-1") {
      setEvaluations((prev) => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          decision: decision,
        },
      }));
    }
  };

  if (loading) return <LoadingSpinner fullPage />;
  if (error || !candidate || !job) {
    return (
      <Container className="py-5">
        <ErrorDisplay
          message={error || "Data not found"}
          onRetry={() => navigate(`/jobs/${jobId}`)}
          fullPage
        />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
          Jobs
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/jobs/${jobId}` }}>
          {job.title}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>
          Evaluation: {candidate.first_name} {candidate.last_name}
        </Breadcrumb.Item>
      </Breadcrumb>

      <PageHeader
        title={`${candidate.first_name} ${candidate.last_name}`}
        subtitle={`Evaluation for ${job.title}`}
        actions={
          <Button variant="outline-secondary" onClick={() => navigate(`/jobs/${jobId}`)}>
            Back to Candidates
          </Button>
        }
      />

      <Row>
        <Col lg={3}>
          <Card className="mb-4">
            <CardBody>
              <h6 className="text-muted small text-uppercase fw-bold mb-3">Interview Stages</h6>
              <Nav
                variant="pills"
                className="flex-column"
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || "stage0")}
              >
                <Nav.Item>
                  <Nav.Link eventKey="stage0" disabled>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Resume Screening</span>
                      <Badge bg="success">Pass</Badge>
                    </div>
                  </Nav.Link>
                </Nav.Item>

                {jobStages.map((stageConfig) => {
                  const evalData = evaluations[stageConfig.id];
                  const evalStatus = evalData?.status || "pending";
                  const decision = evalData?.decision;
                  // Handle legacy stage1 for mock fallback
                  const displayDecision =
                    stageConfig.id === "config-1" ? stage1?.hr_decision : decision;
                  const displayStatus = stageConfig.id === "config-1" ? stage1?.status : evalStatus;

                  return (
                    <Nav.Item key={stageConfig.id}>
                      <Nav.Link eventKey={stageConfig.id}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span>{stageConfig.template.name}</span>
                          {displayStatus === "completed" ? (
                            <Badge
                              bg={
                                displayDecision === null
                                  ? "warning"
                                  : displayDecision
                                    ? "success"
                                    : "danger"
                              }
                            >
                              {displayDecision === null
                                ? "Pending Decision"
                                : displayDecision
                                  ? "Passed"
                                  : "Rejected"}
                            </Badge>
                          ) : (
                            <Badge bg="secondary">Incomplete</Badge>
                          )}
                        </div>
                      </Nav.Link>
                    </Nav.Item>
                  );
                })}
              </Nav>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h6 className="text-muted small text-uppercase fw-bold mb-3">Candidate Info</h6>
              <p className="mb-1">
                <strong>Email:</strong> {candidate.email}
              </p>
              <p className="mb-1">
                <strong>Resume Score:</strong> {candidate.resume_score?.toFixed(1)}%
              </p>
              <p className="mb-0">
                <strong>Status:</strong> {candidate.current_status || "In Process"}
              </p>
            </CardBody>
          </Card>
        </Col>

        <Col lg={9}>
          {activeTab === "stage0" && (
            <div className="text-center py-5 bg-light rounded border">
              <h5>Resume Screening</h5>
              <p className="text-muted">Passed with score {candidate.resume_score?.toFixed(1)}%</p>
            </div>
          )}

          {jobStages
            .find((s) => s.id === activeTab)
            ?.template.name.toLowerCase()
            .includes("hr screening") && (
            <Stage1HRRound
              stageInfo={stage1}
              onUploadTranscript={handleUploadTranscript}
              onMakeDecision={handleMakeDecision}
            />
          )}

          {jobStages.find((s) => s.id === activeTab) &&
            !jobStages
              .find((s) => s.id === activeTab)
              ?.template.name.toLowerCase()
              .includes("hr screening") && (
              <div className="text-center py-5 bg-light rounded border">
                <h5>{jobStages.find((s) => s.id === activeTab)?.template.name}</h5>
                <p className="text-muted">
                  This interview stage template is dynamically loaded but the corresponding UI
                  component is not yet implemented.
                </p>
              </div>
            )}
        </Col>
      </Row>
    </Container>
  );
};

export default CandidateEvaluationPage;

/**
 * Candidate Evaluation Page.
 * Dynamically manages all interview stages for a specific candidate based on job config.
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Breadcrumb, Row, Col } from "react-bootstrap";
import {
  PageHeader,
  ErrorDisplay,
  LoadingSpinner,
  Button,
} from "../../components/common";
import Stage1HRRound from "../../components/candidate/Stage1HRRound";
import InterviewStageNav from "../../components/candidate/InterviewStageNav";
import CandidateInfoSidebar from "../../components/candidate/CandidateInfoSidebar";
import { adminCandidateService, adminJobService } from "../../apis/admin/service";
import type { CandidateResponse } from "../../apis/types/resume";
import type { Job } from "../../apis/types/job";
import type { JobStageConfig, StageEvaluation, Stage1Info } from "../../apis/types/stage";

import { extractErrorMessage } from "../../utils/error";

const CandidateEvaluationPage = () => {
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
        setError(null);
        const [jobData, candidateData] = await Promise.all([
          adminJobService.getJobById(jobId),
          adminCandidateService
            .getCandidatesForJob(jobId)
            .then(
              (result: { data: CandidateResponse[]; total: number }) =>
                result.data.find((c: CandidateResponse) => c.id === candidateId) || null,
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
          console.warn("Dynamic stages API not ready, using mock fallback", apiError);
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
        setError(extractErrorMessage(err, "Failed to load candidate evaluation data."));
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
      <div className="mb-4">
        <Breadcrumb className="bg-transparent p-0 mb-2">
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
            Jobs
          </Breadcrumb.Item>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: `/admin/jobs/${jobId}/candidates` }}>
            {job.title} Candidates
          </Breadcrumb.Item>
          <Breadcrumb.Item active className="text-muted fw-medium">
            Evaluation: {candidate.first_name} {candidate.last_name}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border border-light mb-4">
        <PageHeader
          title={`${candidate.first_name} ${candidate.last_name}`}
          subtitle={`Evaluation for ${job.title}`}
          className="mb-0 border-0 p-0"
          actions={
            <Button
              variant="outline-secondary"
              onClick={() => navigate(`/admin/jobs/${jobId}/candidates`)}
            >
              Back to Candidates
            </Button>
          }
        />
      </div>

      <Row className="g-4">
        <Col lg={4} xl={3}>
          <InterviewStageNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            jobStages={jobStages}
            evaluations={evaluations}
            stage1={stage1}
          />

          <CandidateInfoSidebar candidate={candidate} />
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

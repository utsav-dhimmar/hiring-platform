/**
 * Candidate Evaluation Page.
 * Dynamically manages all interview stages for a specific candidate based on job config.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Breadcrumb, Row, Col } from "react-bootstrap";
import {
  PageHeader,
  ErrorDisplay,
  LoadingSpinner,
  Button,
} from "../../components/common";
import Stage1HRRound from "../../components/candidate/Stage1HRRound";
import ResumeScreeningResult from "../../components/candidate/ResumeScreeningResult";
import InterviewStageNav from "../../components/candidate/InterviewStageNav";
import CandidateInfoSidebar from "../../components/candidate/CandidateInfoSidebar";
import {
  adminCandidateService,
  adminJobService,
} from "../../apis/admin/service";
import { interviewService } from "../../apis/services/interview";
import { transcriptService } from "../../apis/services/transcript";
import { evaluationService } from "../../apis/services/evaluation";
import type { CandidateResponse } from "../../apis/types/resume";
import type { Job } from "../../apis/types/job";
import type {
  JobStageConfig,
  StageEvaluation,
  Stage1Info,
} from "../../apis/types/stage";

import { extractErrorMessage } from "../../utils/error";

const CandidateEvaluationPage = () => {
  const { jobId, candidateId } = useParams<{
    jobId: string;
    candidateId: string;
  }>();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<CandidateResponse | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [jobStages, setJobStages] = useState<JobStageConfig[]>([]);
  const [evaluations, setEvaluations] = useState<
    Record<string, StageEvaluation>
  >({});

  // Keep legacy state for now while we transition
  const [stage1, setStage1] = useState<Stage1Info | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [fetchingStage, setFetchingStage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("stage0");

  const fetchStageData = useCallback(
    async (tabId: string) => {
      if (!candidateId || tabId === "stage0" || loading) return;

      try {
        setFetchingStage(true);
        const stageEval = await adminCandidateService.getStageEvaluation(
          candidateId,
          tabId,
        );

        setEvaluations((prev) => ({
          ...prev,
          [tabId]: stageEval,
        }));

        // If it's the HR Screening stage, update legacy stage1 state too
        const currentStage = jobStages.find((s) => s.id === tabId);
        if (
          currentStage?.template.name.toLowerCase().includes("hr screening")
        ) {
          setStage1({
            id: stageEval.id,
            candidate_id: candidateId,
            job_id: jobId || "",
            transcript_id: null,
            status: stageEval.status as any,
            analysis: stageEval.analysis as any,
            hr_decision: stageEval.decision,
            created_at: stageEval.created_at,
            completed_at: stageEval.completed_at,
          });
        }
      } catch (err) {
        console.error(`Failed to fetch evaluation for stage ${tabId}:`, err);
      } finally {
        setFetchingStage(false);
      }
    },
    [candidateId, loading, jobStages, jobId],
  );

  useEffect(() => {
    fetchStageData(activeTab);
  }, [activeTab, fetchStageData]);

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
                result.data.find(
                  (c: CandidateResponse) => c.id === candidateId,
                ) || null,
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
          const stages = await adminJobService.getJobStages(jobId);
          const evals =
            await adminCandidateService.getCandidateEvaluations(candidateId);
          const interviews =
            await interviewService.getInterviewsForCandidate(candidateId);
          const interview = interviews.interviews.find(
            (i) => i.job_id === jobId,
          );
          if (interview) {
            setInterviewId(interview.id);
          }

          setJobStages(stages.sort((a, b) => a.stage_order - b.stage_order));

          const evalMap: Record<string, StageEvaluation> = {};
          evals.forEach((e) => {
            evalMap[e.job_stage_config_id] = e;
          });
          setEvaluations(evalMap);

          // Find the HR Screening stage
          const hrStage = stages.find((s) =>
            s.template.name.toLowerCase().includes("hr screening"),
          );
          if (hrStage) {
            const hrEval = evalMap[hrStage.id];
            setStage1({
              id: hrEval?.id || "new-stage1",
              candidate_id: candidateId,
              job_id: jobId,
              transcript_id: null,
              status: hrEval?.status || "pending",
              analysis: hrEval?.analysis || null,
              hr_decision: hrEval?.decision || null,
              created_at: hrEval?.created_at || new Date().toISOString(),
              completed_at: hrEval?.completed_at || null,
            });
          }

          if (stages.length > 0) {
            setActiveTab(stages[0].id);
          }
        } catch (apiError) {
          console.warn(
            "Dynamic stages API not ready, using mock fallback",
            apiError,
          );
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
        setError(
          extractErrorMessage(err, "Failed to load candidate evaluation data."),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, candidateId]);

  const initiateInterview = async () => {
    if (!candidateId || !jobId) return null;
    try {
      setLoading(true);
      const newInterview = await interviewService.createInterview({
        candidate_id: candidateId,
        job_id: jobId,
      });
      return newInterview;
    } catch (err) {
      console.error("Failed to initiate interview:", err);
      setError(extractErrorMessage(err, "Failed to start interview session."));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUploadTranscript = async (file: File) => {
    if (!candidateId || !jobId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Get or find an interview session
      const interviewsRes =
        await interviewService.getInterviewsForCandidate(candidateId);
      let interview = interviewsRes.interviews.find((i) => i.job_id === jobId);

      // 1b. Create interview if it doesn't exist
      if (!interview) {
        interview = (await initiateInterview()) || undefined;
      }

      if (!interview) {
        throw new Error("Could not find or create an interview session.");
      }

      setInterviewId(interview.id);

      // 2. Upload transcript
      const uploadRes = await transcriptService.uploadTranscript(
        interview.id,
        file,
      );
      const transcriptId = uploadRes.transcript_id;

      setStage1((prev) =>
        prev
          ? { ...prev, status: "processing", transcript_id: transcriptId }
          : null,
      );

      // 3. Poll for status
      let statusRes = await transcriptService.getTranscriptStatus(
        interview.id,
        transcriptId,
      );
      let attempts = 0;
      const maxAttempts = 30; // 60 seconds max

      while (
        (statusRes.status === "processing" ||
          statusRes.status === "uploaded") &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        statusRes = await transcriptService.getTranscriptStatus(
          interview.id,
          transcriptId,
        );
        attempts++;
      }

      if (statusRes.status === "failed") {
        throw new Error(statusRes.error || "Transcript processing failed");
      }

      if (statusRes.status !== "completed") {
        throw new Error(
          "Transcript processing timed out. Please try refreshing.",
        );
      }

      // 4. Trigger Stage 1 LLM evaluation
      const evaluation = await evaluationService.runEvaluation(
        interview.id,
        transcriptId,
      );

      setStage1((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              analysis: evaluation as any,
            }
          : null,
      );

      // Update evaluations map for dynamic stages as well
      if (activeTab === "config-1" || activeTab === "eval-1") {
        setEvaluations((prev) => ({
          ...prev,
          [activeTab]: {
            ...prev[activeTab],
            status: "completed",
            analysis: evaluation as any,
          },
        }));
      }
    } catch (err) {
      console.error("Evaluation failed:", err);
      setError(extractErrorMessage(err, "Failed to evaluate transcript."));
      setStage1((prev) => (prev ? { ...prev, status: "failed" } : null));
    } finally {
      setLoading(false);
    }
  };

  const handleMakeDecision = async (decision: boolean) => {
    if (!interviewId) {
      setError("No active interview session found to record decision.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call API to record decision
      await interviewService.updateDecision(interviewId, {
        decision: decision ? "proceed" : "reject",
        notes: `HR Decision: ${decision ? "Approved" : "Rejected"} through Evaluation Page`,
      });

      // Update local state on success
      setStage1((prev) => (prev ? { ...prev, hr_decision: decision } : null));

      // Update dynamic evaluations map
      const currentStage = jobStages.find((s) => s.id === activeTab);
      if (currentStage) {
        setEvaluations((prev) => ({
          ...prev,
          [currentStage.id]: {
            ...prev[currentStage.id],
            decision: decision,
          },
        }));
      }

      console.log("Decision recorded successfully:", decision);

      // Fetch latest stage data to ensure state is synced with server
      await fetchStageData(activeTab);
    } catch (err) {
      console.error("Failed to record decision:", err);
      setError(
        extractErrorMessage(
          err,
          "Failed to record your decision. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
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
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/admin/jobs" }}>
            Jobs
          </Breadcrumb.Item>
          <Breadcrumb.Item
            linkAs={Link}
            linkProps={{ to: `/admin/jobs/${jobId}/candidates` }}
          >
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
            <ResumeScreeningResult candidate={candidate} />
          )}

          {jobStages
            .find((s) => s.id === activeTab)
            ?.template.name.toLowerCase()
            .includes("hr screening") && (
            <Stage1HRRound
              stageInfo={stage1}
              onUploadTranscript={handleUploadTranscript}
              onMakeDecision={handleMakeDecision}
              isLoading={loading}
            />
          )}

          {jobStages.find((s) => s.id === activeTab) &&
            !jobStages
              .find((s) => s.id === activeTab)
              ?.template.name.toLowerCase()
              .includes("hr screening") && (
              <div className="text-center py-5 bg-light rounded border">
                <h5>
                  {jobStages.find((s) => s.id === activeTab)?.template.name}
                </h5>
                <p className="text-muted">
                  This interview stage template is dynamically loaded but the
                  corresponding UI component is not yet implemented.
                </p>
              </div>
            )}
        </Col>
      </Row>
    </Container>
  );
};

export default CandidateEvaluationPage;

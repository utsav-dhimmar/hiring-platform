import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { StageControls } from "@/components/candidate/StageControls";
import { EvaluationGrid } from "@/components/candidate/EvaluationGrid";
import { StageOverallSummary } from "@/components/candidate/StageOverallSummary";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import AppPageShell from "@/components/shared/AppPageShell";
import { ActionButtons } from "@/components/modal/candidate-details/ActionButtons";
import { FeedbackDialog } from "@/components/modal/candidate-details/FeedbackDialog";
import { candidateDecisionSchema, type CandidateDecisionFormValues } from "@/schemas/candidate";
import { candidateDecisionApi, type HrDecisionHistoryItem } from "@/apis/candidateDecision";
import { extractErrorMessage } from "@/utils/error";
import type { Job } from "@/types/job";
import type { CandidateAnalysis } from "@/types/admin";
import { StageCandidatesHeader } from "@/components/candidate/StageCandidatesHeader";
import { JobInfoModal } from "@/components/modal";
import jobService from "@/apis/job";
import { Button } from "@/components/ui/button";
import { candidateStageService } from "@/apis/candidateStage";
import { transcriptService } from "@/apis/transcript";
import { Loader2, FileText } from "lucide-react";
import type { EvaluationRead } from "@/types/candidateStage";
import type { Transcript } from "@/types/transcript";
import { CandidateHistoryGrid } from "@/components/candidate/CandidateHistoryGrid";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { PERMISSIONS } from "@/lib/permissions";
import { slugify } from "@/utils/slug";



export default function CandidatesStages() {
  const { candidateName: candidateNameParam } = useParams<{ jobSlug: string; candidateName: string }>();

  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state.job as Job;
  const candidate = location.state.candidate as CandidateAnalysis;

  const getInitialStage = () => {
    if (candidate?.current_stage?.template_name) {
      return candidate.current_stage.template_name;
    }
    return "";
  };

  const [stages, setStages] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState(getInitialStage());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationRead | null>(null);
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<Transcript[]>([]);
  const [hrDecisionHistory, setHrDecisionHistory] = useState<HrDecisionHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const fetchStages = async () => {
      if (!job?.id) return;

      setIsLoadingStages(true);
      try {
        const stats = await jobService.getJobStats(job.id);
        const stageNames = Object.keys(stats.stages);
        setStages(stageNames);

        // If no current stage was set from candidate, set it to the first stage
        if (!currentStage && stageNames.length > 0) {
          setCurrentStage(stageNames[0]);
        }
      } catch (error) {
        console.error("Failed to fetch stages:", error);
        toast.error("Failed to load interview stages");
      } finally {
        setIsLoadingStages(false);
      }
    };

    fetchStages();
  }, [job?.id]);

  const stageId = candidate.pipeline?.find((s) => s.template_name === currentStage)?.stage_id;

  const fetchEvaluation = async (showLoading = true) => {
    if (!stageId) {
      setEvaluation(null);
      return;
    }

    if (showLoading) setIsLoadingEvaluation(true);
    try {
      const data = await candidateStageService.getEvaluation(stageId);
      setEvaluation(data);
      setError("");

      // If we were polling and finally got data, stop polling
      if (isPolling && data) {
        setIsPolling(false);
        toast.success("Evaluation generated successfully!");
        fetchHistory(); // Refresh history to show the new transcript
      }
    } catch (error) {
      const errorMessage = extractErrorMessage(error);

      // If polling, we expect 404s or other errors until the evaluation is ready
      if (!isPolling) {
        console.error("Failed to fetch evaluation:", errorMessage);
        setError(errorMessage);
        setEvaluation(null);
      }
    } finally {
      if (showLoading) setIsLoadingEvaluation(false);
    }
  };

  useEffect(() => {
    fetchEvaluation();
    // Reset polling if stage changes
    setIsPolling(false);
  }, [stageId]);

  // Polling Effect
  useEffect(() => {
    let interval: number;
    if (isPolling && stageId) {
      interval = setInterval(() => {
        fetchEvaluation(false); // Poll without global loading state
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPolling, stageId]);

  const fetchHistory = async () => {
    if (!candidate?.id) return;
    try {
      const history = await transcriptService.getCandidateTranscripts(candidate.id);
      setTranscriptHistory(history);
    } catch (error) {
      console.error("Failed to fetch transcript history:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [candidate?.id]);

  const fetchHrDecisionHistory = async () => {
    if (!candidate?.id) return;
    try {
      const response = await candidateDecisionApi.getDecisionHistory(candidate.id, job?.id);
      setHrDecisionHistory(response.decisions);
    } catch (error) {
      console.error("Failed to fetch HR decision history:", error);
    }
  };

  useEffect(() => {
    fetchHrDecisionHistory();
  }, [candidate?.id, job?.id]);

  const form = useForm<CandidateDecisionFormValues>({
    resolver: zodResolver(candidateDecisionSchema),
    defaultValues: {
      note: "",
    },
  });

  const handleAction = (type: "approve" | "reject" | "maybe") => {
    form.reset({
      decision: type,
      note: form.watch("note"),
    });
    form.clearErrors();
    setShowFeedbackModal(true);
  };

  const submitFeedback = async (data: CandidateDecisionFormValues) => {
    if (!candidate?.id) {
      toast.error("Candidate information missing");
      return;
    }

    setIsSubmitting(true);
    try {
      await candidateDecisionApi.submitDecision({
        candidate_id: candidate.id,
        decision: data.decision,
        note: data.note,
      });
      toast.success("Decision submitted successfully");
      setShowFeedbackModal(false);
      fetchHrDecisionHistory();
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage || "Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ensure names are formatted for display
  const candidateName = candidate ? `${candidate.first_name} ${candidate.last_name}` : candidateNameParam || "Candidate";

  const transformedOverall = evaluation ? {
    stage_score: evaluation.overall_score || 0,
    recommendation: evaluation.recommendation || "N/A",
    overall_summary: evaluation.evaluation_data?.overall_summary || "No summary available.",
    strength_summary: evaluation.evaluation_data?.strengths || "N/A",
    weakness_summary: evaluation.evaluation_data?.weaknesses || "N/A",
    followups: evaluation.evaluation_data?.suggested_followups || [],
    percentage: Math.round((evaluation.overall_score || 0) * 20)
  } : null;

  // TEMP: for large evaluation_data data may cause slow down
  const evaluation_data = {
    communication: evaluation?.evaluation_data.communication,
    confidence: evaluation?.evaluation_data.confidence,
    cultural_fit: evaluation?.evaluation_data.cultural_fit,
    profile_understanding: evaluation?.evaluation_data.profile_understanding,
    salary_alignment: evaluation?.evaluation_data.salary_alignment,
    tech_stack: evaluation?.evaluation_data.tech_stack,
  }

  const latestDecision = hrDecisionHistory[0];
  const canTakeDecision = !latestDecision || latestDecision.decision.toLowerCase() === "may be";

  return (
    <AppPageShell width="full" className="p-0 overflow-hidden bg-background">
      <StageCandidatesHeader
        job={job}
        onBack={() => navigate(-1)}
        onInfoClick={() => setIsJobModalOpen(true)}

      />
      <div className="flex overflow-hidden">

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* Header */}
          <StageControls
            stages={stages}
            currentStage={currentStage}
            onStageChange={setCurrentStage}
            isLoadingStages={isLoadingStages}
            stageId={stageId}
            job={job}
            isUploaded={!!evaluation || isPolling}
            onSuccess={() => {
              setIsPolling(true);
              fetchHistory();
            }}
          />

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pt-2 space-y-2 ">
            {isLoadingEvaluation ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-bold">Fetching evaluation data...</p>
              </div>
            ) : isPolling ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-black uppercase tracking-tight">AI Analysis in Progress</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    We're analyzing the transcript and generating insights. This usually takes 30-60 seconds.
                  </p>
                </div>
              </div>
            ) : evaluation ? (
              <>
                <EvaluationGrid
                  data={evaluation_data}
                />

                <div className="mx-auto space-y-2 ">
                  {/* Section 1: Overall Summary */}
                  {transformedOverall && <StageOverallSummary data={transformedOverall} />}

                  {/* Section 2: Histories Grid */}
                  <CandidateHistoryGrid
                    hrDecisionHistory={hrDecisionHistory}
                    transcriptHistory={transcriptHistory}
                    onTranscriptClick={(id) => navigate(`/dashboard/transcripts/${slugify(candidateName)}`, {
                      state: { transcriptId: id, candidateName }
                    })}
                  />

                  {/* Section 3: Full Transcript Button */}
                  {evaluation.transcript_id && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="lg"
                        className="rounded-xl border-primary/20 hover:bg-primary/5 flex items-center gap-2 font-bold h-12 px-8"
                        onClick={() => navigate(`/dashboard/transcripts/${slugify(candidateName)}`, {
                          state: { transcriptId: evaluation.transcript_id, candidateName }
                        })}
                      >
                        <FileText className="h-4 w-4" />
                        View Full Interview Transcript
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">No Evaluation Data</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    {error ? error : "Upload a transcript to generate an AI evaluation for this stage."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          {!error && canTakeDecision && (
            <PermissionGuard permissions={PERMISSIONS.CANDIDATES_DECIDE} hideWhenDenied>
              <ActionButtons
                onAction={handleAction}
                showMaybeButton={!latestDecision || latestDecision.decision.toLowerCase() !== "may be"}
              />
            </PermissionGuard>
          )}
        </div>
      </div>

      <FeedbackDialog
        isOpen={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        form={form}
        onSubmit={submitFeedback}
        candidateName={candidateName}
        isSubmitting={isSubmitting}
      />
      <JobInfoModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        job={job}
      />
    </AppPageShell>
  );
}
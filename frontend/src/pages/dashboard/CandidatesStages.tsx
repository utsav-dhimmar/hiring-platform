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
import { DecisionHistory } from "@/components/modal/candidate-details/DecisionHistory";
import jobService from "@/apis/job";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_EVALUATION_DATA } from "@/constants/admin";

/**
 * Page for evaluating a specific candidate at a specific interview stage.
 * Displays evaluation grid, overall summary, and decision buttons (approve/reject/maybe).
 */
const MOCK_OVERALL = {
  stage_score: 4.5,
  recommendation: "Strongly Recommend",
  overall_summary: "An exceptional candidate with strong technical foundations and great communication skills. Highly recommended for the next stage.",
  strength_summary: "React architecture, Team leadership, API design.",
  weakness_summary: "Limited experience with server-side Golang (though happy to learn).",
  followups: ["Ask about their experience with micro-frontends.", "Discuss their leadership style further."],
  percentage: 92
};

const HR_DECISION_HISTORY: HrDecisionHistoryItem[] = [{ id: "1", decision: "approve", notes: "Good candidate", decided_at: new Date().toISOString(), candidate_id: "1", stage_config_id: "1", user_id: "0" }, { id: "2", decision: "reject", notes: "Good candidate", decided_at: new Date().toISOString(), candidate_id: "1", stage_config_id: "1", user_id: "0" }]

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
    } catch (error) {
      const errorMessage = extractErrorMessage(error);
      toast.error(errorMessage || "Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stageId = candidate.pipeline?.find((s) => s.template_name === currentStage)?.stage_id;

  // Ensure names are formatted for display
  const candidateName = candidate ? `${candidate.first_name} ${candidate.last_name}` : candidateNameParam || "Candidate";

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
          />

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto pt-2 space-y-12 pb-32">
            <EvaluationGrid data={MOCK_EVALUATION_DATA} />

            {/* Overall Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <StageOverallSummary data={MOCK_OVERALL} />
              </div>

              <div className="space-y-6">
                <Card className="border border-primary/5 rounded-3xl h-full shadow-lg bg-muted/20">
                  <CardContent className="p-1 flex flex-col min-h-[200px]">
                    <DecisionHistory decisions={HR_DECISION_HISTORY} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Footer Action Bar */}
          <ActionButtons onAction={handleAction} showMaybeButton={true} />
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
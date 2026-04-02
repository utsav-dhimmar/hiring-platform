import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { CandidateResponse } from "@/types/resume";
import type { ResumeScreeningResult } from "@/types/admin";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { resumeScreeningApi } from "@/apis/resumeScreening";
import type { ResumeScreeningDecision } from "@/apis/resumeScreening";
import { adminJobService } from "@/apis/admin/job";
import type { Job, JobVersionDetail } from "@/types/job";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  candidateDecisionSchema,
  type CandidateDecisionFormValues,
} from "@/schemas/candidate";

// Sub-components
import { CandidateHeader } from "@/components/modal/candidate-details/CandidateHeader";
import { AnalysisStats } from "@/components/modal/candidate-details/AnalysisStats";
import { AnalysisTabs } from "@/components/modal/candidate-details/AnalysisTabs";
import { AnalysisContent } from "@/components/modal/candidate-details/AnalysisContent";
import { JobDescriptionView } from "@/components/modal/candidate-details/JobDescriptionView";
import { ScreeningDecision } from "@/components/modal/candidate-details/ScreeningDecision";
import { FeedbackDialog } from "@/components/modal/candidate-details/FeedbackDialog";
import { ActionButtons } from "@/components/modal/candidate-details/ActionButtons";

/**
 * Props for {@link CandidateDetailsModal}.
 */
interface CandidateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateResponse | ResumeScreeningResult | null;
  jobId?: string;
}

/**
 * Modal dialog that displays a full candidate profile including resume analysis,
 * missing skills, extraordinary points, and the job description version used for screening.
 *
 * Allows HR users to approve, reject, or mark a candidate as "maybe" by submitting
 * a screening decision with an optional note. The modal fetches the associated job
 * and its version data on open, and refreshes the screening decision after submission.
 */
export function CandidateDetailsModal({
  isOpen,
  onClose,
  candidate,
  jobId,
}: CandidateDetailsModalProps) {
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [screeningDecision, setScreeningDecision] =
    useState<ResumeScreeningDecision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [selectedVersionData, setSelectedVersionData] =
    useState<JobVersionDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "jd">("analysis");
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);

  const form = useForm<CandidateDecisionFormValues>({
    resolver: zodResolver(candidateDecisionSchema),
    defaultValues: {
      note: "",
    },
  });

  const { reset } = form;

  useEffect(() => {
    const targetJobId = jobId || (candidate as any)?.applied_job_id;
    if (isOpen && targetJobId) {
      adminJobService.getJobById(targetJobId).then((data) => {
        setJob(data as unknown as Job);
      });
    }
  }, [isOpen, jobId, (candidate as any)?.applied_job_id]);

  useEffect(() => {
    // If candidate has an applied version, fetch it
    const appliedVersion = (candidate as any)?.applied_version_number;
    if (isOpen && appliedVersion && job?.job_versions) {
      const versionMeta = job.job_versions.find(
        (v) => v.version_num === appliedVersion,
      );
      if (versionMeta) {
        setIsLoadingVersion(true);
        adminJobService
          .getJobVersion(versionMeta.id)
          .then((data) => setSelectedVersionData(data))
          .finally(() => setIsLoadingVersion(false));
      }
    }
  }, [isOpen, job?.job_versions, (candidate as any)?.applied_version_number]);

  useEffect(() => {
    if (isOpen && candidate?.id) {
      resumeScreeningApi.getDecision(candidate.id).then((data) => {
        setScreeningDecision(data);
      });
    }
  }, [isOpen, candidate?.id]);

  if (!candidate) return null;

  const canTakeDecision =
    !screeningDecision || screeningDecision.decision === "maybe";

  const handleAction = (type: "approve" | "reject" | "maybe") => {
    reset({
      decision: type,
      note: "",
    });
    setShowFeedbackModal(true);
  };

  const submitFeedback = async (data: CandidateDecisionFormValues) => {
    if (!candidate?.id) return;

    setIsSubmitting(true);
    try {
      const result = await resumeScreeningApi.submitDecision({
        candidate_id: candidate.id,
        decision: data.decision,
        note: data.note,
      });
      setScreeningDecision(result);
      toast.success("Decision submitted successfully");
      setShowFeedbackModal(false);
    } catch (error) {
      toast.error("Failed to submit decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVersionChange = (val: string | null) => {
    if (!val) return;
    setIsLoadingVersion(true);
    adminJobService
      .getJobVersion(val)
      .then((data) => setSelectedVersionData(data))
      .finally(() => setIsLoadingVersion(false));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90%] lg:max-w-[1000px] max-h-screen p-0 overflow-hidden rounded-3xl border-muted-foreground/10 bg-card/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="pt-8 px-6 pb-4">
          <CandidateHeader candidate={candidate} />
        </DialogHeader>

        <div className="px-6 py-3 border-y border-muted-foreground/10 bg-muted/20 flex flex-wrap gap-4 items-center justify-between">
          <AnalysisStats candidate={candidate} />

          <div className="flex items-center gap-3">
            <Separator
              orientation="vertical"
              className="h-10 bg-muted-foreground/10"
            />
            <AnalysisTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>

        <div className="flex-1 p-3 max-h-[calc(90vh-240px)] overflow-y-auto">
          {activeTab === "analysis" ? (
            <AnalysisContent
              candidate={candidate}
              showAllSkills={showAllSkills}
              setShowAllSkills={setShowAllSkills}
            >
              {screeningDecision && (
                <ScreeningDecision decision={screeningDecision} />
              )}
            </AnalysisContent>
          ) : (
            <JobDescriptionView
              job={job}
              selectedVersionData={selectedVersionData}
              isLoadingVersion={isLoadingVersion}
              onVersionChange={handleVersionChange}
              appliedVersionNumber={
                (candidate as ResumeScreeningResult)?.applied_version_number ??
                undefined
              }
            />
          )}
        </div>

        {canTakeDecision && (
          <ActionButtons
            onAction={handleAction}
            showMaybeButton={
              !screeningDecision || screeningDecision.decision !== "maybe"
            }
          />
        )}
      </DialogContent>

      <FeedbackDialog
        isOpen={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        form={form}
        onSubmit={submitFeedback}
        candidateName={candidate.first_name || "candidate"}
        isSubmitting={isSubmitting}
      />
    </Dialog>
  );
}

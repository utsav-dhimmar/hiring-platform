import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { CandidateResponse } from "@/types/resume";
import type { ResumeScreeningResult } from "@/types/admin";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { resumeScreeningApi } from "@/apis/resumeScreening";
import type { ResumeScreeningDecision } from "@/apis/resumeScreening";
import { Card } from "../ui/card";
import { adminJobService } from "@/apis/admin/job";
import type { Job, JobVersionDetail } from "@/types/job";
import { FileText, History } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Props for CandidateDetailsModal.
 * Accepts either CandidateResponse (from resume.ts) or ResumeScreeningResult (from admin.ts).
 */
interface CandidateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateResponse | ResumeScreeningResult | null;
  jobId?: string;
}

export function CandidateDetailsModal({
  isOpen,
  onClose,
  candidate,
  jobId,
}: CandidateDetailsModalProps) {
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<
    "approve" | "reject" | "maybe" | null
  >(null);
  const [reason, setReason] = useState("");
  const [screeningDecision, setScreeningDecision] =
    useState<ResumeScreeningDecision | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [selectedVersionData, setSelectedVersionData] =
    useState<JobVersionDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "jd">("analysis");
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);

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

  // The analysis structure is very similar between both types
  const analysis = candidate.resume_analysis;
  const isPassed = candidate.pass_fail && (candidate.resume_score ?? 0) >= 65;
  const canTakeDecision =
    !screeningDecision || screeningDecision.decision === "maybe";

  const handleAction = (type: "approve" | "reject" | "maybe") => {
    setFeedbackType(type);
    setReason("");
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (!candidate?.id || !feedbackType) return;

    setIsSubmitting(true);
    try {
      const result = await resumeScreeningApi.submitDecision({
        candidate_id: candidate.id,
        decision: feedbackType,
        note: reason,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90%] lg:max-w-[1000px] max-h-screen p-0 overflow-hidden rounded-3xl border-muted-foreground/10 bg-card/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="pt-8 px-6 pb-4">
          <DialogTitle className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <User className="h-6 w-6" />
            </div>

            <div className="flex flex-col text-left gap-1">
              <span className="text-[10px] uppercase font-black tracking-[0.2em] ">
                Candidate Profile
              </span>
              <span className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                {candidate.first_name}{" "}
                <span className="text-primary">{candidate.last_name}</span>
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-3 border-y border-muted-foreground/10 bg-muted/20 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold uppercase whitespace-nowrap">
                  Match Percentage
                </span>
                <span className="text-sm font-black text-blue-600 leading-none">
                  {analysis?.match_percentage || 0}%
                </span>
              </div>

              <div className="w-px h-4 bg-muted-foreground/10" />

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold uppercase whitespace-nowrap">
                  Pass / Fail
                </span>
                <Badge
                  variant={isPassed ? "default" : "destructive"}
                  className={`rounded-full px-3 py-1 flex items-center gap-2 w-fit border-0 shadow-none ${isPassed ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}
                >
                  {isPassed ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span className="font-extrabold text-[10px] tracking-wider">
                        PASSED
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5" />
                      <span className="font-extrabold text-[10px] tracking-wider">
                        FAILED
                      </span>
                    </>
                  )}
                </Badge>

              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-bold uppercase whitespace-nowrap">
                Analysis Version
              </span>
              <span className="text-sm font-black text-purple-600 leading-none">
                V{(candidate as any)?.applied_version_number || "N/A"}
              </span>
            </div>
            <Separator
              orientation="vertical"
              className="h-10 bg-muted-foreground/10"
            />

            {/* Tab Switched */}
            <div className="flex bg-background/50 rounded-xl p-1 gap-1 border border-muted-foreground/5">
              <Button
                variant={activeTab === "analysis" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-lg h-8 text-[10px] font-black uppercase tracking-wider"
                onClick={() => setActiveTab("analysis")}
              >
                Analysis
              </Button>
              <Button
                variant={activeTab === "jd" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-lg h-8 text-[10px] font-black uppercase tracking-wider"
                onClick={() => setActiveTab("jd")}
              >
                JD Version
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "jd" && job?.job_versions && (
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={selectedVersionData?.id || ""}
                  onValueChange={(val) => {
                    if (!val) return;
                    setIsLoadingVersion(true);
                    adminJobService
                      .getJobVersion(val)
                      .then((data) => setSelectedVersionData(data))
                      .finally(() => setIsLoadingVersion(false));
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 bg-background border-muted-foreground/20 rounded-xl text-xs font-bold">
                    <SelectValue placeholder="Select Version" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-muted-foreground/10">
                    {job.job_versions.map((ver) => (
                      <SelectItem
                        key={ver.id}
                        value={ver.id}
                        className="text-xs font-medium rounded-lg"
                      >
                        Version {ver.version_num}
                        {ver.version_num ===
                          (candidate as any)?.applied_version_number && (
                            <span className="ml-2 text-[8px] text-primary italic font-black">
                              (Applied)
                            </span>
                          )}
                        {ver.version_num === job.version && (
                          <span className="ml-2 text-[8px] text-green-600 italic font-black">
                            (Latest)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-3 max-h-[calc(90vh-240px)] overflow-y-auto">
          {activeTab === "analysis" ? (
            <div className="space-y-3 pb-4">
              {/* Summary Sections */}
              <div className="grid grid-cols-1 gap-3">
                <section className="space-y-2">
                  <Card className="text-muted-foreground text-base leading-relaxed px-2">
                    <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-foreground">
                      {/* <div className="h-1 w-6 bg-primary rounded-full" /> */}
                      Strength Summary
                    </h3>
                    {analysis?.strength_summary || "No summary available."}
                  </Card>
                </section>

                <section className="space-y-2">
                  <Card className="text-muted-foreground text-base leading-relaxed px-2">
                    <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-foreground">
                      {/* <div className="h-1 w-6 bg-blue-500 rounded-full" /> */}
                      Experience Alignment
                    </h3>
                    {analysis?.experience_alignment ||
                      "No alignment details available."}
                  </Card>
                </section>
              </div>
              {/* Screening Decision Section */}
              {screeningDecision && (
                <section className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      HR Screening Decision
                    </h3>
                    <Badge
                      variant={
                        screeningDecision.decision === "approve"
                          ? "default"
                          : screeningDecision.decision === "reject"
                            ? "destructive"
                            : "secondary"
                      }
                      className="rounded-full px-3 py-0.5 text-[10px] font-black uppercase"
                    >
                      {screeningDecision.decision}
                    </Badge>
                  </div>
                  {screeningDecision.note ? (
                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                      &ldquo;{screeningDecision.note}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No note provided.
                    </p>
                  )}
                  <div className="text-[10px]  font-medium">
                    Decided on{" "}
                    {new Date(
                      screeningDecision.created_at,
                    ).toLocaleDateString()}
                  </div>
                </section>
              )}

              {/* Skills & Extraordinary Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                <section className="space-y-4">
                  <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-foreground">
                    <AlertCircle className="h-5 w-5 text-red-500/80" />
                    Missing Skills
                  </h3>

                  <div className="space-y-3">
                    {analysis?.missing_skills &&
                      analysis.missing_skills.length > 0 ? (
                      <>
                        {(showAllSkills
                          ? analysis.missing_skills
                          : analysis.missing_skills.slice(0, 4)
                        ).map((skill, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-2xl bg-red-500/5 border border-red-500/10 group hover:bg-red-500/10 transition-colors"
                          >
                            <span className="text-sm font-bold text-red-600/80">
                              {skill.name}
                            </span>
                            {/* <span className="text-xs font-black text-red-400">
                            {skill.score.toFixed(0)}% Gap
                          </span> */}
                          </div>
                        ))}
                        {analysis.missing_skills.length > 4 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/5 mt-2"
                            onClick={() => setShowAllSkills(!showAllSkills)}
                          >
                            {showAllSkills
                              ? "Show Less"
                              : `Show ${analysis.missing_skills.length - 4} More`}
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-green-600 font-medium">
                        No major missing skills identified.
                      </p>
                    )}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-foreground">
                    Extraordinary Points
                  </h3>
                  <div className="space-y-2">
                    {analysis?.extraordinary_points &&
                      analysis.extraordinary_points.length > 0 ? (
                      analysis.extraordinary_points.map((point, idx) => (
                        <div
                          key={idx}
                          className="flex gap-3 text-sm leading-relaxed text-muted-foreground group"
                        >
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 shrink-0 group-hover:scale-150 transition-transform" />
                          <p className="group-hover:text-foreground transition-colors">
                            {point}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        None identified.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col gap-4 p-4">
              {isLoadingVersion ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                  <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm font-bold text-muted-foreground">
                    Loading JD Version...
                  </p>
                </div>
              ) : selectedVersionData ? (
                <div className="bg-muted/30 rounded-3xl p-6 border border-muted-foreground/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-lg font-black tracking-tight">
                          {selectedVersionData.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <span>
                            Version {selectedVersionData.version_number}
                          </span>
                          <span className="h-1 w-1 bg-muted-foreground rounded-full" />
                          <span>
                            Updated{" "}
                            {new Date(
                              selectedVersionData.created_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedVersionData.version_number ===
                      (candidate as ResumeScreeningResult)
                        ?.applied_version_number && (
                        <Badge className="bg-primary/10 text-primary border-0 rounded-full font-black text-[10px] px-3 py-1">
                          VERSION USED FOR ANALYSIS
                        </Badge>
                      )}
                  </div>

                  <Separator className="bg-muted-foreground/10" />

                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedVersionData.jd_text}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-40">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm font-bold">
                    No JD version data available.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {canTakeDecision && (
          <div className="p-4 border-t border-muted-foreground/10 flex flex-wrap gap-4 items-center justify-center bg-muted/10">
            <Button
              onClick={() => handleAction("approve")}
              variant="default"
              className="rounded-xl px-8 shadow-md"
            >
              Approve
            </Button>
            {(!screeningDecision || screeningDecision.decision !== "maybe") && (
              <Button
                variant="outline"
                onClick={() => handleAction("maybe")}
                className="rounded-xl px-8 shadow-sm"
              >
                Maybe
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => handleAction("reject")}
              className="rounded-xl px-8 shadow-md"
            >
              Reject
            </Button>
          </div>
        )}
      </DialogContent>

      <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${feedbackType === "approve"
                  ? "bg-green-500/10 text-green-600"
                  : feedbackType === "reject"
                    ? "bg-red-500/10 text-red-600"
                    : "bg-amber-500/10 text-amber-600"
                  }`}
              >
                <MessageSquare className="h-5 w-5" />
              </div>
              {feedbackType === "approve"
                ? "Approve Candidate"
                : feedbackType === "reject"
                  ? "Reject Candidate"
                  : "Mark as 'Maybe'"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Reason for{" "}
                {feedbackType === "approve"
                  ? "Approval"
                  : feedbackType === "reject"
                    ? "Rejection"
                    : "Decision"}
              </label>
              <Textarea
                placeholder={`Enter reason for ${feedbackType === "approve"
                  ? "approving"
                  : feedbackType === "reject"
                    ? "rejecting"
                    : "marking as maybe"
                  } ${candidate?.first_name || "candidate"}...`}
                className="min-h-[120px] rounded-2xl resize-none border-muted-foreground/20 focus:border-primary/30 transition-colors"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowFeedbackModal(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant={
                feedbackType === "approve"
                  ? "default"
                  : feedbackType === "reject"
                    ? "destructive"
                    : "secondary"
              }
              className="rounded-xl px-8"
              onClick={submitFeedback}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Submitting..."
                : `Confirm ${feedbackType === "approve"
                  ? "Approval"
                  : feedbackType === "reject"
                    ? "Rejection"
                    : "Decision"
                }`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

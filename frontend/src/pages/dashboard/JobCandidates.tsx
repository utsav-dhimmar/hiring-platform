import { useCallback, useEffect, useState, useRef } from "react";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import jobService from "@/apis/job";
import { Button, Badge, Input } from "@/components/";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResumeScreeningResult } from "@/types/admin";
import type { Job } from "@/types/job";
import { extractErrorMessage } from "@/utils/error";
import {
  ArrowLeft,
  Upload,
  FileText,
  RotateCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { CandidateDetailsModal, JobInfoModal } from "@/components/modal";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { slugify } from "@/utils/slug";
import CandidateTable from "@/components/candidate/CandidateTable";

type JobRouteState = {
  jobId?: string;
};

const CandidateSkeleton = () => (
  <div className="border rounded-2xl p-4 bg-background/30 animate-pulse border-muted-foreground/10 mb-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-4 w-60 rounded" />
        </div>
      </div>
      <Skeleton className="h-10 w-24 rounded-xl" />
    </div>
  </div>
);

export default function JobCandidates() {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [candidates, setCandidates] = useState<ResumeScreeningResult[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] =
    useState<ResumeScreeningResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [reanalyzingCandidateIds, setReanalyzingCandidateIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentJobId = useRef<string | null>(null);

  const fetchData = useCallback(async (isPolling = false) => {
    if (!jobSlug) return;
    if (!isPolling) setLoading(true);
    try {
      let id = (location.state as JobRouteState | null)?.jobId || currentJobId.current;

      if (!id) {
        const allJobs = await jobService.getJobs();
        const foundJob = allJobs.find((j) => slugify(j.title) === jobSlug);

        if (!foundJob) {
          toast.error("Job not found.");
          if (!isPolling) navigate("/dashboard/jobs");
          return;
        }
        id = foundJob.id;
      }

      currentJobId.current = id;

      if (isPolling) {
        const candidatesData = await jobService.getJobCandidates(id);
        setCandidates(candidatesData.candidates || []);
      } else {
        const [jobData, candidatesData] = await Promise.all([
          jobService.getJob(id),
          jobService.getJobCandidates(id),
        ]);
        setJob(jobData);
        setCandidates(candidatesData.candidates || []);
      }
    } catch (error) {
      console.error("Failed to fetch job data:", error);
      if (!isPolling) {
        const errorMessage = extractErrorMessage(error, "Failed to load candidates.");
        toast.error(errorMessage);
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  }, [jobSlug, location.state, navigate]);

  const handleUploadClick = () => {
    if (!job?.is_active) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !job) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        await jobService.uploadResume(job.id, file);
        toast.success(`Uploaded ${file.name} successfully!`);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}`);
      }
    });

    await Promise.all(uploadPromises);
    setIsUploading(false);
    fetchData(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReanalyzeCandidate = useCallback(
    async (candidateId: string) => {
      if (!job) return;
      setReanalyzingCandidateIds((current) => [...current, candidateId]);
      try {
        const response = await jobService.reanalyzeCandidate(job.id, candidateId);
        toast.success(response.message || "Re-analysis started successfully.");
        await fetchData(true);
      } catch (error) {
        console.error("Failed to reanalyze candidate:", error);
        toast.error(extractErrorMessage(error, "Failed to start candidate re-analysis."));
      } finally {
        setReanalyzingCandidateIds((current) => current.filter((id) => id !== candidateId));
      }
    },
    [fetchData, job],
  );

  /**
   * Returns true when a candidate's resume needs (re)analysis:
   *  1. Never successfully analyzed (applied_version_number is null/undefined)
   *  2. JD was updated after the last analysis (applied_version_number < job.version)
   *  3. Last analysis failed (processing_status === "failed")
   * Returns false when the candidate is currently in-flight or already up-to-date.
   */
  const needsReanalysis = useCallback(
    (candidate: ResumeScreeningResult): boolean => {
      // Don't allow re-triggering while already in-flight
      if (
        candidate.processing_status === "processing" ||
        candidate.processing_status === "queued" ||
        reanalyzingCandidateIds.includes(candidate.id)
      ) {
        return false;
      }
      // Last analysis failed → allow retry
      if (candidate.processing_status === "failed") return true;
      // Never analyzed
      if (candidate.applied_version_number == null) return true;
      // JD version advanced since last analysis
      if (job?.version != null && candidate.applied_version_number < job.version) return true;
      return false;
    },
    [job, reanalyzingCandidateIds],
  );

  const handleReanalyzeAll = useCallback(async () => {
    if (!job || candidates.length === 0) return;
    const toReanalyze = candidates.filter(needsReanalysis);
    if (toReanalyze.length === 0) return;
    toast.info(`Re-analyzing ${toReanalyze.length} candidate(s)...`);
    for (const candidate of toReanalyze) {
      jobService.reanalyzeCandidate(job.id, candidate.id).catch((err) => {
        console.error(`Failed to reanalyze ${candidate.id}:`, err);
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    toast.success("Requests sent for all candidates that need reanalysis.");
  }, [candidates, job, needsReanalysis]);

  const hrApprovedCount = candidates.filter((c) => c.screening_decision === "approve").length;
  const hrMaybeCount = candidates.filter((c) => c.screening_decision === "maybe").length;
  const hrRejectedCount = candidates.filter((c) => c.screening_decision === "reject").length;

  // Polling
  useEffect(() => {
    const isAnyProcessing = candidates.some(
      (c) => c.processing_status === "processing" || !c.is_parsed,
    );
    if (isAnyProcessing) {
      const interval = setInterval(() => {
        fetchData(true);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [candidates, fetchData]);

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto px-4 pt-0 pb-4 animate-in fade-in duration-500">
      {/* Navigation & Header */}
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 text-muted-foreground hover:text-primary transition-colors mb-2"
          onClick={() => navigate("/dashboard/jobs")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>

        <div className="flex flex-col gap-4 lg:flex-row justify-between items-start lg:items-center p-4 border rounded-3xl bg-card/40 backdrop-blur-md shadow-sm border-muted-foreground/10">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {job?.title || "Loading..."}
            </h1>
            <DashboardBreadcrumbs />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mt-1">
              <span className="text-blue-500 font-semibold">
                {job?.department_name || "Department"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                {job && (
                  <>
                    <Badge
                      variant={job.is_active ? "default" : "outline"}
                      className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    >
                      {job.is_active ? "Active" : "Closed"}
                    </Badge>
                    {job.version != null && (
                      <>
                        <span className="text-muted-foreground ml-1">Version:</span>
                        <Badge
                          variant="secondary"
                          className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        >
                          v{job.version}
                        </Badge>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <Button
              variant="secondary"
              className="px-6 rounded-xl font-semibold border border-muted-foreground/10"
              onClick={() => setIsJobModalOpen(true)}
            >
              Info
            </Button>
            <Button
              variant="outline"
              onClick={handleUploadClick}
              disabled={isUploading || !job?.is_active}
              title={!job?.is_active ? "Resume upload is disabled for inactive jobs" : undefined}
            >
              <Upload className="mr-2 h-5 w-5" />
              {isUploading ? "Uploading..." : "Upload Resumes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {!loading && candidates?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="group p-6 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-card/50 transition-all duration-300 border-muted-foreground/10">
            <span className="text-4xl font-black text-foreground">
              {candidates?.length || 0}
            </span>
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
              Candidates
            </span>
          </div>
          <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-green-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-green-500/20">
            <span className="text-4xl font-black text-green-600">
              {candidates.filter((c) => (c.resume_score ?? 0) >= 65 && c.pass_fail).length}
            </span>
            <span className="text-sm font-bold text-green-600/70 uppercase tracking-widest group-hover:text-green-600 transition-colors">
              Passed
            </span>
          </div>
          <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-red-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-red-500/20">
            <span className="text-4xl font-black text-red-500/80">
              {candidates.filter((c) => (c.resume_score ?? 0) < 65 || !c.pass_fail).length}
            </span>
            <span className="text-sm font-bold text-red-500/50 uppercase tracking-widest group-hover:text-red-500/80 transition-colors">
              Failed
            </span>
          </div>
          <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-green-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-green-500/20">
            <span className="text-4xl font-black text-green-600">{hrApprovedCount}</span>
            <span className="text-sm font-bold text-green-600/70 uppercase tracking-widest group-hover:text-green-600 transition-colors">
              HR Approved
            </span>
          </div>
          <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-amber-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-amber-500/20">
            <span className="text-4xl font-black text-amber-600">{hrMaybeCount}</span>
            <span className="text-sm font-bold text-amber-600/70 uppercase tracking-widest group-hover:text-amber-600 transition-colors">
              HR Maybe
            </span>
          </div>
          <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-red-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-red-500/20">
            <span className="text-4xl font-black text-red-600">{hrRejectedCount}</span>
            <span className="text-sm font-bold text-red-600/70 uppercase tracking-widest group-hover:text-red-600 transition-colors">
              HR Rejected
            </span>
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="rounded-[2.5rem] border p-4 bg-card/30 backdrop-blur-md shadow-lg border-muted-foreground/10 min-h-125">
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <CandidateSkeleton key={i} />
            ))}
          </div>
        ) : candidates?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6 animate-in zoom-in-95 duration-700">
            <div className="p-8 bg-muted/40 rounded-full ring-4 ring-muted/10">
              <FileText className="h-16 w-16 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">No applicants found</h3>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-5 duration-700">
            <CandidateTable
              candidates={candidates}
              headerActions={
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 hover:bg-amber-500/10 text-amber-600 hover:text-amber-700 font-semibold transition-all flex items-center gap-2 h-10 rounded-xl"
                  onClick={handleReanalyzeAll}
                  disabled={candidates.filter(needsReanalysis).length === 0}
                  title={
                    candidates.filter(needsReanalysis).length === 0
                      ? "All candidates are analyzed with the latest JD version"
                      : `Re-analyze ${candidates.filter(needsReanalysis).length} candidate(s) that need it`
                  }
                >
                  <RotateCw className="h-4 w-4" />
                  Reanalyze All
                </Button>
              }
              renderActions={(candidate) => (
                <div className="flex items-center gap-2 justify-end">
                  <HoverCard>
                    <HoverCardTrigger
                      render={(props) => (
                        <Button
                          {...props}
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 rounded-xl border border-amber-300 hover:bg-amber-500/10 transition-all duration-300 flex items-center justify-center shrink-0"
                          onClick={(e) => {
                            if (props.onClick) props.onClick(e);
                            handleReanalyzeCandidate(candidate.id);
                          }}
                          isLoading={reanalyzingCandidateIds.includes(candidate.id)}
                          disabled={
                            !needsReanalysis(candidate) ||
                            reanalyzingCandidateIds.includes(candidate.id)
                          }
                          title={
                            !needsReanalysis(candidate)
                              ? "Already analyzed with the latest JD version"
                              : "Re-analyze with the latest JD version"
                          }
                        >
                          <RotateCw className="h-4 w-4 text-amber-600 shrink-0" />
                        </Button>
                      )}
                    />
                    <HoverCardContent side="bottom" className="w-auto p-2 min-w-0">
                      <div className="text-sm font-semibold text-amber-700">Reanalyze</div>
                    </HoverCardContent>
                  </HoverCard>

                  <HoverCard>
                    <HoverCardTrigger
                      render={(props) => (
                        <Button
                          {...props}
                          variant="secondary"
                          size="sm"
                          className="h-9 w-9 p-0 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all duration-300 border border-muted-foreground/10 flex items-center justify-center shrink-0"
                          onClick={(e) => {
                            if (props.onClick) props.onClick(e);
                            setSelectedCandidate(candidate);
                            setIsModalOpen(true);
                          }}
                        >
                          <Info className="h-4 w-4 shrink-0" />
                        </Button>
                      )}
                    />
                    <HoverCardContent side="bottom" className="w-auto p-2 min-w-0">
                      <div className="text-sm font-semibold">More Info</div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              )}
            />
          </div>
        )}
      </div>

      <CandidateDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        candidate={selectedCandidate}
        jobId={job?.id}
      />

      <JobInfoModal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        job={job}
      />

      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
      />
    </div>
  );
}

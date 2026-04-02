import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import jobService from "@/apis/job";
import { toast } from "sonner";
import { extractErrorMessage } from "@/utils/error";
import { slugify } from "@/utils/slug";
import type { ResumeScreeningResult } from "@/types/admin";
import type { Job } from "@/types/job";

type JobRouteState = {
  jobId?: string;
};

export const useJobCandidates = (jobSlug: string | undefined) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [candidates, setCandidates] = useState<ResumeScreeningResult[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [reanalyzingCandidateIds, setReanalyzingCandidateIds] = useState<string[]>([]);
  const currentJobId = useRef<string | null>(null);

  const fetchData = useCallback(
    async (isPolling = false) => {
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
    },
    [jobSlug, location.state, navigate],
  );

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
    if (event.target) event.target.value = "";
  };

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

  const needsReanalysis = useCallback(
    (candidate: ResumeScreeningResult): boolean => {
      if (
        candidate.processing_status === "processing" ||
        candidate.processing_status === "queued" ||
        reanalyzingCandidateIds.includes(candidate.id)
      ) {
        return false;
      }
      if (candidate.processing_status === "failed") return true;
      if (candidate.applied_version_number == null) return true;
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

  const handleToggleStatus = useCallback(async () => {
    if (!job) return;
    try {
      await jobService.updateJob(job.id, { is_active: !job.is_active });
      toast.success(`Job ${!job.is_active ? "activated" : "deactivated"} successfully`);
      await fetchData();
    } catch (error) {
      console.error("Failed to toggle job status:", error);
      const errorMessage = extractErrorMessage(error, "Failed to update job status");
      toast.error(errorMessage);
    }
  }, [job, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const hrApprovedCount = candidates.filter((c) => c.screening_decision === "approve").length;
  const hrMaybeCount = candidates.filter((c) => c.screening_decision === "maybe").length;
  const hrRejectedCount = candidates.filter((c) => c.screening_decision === "reject").length;
  const passedCount = candidates.filter((c) => (c.resume_score ?? 0) >= 65 && c.pass_fail).length;
  const failedCount = candidates.filter((c) => (c.resume_score ?? 0) < 65 || !c.pass_fail).length;

  return {
    candidates,
    job,
    loading,
    isUploading,
    reanalyzingCandidateIds,
    fetchData,
    handleFileChange,
    handleReanalyzeCandidate,
    handleReanalyzeAll,
    handleToggleStatus,
    needsReanalysis,
    stats: {
      hrApprovedCount,
      hrMaybeCount,
      hrRejectedCount,
      passedCount,
      failedCount,
    },
  };
};

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";

import jobService from "@/apis/job";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";
import { Button, Badge } from "@/components/";
import { DateDisplay } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job, JobVersionDetail, JobVersionMinimal } from "@/types/job";
import { extractErrorMessage } from "@/utils/error";
import { slugify } from "@/utils/slug";

const VersionSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-40 rounded-xl" />
    <Skeleton className="h-24 w-full rounded-2xl" />
    <Skeleton className="h-24 w-full rounded-2xl" />
  </div>
);

export default function JobVersionUpdates() {
  const { jobSlug } = useParams<{ jobSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<JobVersionDetail | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobSlug) return;

    setLoading(true);
    try {
      let id = (location.state as { jobId?: string } | null)?.jobId;

      if (!id) {
        const allJobs = await jobService.getJobs();
        const foundJob = allJobs.find((item) => slugify(item.title) === jobSlug);

        if (!foundJob) {
          toast.error("Job not found.");
          navigate("/dashboard/jobs");
          return;
        }

        id = foundJob.id;
      }

      const jobData = await jobService.getJob(id);
      setJob(jobData);

      const latestVersion =
        [...(jobData.job_versions ?? [])].sort((a, b) => b.version_num - a.version_num)[0] ?? null;

      if (latestVersion) {
        setSelectedVersionId(latestVersion.id);
      }
    } catch (error) {
      console.error("Failed to load job versions:", error);
      toast.error(extractErrorMessage(error, "Failed to load job versions."));
    } finally {
      setLoading(false);
    }
  }, [jobSlug, location.state, navigate]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const sortedVersions = useMemo(() => {
    return [...(job?.job_versions ?? [])].sort((a, b) => b.version_num - a.version_num);
  }, [job]);

  useEffect(() => {
    const loadVersion = async () => {
      if (!job || !selectedVersionId) {
        setSelectedVersion(null);
        return;
      }

      const latestVersionId = sortedVersions[0]?.id;
      const latestVersionNum = sortedVersions[0]?.version_num ?? job.version ?? 1;

      if (selectedVersionId === latestVersionId) {
        setSelectedVersion({
          id: latestVersionId,
          job_id: job.id,
          version_number: latestVersionNum,
          title: job.title,
          jd_text: job.jd_text,
          jd_json: job.jd_json,
          custom_extraction_fields: job.custom_extraction_fields ?? null,
          created_at: job.created_at,
        });
        setVersionError(null);
        return;
      }

      setVersionLoading(true);
      setVersionError(null);

      try {
        const versionData = await jobService.getJobVersion(selectedVersionId);
        setSelectedVersion(versionData);
      } catch (error) {
        console.error("Failed to load version snapshot:", error);
        const message = extractErrorMessage(
          error,
          "Failed to load this version. Backend version-details endpoint may not be available yet.",
        );
        setSelectedVersion(null);
        setVersionError(message);
        toast.error(message);
      } finally {
        setVersionLoading(false);
      }
    };

    loadVersion();
  }, [job, selectedVersionId, sortedVersions]);

  const renderVersionButton = (version: JobVersionMinimal) => (
    <Button
      key={version.id}
      variant={selectedVersionId === version.id ? "default" : "outline"}
      className="justify-start"
      onClick={() => setSelectedVersionId(version.id)}
    >
      Version {version.version_num}
    </Button>
  );

  return (
    <div className="flex max-w-7xl flex-col gap-4 mx-auto px-4 pt-0 pb-4">
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 text-muted-foreground hover:text-primary transition-colors"
          onClick={() =>
            navigate(`/dashboard/jobs/${jobSlug}/candidates`, {
              state: job ? { jobId: job.id } : undefined,
            })
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Candidates
        </Button>

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">
            {job?.title || "Job Versions"}
          </h1>
          <DashboardBreadcrumbs />
        </div>
      </div>

      {loading ? (
        <VersionSkeleton />
      ) : !job ? (
        <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
          Job details are unavailable.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="rounded-2xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Versions</h2>
              <Badge variant="outline">{sortedVersions.length}</Badge>
            </div>

            {sortedVersions.length > 0 ? (
              <div className="flex flex-col gap-2">
                {sortedVersions.map(renderVersionButton)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No versions found.</p>
            )}
          </div>

          <div className="rounded-2xl border p-4 space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {selectedVersion ? `Version ${selectedVersion.version_number}` : "Version Detail"}
                </h2>
                {selectedVersion && <Badge variant="outline">{selectedVersion.title}</Badge>}
              </div>

              {selectedVersion && (
                <div className="text-sm text-muted-foreground">
                  <DateDisplay date={selectedVersion.created_at} showIcon />
                </div>
              )}
            </div>

            {versionLoading ? (
              <VersionSkeleton />
            ) : versionError ? (
              <div className="rounded-2xl border p-4 text-sm text-destructive">
                {versionError}
              </div>
            ) : selectedVersion ? (
              <>
                <div className="rounded-2xl border p-4 space-y-2">
                  <h3 className="font-semibold">Job Description</h3>
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-6">
                    {selectedVersion.jd_text || "No JD text found for this version."}
                  </div>
                </div>

                <div className="rounded-2xl border p-4 space-y-2">
                  <h3 className="font-semibold">Custom Extraction Fields</h3>
                  {selectedVersion.custom_extraction_fields?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedVersion.custom_extraction_fields.map((field) => (
                        <Badge key={field} variant="outline">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No custom extraction fields for this version.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border p-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Select a version to view its job description snapshot.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

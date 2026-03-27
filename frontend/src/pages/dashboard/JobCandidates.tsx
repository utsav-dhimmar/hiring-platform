import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import jobService from "@/apis/job";
import { Button, Badge } from "@/components/";
import { DataTable } from "@/components/shared";
import { Skeleton } from "@/components/ui/skeleton";
import type { ResumeScreeningResult } from "@/types/admin";
import type { Job } from "@/types/job";
import { extractErrorMessage } from "@/utils/error";
import {
  ArrowLeft,
  Upload,
  // Trash2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { CandidateDetailsModal } from "./components/CandidateDetailsModal";
import { GithubLogo, LinkedinLogo } from "@/components/logo";
import { slugify } from "@/utils/slug";

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
  const [selectedCandidate, setSelectedCandidate] = useState<ResumeScreeningResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (!jobSlug) return;
    setLoading(true);
    try {
      let id = (location.state as any)?.jobId;

      if (!id) {
        // Fallback: find job by slug
        const allJobs = await jobService.getJobs();
        const foundJob = allJobs.find((j) => slugify(j.title) === jobSlug);

        if (!foundJob) {
          toast.error("Job not found.");
          navigate("/dashboard/jobs");
          return;
        }
        id = foundJob.id;
      }

      const [jobData, candidatesData] = await Promise.all([
        jobService.getJob(id),
        jobService.getJobCandidates(id),
      ]);
      setJob(jobData);
      setCandidates(candidatesData.candidates || []);
    } catch (error) {
      console.error("Failed to fetch job data:", error);
      const errorMessage = extractErrorMessage(error, "Failed to load candidates.");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [jobSlug, location.state, navigate]);

  const handleUploadClick = () => {
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
    fetchData(); // Refresh candidates list
    if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // polling
  useEffect(() => {
    const isAnyProcessing = candidates.some(
      (c) => c.processing_status === "processing" || !c.is_parsed,
    );

    if (isAnyProcessing) {
      const interval = setInterval(() => {
        fetchData();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [candidates, fetchData]);

  const columns: ColumnDef<ResumeScreeningResult>[] = useMemo(
    () => [
      {
        id: "candidate",
        header: "Candidate",
        accessorFn: (row) => `${row.first_name || ""} ${row.last_name || ""}`.trim(),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-base text-foreground">
              {`${row.original.first_name || ""} ${row.original.last_name || ""}`.trim() ||
                "Unknown Candidate"}
            </span>
            <span className="text-sm text-muted-foreground">{row.original.email}</span>
            <span className="text-sm text-muted-foreground">{row.original.phone}</span>
          </div>
        ),
      },
      {
        id: "assessment",
        header: "Assessment",
        accessorKey: "resume_score",
        cell: ({ row }) => {
          const score = row.original.resume_score || 0;
          const isPassed = row.original.pass_fail;
          const isProcessing =
            row.original.processing_status === "processing" || !row.original.is_parsed;

          if (isProcessing) {
            return (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-muted-foreground italic">
                    Analyzing...
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full px-2 py-0 text-[10px] uppercase font-bold w-fit tracking-wider bg-blue-500/5 text-blue-500 border-blue-200/50 animate-pulse"
                >
                  Processing
                </Badge>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">{score}%</span>
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
              <Badge
                variant={isPassed ? "default" : "destructive"}
                className={`rounded-full px-2 py-0 text-[10px] uppercase font-bold w-fit tracking-wider ${isPassed ? "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20 shadow-none" : "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20 shadow-none"}`}
              >
                {isPassed ? "Passed" : "Failed"}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "socials",
        header: "Socials",
        cell: ({ row }) => {
          const { linkedin_url, github_url } = row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-blue-500/10 hover:text-blue-500 border-muted-foreground/20 disabled:opacity-30"
                disabled={!linkedin_url}
                onClick={() =>
                  linkedin_url &&
                  window.open(
                    linkedin_url.startsWith("http") ? linkedin_url : `https://${linkedin_url}`,
                    "_blank",
                  )
                }
              >
                <LinkedinLogo className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-blue-500/10 hover:text-blue-500 border-muted-foreground/20 disabled:opacity-30"
                disabled={!github_url}
                onClick={() =>
                  github_url &&
                  window.open(
                    github_url.startsWith("http") ? github_url : `https://${github_url}`,
                    "_blank",
                  )
                }
              >
                <GithubLogo className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-4">Actions</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2 pr-2">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl font-semibold h-9 px-4 bg-muted/50 hover:bg-muted text-foreground transition-all border border-muted-foreground/10"
              onClick={() => {
                setSelectedCandidate(row.original);
                setIsModalOpen(true);
              }}
            >
              More Info
            </Button>
            {/* <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button> */}
          </div>
        ),
      },
    ],
    [],
  );

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

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 border rounded-3xl bg-card/40 backdrop-blur-md shadow-sm border-muted-foreground/10">
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
                  <Badge
                    variant={job.is_active ? "default" : "outline"}
                    className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  >
                    {job.is_active ? "Active" : "Closed"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleUploadClick} disabled={isUploading}>
            <Upload className="mr-2 h-5 w-5" />
            {isUploading ? "Uploading..." : "Upload Resumes"}
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      {!loading && candidates?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="group p-6 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-card/50 transition-all duration-300 border-muted-foreground/10">
            <span className="text-4xl font-black text-foreground">{candidates?.length || 0}</span>
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
              Resumes
            </span>
          </div>
          <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-green-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-green-500/20">
            <span className="text-4xl font-black text-green-600">
              {candidates.filter((c) => c.pass_fail).length}
            </span>
            <span className="text-sm font-bold text-green-600/70 uppercase tracking-widest group-hover:text-green-600 transition-colors">
              Passed
            </span>
          </div>
          <div className="group p-8 rounded-[2.5rem] border bg-card/30 backdrop-blur-sm shadow-sm flex flex-col items-center gap-2 hover:bg-red-500/5 transition-all duration-300 border-muted-foreground/10 hover:border-red-500/20">
            <span className="text-4xl font-black text-red-500/80">
              {candidates.filter((c) => !c.pass_fail).length}
            </span>
            <span className="text-sm font-bold text-red-500/50 uppercase tracking-widest group-hover:text-red-500/80 transition-colors">
              Failed
            </span>
          </div>
        </div>
      )}

      {/* Content Container */}
      <div className="rounded-[2.5rem] border p-4 bg-card/30 backdrop-blur-md shadow-lg border-muted-foreground/10 min-h-[500px]">
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
            <DataTable
              columns={columns}
              data={candidates || []}
              searchKey="candidate"
              searchPlaceholder="Search by name..."
            />
          </div>
        )}
      </div>

      <CandidateDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        candidate={selectedCandidate}
      />

      <input
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

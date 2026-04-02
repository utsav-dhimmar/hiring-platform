import { Button, Badge } from "@/components/";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";
import { ArrowLeft, Upload } from "lucide-react";
import type { Job } from "@/types/job";

interface JobCandidatesHeaderProps {
  job: Job | null;
  onBack: () => void;
  onInfoClick: () => void;
  onUploadClick: () => void;
  isUploading: boolean;
}

export const JobCandidatesHeader = ({
  job,
  onBack,
  onInfoClick,
  onUploadClick,
  isUploading,
}: JobCandidatesHeaderProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit -ml-2 text-muted-foreground hover:text-primary transition-colors mb-2"
        onClick={onBack}
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
                    {job.is_active ? "Active" : "Inactive"}
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
            onClick={onInfoClick}
          >
            Info
          </Button>
          <Button
            variant="outline"
            onClick={onUploadClick}
            disabled={isUploading || !job?.is_active}
            title={!job?.is_active ? "Resume upload is disabled for inactive jobs" : undefined}
          >
            <Upload className="mr-2 h-5 w-5" />
            {isUploading ? "Uploading..." : "Upload Resumes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

import { Button, Badge, Switch, Label } from "@/components/";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";
import { AppPageHeader } from "@/components/shared";
import { Upload } from "lucide-react";
import type { Job } from "@/types/job";
import { cn } from "@/lib/utils";

interface JobCandidatesHeaderProps {
  job: Job | null;
  onBack: () => void;
  onInfoClick: () => void;
  onUploadClick: () => void;
  isUploading: boolean;
  onToggleStatus: () => void;
}

export const JobCandidatesHeader = ({
  job,
  onBack,
  onInfoClick,
  onUploadClick,
  isUploading,
  onToggleStatus,
}: JobCandidatesHeaderProps) => {
  return (
    <AppPageHeader
      title={job?.title || "Loading..."}
      breadcrumbs={<DashboardBreadcrumbs />}
      mobileMenuTrigger
      backAction={{ label: "Back to Jobs", onClick: onBack }}
      meta={
        <>
          <span className="font-semibold text-blue-500">{job?.department_name || "Department"}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {job ? (
              <div className="flex items-center gap-2">
                <Switch
                  checked={job.is_active}
                  onCheckedChange={onToggleStatus}
                  id={`status-${job.id}`}
                  size="sm"
                />
                <Label
                  htmlFor={`status-${job.id}`}
                  className={cn(
                    "cursor-pointer text-sm font-medium transition-colors",
                    job.is_active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {job.is_active ? "Active" : "Inactive"}
                </Label>
              </div>
            ) : null}
          </div>
          {job?.version != null ? (
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            >
              v{job.version}
            </Badge>
          ) : null}
        </>
      }
      actions={
        <>
          <Button
            variant="secondary"
            className="rounded-xl border border-muted-foreground/10 px-5 font-semibold"
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
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Resumes"}
          </Button>
        </>
      }
    />
  );
};

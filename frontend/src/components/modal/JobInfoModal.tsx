import { useState, useEffect } from "react";
import jobService from "@/apis/job";
import type { Job, JobVersionDetail } from "@/types/job";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DateDisplay } from "../shared";

interface JobInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

export function JobInfoModal({ isOpen, onClose, job }: JobInfoModalProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<JobVersionDetail | null>(null);
  const [isLoadingVersion, setIsLoadingVersion] = useState(false);

  useEffect(() => {
    if (isOpen && job) {
      // Initialize with latest version or current job info
      const sorted = [...(job.job_versions || [])].sort((a, b) => b.version_num - a.version_num);
      if (sorted.length > 0) {
        setSelectedVersionId(sorted[0].id);
      } else {
        // Fallback to current job data if no versions
        setSelectedVersion({
          id: "current",
          job_id: job.id,
          version_number: job.version || 1,
          title: job.title,
          jd_text: job.jd_text,
          jd_json: job.jd_json,
          custom_extraction_fields: job.custom_extraction_fields || null,
          created_at: job.created_at,
        });
      }
    } else {
      setSelectedVersionId(null);
      setSelectedVersion(null);
    }
  }, [isOpen, job]);

  useEffect(() => {
    if (selectedVersionId && job) {
      if (selectedVersionId === "current") return;

      setIsLoadingVersion(true);
      jobService.getJobVersion(selectedVersionId)
        .then((data) => setSelectedVersion(data))
        .catch((err) => console.error("Failed to fetch version:", err))
        .finally(() => setIsLoadingVersion(false));
    }
  }, [selectedVersionId, job]);

  if (!job) return null;
  console.log(job);
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-muted-foreground/20 shadow-2xl rounded-2xl h-[600px]">
        <DialogHeader className="p-2 pb-2 border-b border-muted-foreground/10 bg-muted/30">
          <div className="flex flex-row items-start justify-between gap-4 sm:flex-col sm:justify-start sm:items-start">
            <DialogTitle className="text-xl font-black tracking-tight text-foreground">
              {job.title}
            </DialogTitle>
            <div className="flex flex-row items-center justify-center gap-2.5  sm:justify-start sm:items-start">
              {job.department_name && (
                <span className="text-sm font-semibold text-blue-500">
                  {job.department_name}
                </span>
              )}
              <Badge
                variant={job.is_active ? "default" : "outline"}
                className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
              >
                {job.is_active ? "Active" : "Inactive"}
              </Badge>
              <div className="flex flex-row items-center justify-center gap-1">
                <span>Due Date:</span>
                <span className="font-bold">
                  <DateDisplay
                    date={job.priority_end_date}
                    fallback="No due date"
                  />
                </span>
                {/* priority name  */}
                {/* {job.priority?.name && (
                  <span

                    className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    {job.priority?.name}
                  </span>
                )} */}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-2 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="space-y-1 pb-4">
            {/* Job Description */}
            <div >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest py-2">
                  Job Description
                </h3>

                {job.job_versions && job.job_versions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {[...(job.job_versions)].sort((a, b) => b.version_num - a.version_num).map((v) => (
                      <Button
                        key={v.id}
                        variant={selectedVersionId === v.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedVersionId(v.id)}
                        className={`rounded-full h-7 px-3 text-[10px] font-bold uppercase transition-all ${selectedVersionId === v.id
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "hover:bg-primary/5"
                          }`}
                      >
                        V{v.version_num}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {isLoadingVersion ? (
                <div className="h-40 w-full rounded-2xl bg-muted/20 animate-pulse border border-muted-foreground/10 flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">Loading specific version...</span>
                </div>
              ) : (selectedVersion?.jd_text || job.jd_text) ? (
                <div className="group relative">
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/20 p-2 rounded-2xl border border-muted-foreground/10 transition-colors group-hover:border-primary/20">
                    {selectedVersion?.jd_text || job.jd_text}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic p-2 rounded-2xl bg-muted/10 border border-muted-foreground/5">
                  No description provided.
                </div>
              )}
            </div>

            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Required Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge
                      key={skill.name}
                      variant="secondary"
                      className="rounded-xl px-3 py-1 font-medium bg-secondary/50 hover:bg-secondary text-secondary-foreground border-muted-foreground/10 transition-colors"
                      title={skill.description || undefined}
                    >
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}


            {/* Passing Threshold */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Passing Threshold
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-xl px-3 py-1 font-medium bg-secondary/50 hover:bg-secondary text-secondary-foreground border-muted-foreground/10 transition-colors"
                  >
                    {job.passing_threshold}%
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  Vacancy
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-xl px-3 py-1 font-medium bg-secondary/50 hover:bg-secondary text-secondary-foreground border-muted-foreground/10 transition-colors"
                  >
                    {job.vacancy}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

export default JobInfoModal;

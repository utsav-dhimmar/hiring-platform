import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/types/job";

interface JobInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
}

export function JobInfoModal({ isOpen, onClose, job }: JobInfoModalProps) {
  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card/95 backdrop-blur-xl border-muted-foreground/20 shadow-2xl rounded-3xl sm:rounded-[2rem]">
        <DialogHeader className="p-6 pb-4 border-b border-muted-foreground/10 bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                {job.title}
              </DialogTitle>
              {job.department_name && (
                <span className="text-sm font-semibold text-blue-500">
                  {job.department_name}
                </span>
              )}

              <Badge
                variant={job.is_active ? "default" : "outline"}
                className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap"
              >
                {job.is_active ? "Active" : "Closed"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="space-y-8 pb-4">
            {/* Job Description */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Job Description
              </h3>
              {job.jd_text ? (
                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/20 p-5 rounded-2xl border border-muted-foreground/10">
                  {job.jd_text}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic p-5 rounded-2xl bg-muted/10 border border-muted-foreground/5">
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

            {/* Other details if needed could be added here */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default JobInfoModal;

import type { ReactElement } from "react";
import { Button, StatusBadge, DateDisplay } from "@/components/shared";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Job } from "@/types/job";

interface JobDetailsModalProps {
  show: boolean;
  onHide: () => void;
  job: Job | null;
}

const JobDetailsModal = ({ show, onHide, job }: JobDetailsModalProps): ReactElement | null => {
  if (!job) return null;

  return (
    <Dialog open={show} onOpenChange={(open) => !open && onHide()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Job Details: {job.title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h5>Basic Info</h5>
            <p className="mb-1">
              <strong>Department:</strong> {job.department?.name ?? job.department_name ?? "N/A"}
            </p>
            <p className="mb-1">
              <strong>Status:</strong> <StatusBadge status={job.is_active} />
            </p>
            <p className="mb-1">
              <strong>Created At:</strong> <DateDisplay date={job.created_at} showTime={false} />
            </p>
          </div>
        </div>
        <hr className="my-4" />
        <h5>Job Description</h5>
        <div className="bg-muted p-3 rounded" style={{ whiteSpace: "pre-wrap" }}>
          {job.jd_text || "No description provided."}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsModal;

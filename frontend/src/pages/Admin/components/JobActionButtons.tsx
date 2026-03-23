import { Button } from "@/components/shared";
import QuickResumeUpload from "@/components/candidate/QuickResumeUpload";
import type { JobRead } from "@/types/admin";

interface JobActionButtonsProps {
  job: JobRead;
  onViewCandidates: (jobId: string) => void;
  onManageStages: (job: JobRead) => void;
  onEdit: (job: JobRead) => void;
  onDelete: (job: JobRead) => void;
}

const JobActionButtons = ({
  job,
  onViewCandidates,
  onManageStages,
  onEdit,
  onDelete,
}: JobActionButtonsProps) => {
  return (
    <div className="d-flex gap-2 justify-content-end align-items-center flex-nowrap">
      <QuickResumeUpload jobId={job.id} variant="outline-primary" size="sm" />
      <Button
        variant="outline-primary"
        size="sm"
        className="flex-shrink-0"
        onClick={() => onViewCandidates(job.id)}
      >
        Candidates
      </Button>
      <Button
        variant="outline-secondary"
        size="sm"
        className="flex-shrink-0"
        onClick={() => onManageStages(job)}
      >
        Stages
      </Button>
      <Button
        variant="outline-secondary"
        size="sm"
        className="flex-shrink-0"
        onClick={() => onEdit(job)}
      >
        Edit
      </Button>
      <Button
        variant="outline-danger"
        size="sm"
        className="flex-shrink-0"
        onClick={() => onDelete(job)}
      >
        Delete
      </Button>
    </div>
  );
};

export default JobActionButtons;

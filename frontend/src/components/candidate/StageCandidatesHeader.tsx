import { Button } from "@/components/";
import AppPageHeader from "@/components/shared/AppPageHeader";
import type { Job } from "@/types/job";

interface StageCandidatesHeaderProps {
  /** Associated job for the candidate stage view */
  job: Job | null;
  /** Callback for back navigation */
  onBack: () => void;
  /** Callback for info button click */
  onInfoClick: () => void;
}

/**
 * Header component for candidate stage evaluation pages.
 * Displays job title with back navigation and info button.
 */
export const StageCandidatesHeader = ({
  job,
  onBack,
  onInfoClick,
}: StageCandidatesHeaderProps) => {
  return (
    <AppPageHeader
      title={job?.title || "Loading..."}
      backAction={{ label: "Back to Candidates", onClick: onBack }}
      meta={
        <span className="font-semibold text-blue-500">
          {job?.department_name || "Department"}
        </span>
      }
      actions={
        <Button
          variant="secondary"
          className="rounded-xl border border-muted-foreground/10 px-5 font-semibold"
          onClick={onInfoClick}
        >
          Info
        </Button>
      }
    />
  );
};

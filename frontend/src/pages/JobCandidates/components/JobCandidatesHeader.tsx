import { Link, useNavigate } from "react-router-dom";
import { PageHeader, Button } from "@/components/shared";
import QuickResumeUpload from "@/components/candidate/QuickResumeUpload";
import type { Job } from "@/types/job";

interface JobCandidatesHeaderProps {
  jobId: string | undefined;
  job: Job | null;
  onRefresh: () => void;
  onShowJobInfo: () => void;
}

const JobCandidatesHeader = ({
  jobId,
  job,
  onRefresh,
  onShowJobInfo,
}: JobCandidatesHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-4">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2">
            <li>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                Jobs
              </Link>
            </li>
            <li className="text-muted-foreground">/</li>
            <li className="text-sm font-medium">
              {job?.title}
            </li>
          </ol>
        </nav>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-border mb-4">
        <PageHeader
          title={`Results for ${job?.title}`}
          subtitle={`${job?.department?.name} | ${job?.is_active ? "Active" : "Inactive"}`}
          className="mb-0 border-0 p-0 shadow-none"
          actions={
            <div className="flex gap-2 items-center">
              {jobId && <QuickResumeUpload jobId={jobId} onSuccess={onRefresh} className="btn-header-action" />}
              <Button variant="outline" onClick={onShowJobInfo} className="btn-header-action">
                Job Details
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="btn-header-action">
                Back to Jobs
              </Button>
            </div>
          }
        />
      </div>
    </>
  );
};

export default JobCandidatesHeader;

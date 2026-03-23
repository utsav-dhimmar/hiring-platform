import { Link, useNavigate } from "react-router-dom";
import { Breadcrumb, Button } from "react-bootstrap";
import { PageHeader } from "@/components/shared";
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
        <Breadcrumb className="bg-transparent p-0 mb-2">
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>
            Jobs
          </Breadcrumb.Item>
          <Breadcrumb.Item active className="text-muted fw-medium">
            {job?.title}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <div className="bg-white p-4 rounded-4 shadow-sm border border-light mb-4">
        <PageHeader
          title={`Results for ${job?.title}`}
          subtitle={`${job?.department?.name} | ${job?.is_active ? "Active" : "Inactive"}`}
          className="mb-0 border-0 p-0 shadow-none"
          actions={
            <div className="d-flex gap-2 align-items-center">
              {jobId && <QuickResumeUpload jobId={jobId} onSuccess={onRefresh} variant="primary" />}
              <Button variant="outline-primary" onClick={onShowJobInfo}>
                Job Details
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate("/")}>
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

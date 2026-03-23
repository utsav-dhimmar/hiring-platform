import type { ReactElement } from "react";
import { Badge } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { AdminDataTable, type Column, StatusBadge, Button, DateDisplay } from "@/components/shared";
import type { HRRoundResult } from "@/types/admin";

interface HRRoundTableProps {
  results: HRRoundResult[];
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
  jobId?: string;
  className?: string;
}

const HRRoundTable = ({
  results,
  loading,
  error,
  onRetry,
  jobId,
  className,
}: HRRoundTableProps): ReactElement => {
  const navigate = useNavigate();

  const columns: Column<HRRoundResult>[] = [
    {
      header: "Candidate Name",
      accessor: (r) => (
        <strong>{`${r.first_name || ""} ${r.last_name || ""}`.trim() || "N/A"}</strong>
      ),
    },
    { header: "Email", accessor: "email" },
    {
      header: "Interview Status",
      accessor: (r) => (
        <Badge
          bg={
            r.status === "completed" ? "success" : r.status === "pending" ? "warning" : "secondary"
          }
          className={`px-3 py-2 rounded-pill bg-${r.status === "completed" ? "success" : r.status === "pending" ? "warning" : "secondary"
            }-subtle text-${r.status === "completed" ? "success" : r.status === "pending" ? "warning" : "secondary"
            }`}
        >
          {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
        </Badge>
      ),
    },
    {
      header: "HR Score",
      accessor: (r) =>
        r.overall_score !== undefined && r.overall_score !== null ? (
          <Badge
            bg={r.overall_score >= 65 ? "success" : "warning"}
            className={`px-3 py-2 rounded-pill bg-${r.overall_score >= 65 ? "success" : "warning"
              }-subtle text-${r.overall_score >= 65 ? "success" : "warning"}`}
          >
            {r.overall_score.toFixed(1)}/100
          </Badge>
        ) : (
          <span className="text-muted">N/A</span>
        ),
    },
    {
      header: "Recommendation",
      accessor: (r) => (
        <StatusBadge
          status={
            r.recommendation === "PROCEED"
              ? "pass"
              : r.recommendation === "REJECT"
                ? "fail"
                : "pending"
          }
          mapping={{
            pass: "success",
            fail: "danger",
            pending: "secondary",
          }}
        />
      ),
    },
    {
      header: "Interview Date",
      accessor: (r) => <DateDisplay date={r.scheduled_at} showTime={false} />,
    },
    {
      header: "Actions",
      className: "text-end text-nowrap",
      accessor: (r) => (
        <div className="d-flex gap-2 justify-content-end align-items-center flex-nowrap">
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => navigate(`/admin/jobs/${jobId}/candidates/${r.candidate_id}/evaluation`)}
          >
            View Evaluation
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminDataTable
      columns={columns}
      data={results}
      loading={loading}
      error={error || null}
      onRetry={onRetry}
      rowKey="interview_id"
      emptyMessage="No HR round interviews found for this job."
      className={className}
    />
  );
};

export default HRRoundTable;

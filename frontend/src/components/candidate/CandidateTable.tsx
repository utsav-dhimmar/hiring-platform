import type { ReactElement } from "react";
import { Badge, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  AdminDataTable,
  type Column,
  StatusBadge,
  Button,
  DateDisplay,
} from "@/components/shared";
import type { CandidateResponse } from "@/types/resume";

/**
 * Props for the CandidateTable component.
 */
interface CandidateTableProps {
  /** Array of candidate records to display */
  candidates: CandidateResponse[];
  /** Whether the table is in a loading state */
  loading: boolean;
  /** Optional error message to display */
  error?: string | null;
  /** Total number of candidates (for pagination) */
  total?: number;
  /** Current page number */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Callback when page is changed */
  onPageChange?: (page: number) => void;
  /** Callback to retry data fetching on error */
  onRetry: () => void;
  /** Message to show when no candidates match filters */
  emptyMessage?: string;
  /** Callback when a candidate's "Show More" or "View Details" is clicked */
  onShowMore: (candidate: CandidateResponse) => void;
  /** Callback when a candidate's "Screening Details" is clicked */
  onShowScreeningDetails: (candidate: CandidateResponse) => void;
  /** Callback when a candidate is deleted */
  onDelete?: (candidate: CandidateResponse) => void;
  /** Whether to show the "Evaluate" action button */
  showEvaluateAction?: boolean;
  /** Optional job ID context for evaluations */
  jobId?: string;
  /** Additional CSS class for the wrapper */
  className?: string;
}

/**
 * Table component for displaying and managing a list of candidates.
 * Supports pagination, searching (via parent), and contextual actions.
 */
const CandidateTable = ({
  candidates,
  loading,
  error,
  total,
  page,
  pageSize,
  onPageChange,
  onRetry,
  emptyMessage,
  onShowMore,
  onShowScreeningDetails,
  onDelete,
  showEvaluateAction = false,
  jobId,
  className,
}: CandidateTableProps): ReactElement => {
  const navigate = useNavigate();

  // Silence unused variable warnings for jobId if it's not used in this specific view but kept for API consistency
  void jobId;
  void navigate;

  const columns: Column<CandidateResponse>[] = [
    {
      header: "Name",
      accessor: (c) => (
        <strong>
          {c.is_parsed ? (
            `${c.first_name || ""} ${c.last_name || ""}`.trim() || "N/A"
          ) : (
            <span className="text-muted fst-italic">Processing...</span>
          )}
        </strong>
      ),
    },
    { header: "Email", accessor: "email" },
    {
      header: "Score",
      accessor: (c) =>
        c.resume_score !== null ? (
          <Badge
            bg={c.resume_score >= 65 ? "success" : "warning"}
            className={`px-3 py-2 rounded-pill bg-${c.resume_score >= 65 ? "success" : "warning"}-subtle text-${c.resume_score >= 65 ? "success" : "warning"
              }`}
          >
            {c.resume_score.toFixed(1)}%
          </Badge>
        ) : (
          <span className="text-muted">N/A</span>
        ),
    },
    {
      header: "Result",
      style: { width: "120px", minWidth: "120px" },
      accessor: (c) => (
        <StatusBadge
          status={
            c.pass_fail === null ? "pending" : c.pass_fail ? "pass" : "fail"
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
      header: "Status",
      style: { width: "150px", minWidth: "150px" },
      accessor: (c) => {
        const status = c.processing_status;
        if (status === "processing" || status === "queued") {
          return (
            <Badge bg="info" className="d-inline-flex align-items-center gap-1">
              <Spinner animation="border" size="sm" />
              Processing
            </Badge>
          );
        }
        return (
          <StatusBadge status={status === "failed" ? "failed" : "completed"} />
        );
      },
    },
    {
      header: "Applied At",
      accessor: (c) => <DateDisplay date={c.created_at} showTime={false} />,
    },
    {
      header: "Actions",
      className: "text-end text-nowrap",
      style: { width: "350px" },
      accessor: (c) => (
        <div className="d-flex gap-2 justify-content-end align-items-center flex-nowrap">
          <Button
            variant="outline-primary"
            size="sm"
            className="flex-shrink-0"
            onClick={() => onShowMore(c)}
          >
            {showEvaluateAction ? "Show More" : "View Details"}
          </Button>
          {onDelete && (
            <Button
              variant="outline-danger"
              size="sm"
              className="flex-shrink-0"
              onClick={() => onDelete(c)}
            >
              Delete
            </Button>
          )}
          {/* {showEvaluateAction && jobId && c.pass_fail !== false && c.processing_status !== "failed" && (
            <Button
              variant="primary"
              size="sm"
              className="flex-shrink-0"
              onClick={() =>
                navigate(`/admin/jobs/${jobId}/candidates/${c.id}/evaluation`)
              }
              disabled={
                c.processing_status === "processing" ||
                c.processing_status === "queued"
              }
            >
              Evaluate
            </Button>
          )} */}
        </div>
      ),
    },
  ];

  const paginationProps =
    total !== undefined &&
      page !== undefined &&
      pageSize !== undefined &&
      onPageChange
      ? { total, page, pageSize, onPageChange }
      : {};

  return (
    <AdminDataTable
      columns={columns}
      data={candidates}
      loading={loading}
      error={error || null}
      onRetry={onRetry}
      rowKey="id"
      emptyMessage={emptyMessage || "No candidates found."}
      className={className}
      {...paginationProps}
    />
  );
};

export default CandidateTable;

import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  AdminDataTable,
  type Column,
  StatusBadge,
  Button,
  DateDisplay,
} from "@/components/shared";
import { Badge } from "@/components/ui/badge";
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

  void jobId;
  void navigate;
  void onShowScreeningDetails;

  const columns: Column<CandidateResponse>[] = [
    {
      header: "Name",
      accessor: (c) => (
        <strong>
          {c.is_parsed ? (
            `${c.first_name || ""} ${c.last_name || ""}`.trim() || "N/A"
          ) : (
            <span className="text-muted-foreground italic">Processing...</span>
          )}
        </strong>
      ),
    },
    { header: "Email", accessor: "email" },
    {
      header: "Score",
      accessor: (c) =>
        c.resume_score !== null ? (
          <Badge variant={c.resume_score >= 65 ? "default" : "secondary"} className="px-3 py-1">
            {c.resume_score.toFixed(1)}%
          </Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
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
            pass: "default",
            fail: "destructive",
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
            <Badge variant="secondary" className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
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
      className: "text-end whitespace-nowrap",
      style: { width: "350px" },
      accessor: (c) => (
        <div className="flex gap-2 justify-end items-center">
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0"
            onClick={() => onShowMore(c)}
          >
            {showEvaluateAction ? "Show More" : "View Details"}
          </Button>
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 text-red-500 hover:text-red-600"
              onClick={() => onDelete(c)}
            >
              Delete
            </Button>
          )}
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

/**
 * CandidateSearchTable — thin wrapper around the unified CandidateTable.
 *
 * Retains server-side pagination support for the admin candidate search page
 * while using the same column layout as the dashboard JobCandidates view.
 */
import { type ReactElement } from "react";
import type { CandidateResponse } from "@/types/resume";
import type { PaginationState, OnChangeFn } from "@tanstack/react-table";
import CandidateTable from "@/components/candidate/CandidateTable";
import { Button } from "@/components/ui/button";

interface CandidateSearchTableProps {
  candidates: CandidateResponse[];
  total: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  onShowMore: (candidate: CandidateResponse) => void;
  onShowScreeningDetails: (candidate: CandidateResponse) => void;
  onDelete: (candidate: CandidateResponse) => void;
}

const CandidateSearchTable = ({
  candidates,
  total,
  pagination,
  onPaginationChange,
  onShowMore,
}: CandidateSearchTableProps): ReactElement => {
  return (
    <CandidateTable
      candidates={candidates}
      total={total}
      isServerSide={true}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      pageCount={Math.ceil(total / pagination.pageSize)}
      renderActions={(candidate) => (
        <Button
          variant="secondary"
          size="sm"
          className="rounded-xl font-semibold h-9 px-4 bg-muted/50 hover:bg-muted text-foreground transition-all border border-muted-foreground/10"
          title="View Details"
          onClick={() => onShowMore(candidate)}
        >
          More Info
        </Button>
      )}
    />
  );
};

export default CandidateSearchTable;

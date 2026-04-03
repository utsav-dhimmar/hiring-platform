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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Info } from "lucide-react";

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
        <HoverCard>
          <HoverCardTrigger
            render={(props) => (
              <Button
                {...props}
                variant="secondary"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl bg-muted/50 hover:bg-muted text-foreground transition-all duration-300 border border-muted-foreground/10 flex items-center justify-center shrink-0"
                onClick={() => onShowMore(candidate)}
              >
                <Info className="h-4 w-4 shrink-0" />
              </Button>
            )}
          />
          <HoverCardContent side="top" className="w-auto p-2 min-w-0">
            <div className="text-sm font-semibold">More Info</div>
          </HoverCardContent>
        </HoverCard>
      )}
    />
  );
};

export default CandidateSearchTable;

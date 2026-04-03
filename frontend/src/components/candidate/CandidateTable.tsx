/**
 * Unified CandidateTable component.
 *
 * Renders a consistent candidate table across all pages in the hiring platform.
 * Columns: Candidate (name · email · phone), Score, Status, Socials, Applied At, Location, Actions.
 *
 * Front-end filters: name search, status dropdown, location dropdown, applied-at date range.
 * All optional fields (location, applied_at, phone) safely fall back to "N/A".
 */

import type { PaginationState, OnChangeFn } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { useCandidateTableFilters } from "@/hooks/useCandidateTableFilters";
import { useCandidateTableColumns } from "./CandidateTableColumns";
import { CandidateTableFilters } from "./CandidateTableFilters";
import type { UnifiedCandidate } from "@/types/candidate";

export interface CandidateTableProps<T extends UnifiedCandidate> {
  candidates: T[];
  total?: number;
  renderActions?: (candidate: T) => React.ReactNode;
  headerActions?: React.ReactNode;
  isServerSide?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  pageCount?: number;
}

export function CandidateTable<T extends UnifiedCandidate>({
  candidates,
  total,
  renderActions,
  headerActions,
  isServerSide = false,
  pagination,
  onPaginationChange,
  pageCount,
}: CandidateTableProps<T>) {
  const {
    nameFilter,
    setNameFilter,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    hrDecisionFilter,
    setHrDecisionFilter,
    dateRange,
    setDateRange,
    statusOptions,
    locationOptions,
    filteredCandidates,
    hasActiveFilters,
    clearFilters,
  } = useCandidateTableFilters(candidates);

  const columns = useCandidateTableColumns({
    renderActions,
  });

  return (
    <div className="w-full space-y-3">
      <CandidateTableFilters
        nameFilter={nameFilter}
        setNameFilter={setNameFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        dateRange={dateRange}
        setDateRange={setDateRange}
        hrDecisionFilter={hrDecisionFilter}
        setHrDecisionFilter={setHrDecisionFilter}
        statusOptions={statusOptions}
        locationOptions={locationOptions}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        resultCount={filteredCandidates.length}
        totalCount={total != null && total !== candidates.length ? total : candidates.length}
      />

      <DataTable
        columns={columns}
        data={filteredCandidates}
        headerActions={headerActions}
        isServerSide={isServerSide}
        pageIndex={pagination?.pageIndex}
        pageSize={pagination?.pageSize}
        pageCount={pageCount}
        onPaginationChange={onPaginationChange}
      />
    </div>
  );
}

export default CandidateTable;

import { useMemo, useState } from "react";
import { startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { UnifiedCandidate } from "@/types/candidate";
import { toTitleCase } from "@/lib/utils";

export const useCandidateTableFilters = <T extends UnifiedCandidate>(
  candidates: T[],
  externalNameFilter?: string,
  onNameFilterChange?: (val: string) => void
) => {
  const [internalNameFilter, setInternalNameFilter] = useState("");

  const nameFilter = externalNameFilter !== undefined ? externalNameFilter : internalNameFilter;
  const setNameFilter = onNameFilterChange !== undefined ? onNameFilterChange : setInternalNameFilter;
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [hrDecisionFilter, setHrDecisionFilter] = useState<string[]>([]);
  const [jobFilter, setJobFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      const s = c.processing_status || c.current_status;
      if (s) set.add(s);
    });
    return Array.from(set).sort();
  }, [candidates]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.location) {
        // Normalize to Title Case for display consistency
        const normalized = toTitleCase(c.location.trim());
        if (normalized) set.add(normalized);
      }
    });
    return Array.from(set).sort();
  }, [candidates]);

  const jobOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.job_name) {
        set.add(c.job_name.trim());
      }
    });
    return Array.from(set).sort();
  }, [candidates]);

  const minDate = useMemo(() => {
    if (candidates.length === 0) return new Date();
    let min = new Date();
    candidates.forEach((c) => {
      const d = c.applied_at || c.created_at;
      if (d) {
        const date = new Date(d);
        if (date < min) min = date;
      }
    });
    return min;
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Name / email filter
      const fullName = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase().trim();
      const email = (c.email || "").toLowerCase();
      if (
        nameFilter &&
        !fullName.includes(nameFilter.toLowerCase()) &&
        !email.includes(nameFilter.toLowerCase())
      ) {
        return false;
      }

      // Status filter (multi-select)
      if (statusFilter.length > 0) {
        const candidateStatus = c.processing_status || c.current_status || "";
        if (!statusFilter.includes(candidateStatus)) return false;
      }

      // Location filter (multi-select) - Case-insensitive comparison
      if (locationFilter.length > 0) {
        const candidateLocation = (c.location || "").trim().toLowerCase();
        const isMatched = locationFilter.some(
          (filterLoc) => filterLoc.toLowerCase() === candidateLocation
        );
        if (!isMatched) return false;
      }

      // Job filter (multi-select)
      if (jobFilter.length > 0) {
        const candidateJob = (c.job_name || "").trim();
        if (!jobFilter.includes(candidateJob)) return false;
      }

      // Date range filter
      const rawDate = c.applied_at || c.created_at;
      if (rawDate && (dateRange?.from || dateRange?.to)) {
        const d = new Date(rawDate);
        if (dateRange.from && d < startOfDay(dateRange.from)) return false;
        if (dateRange.to && d > endOfDay(dateRange.to)) return false;
      }

      // HR Decision filter (multi-select)
      if (hrDecisionFilter.length > 0) {
        const decision = c.hr_decision?.toLowerCase() || "pending";
        if (!hrDecisionFilter.includes(decision)) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, nameFilter, statusFilter, locationFilter, hrDecisionFilter, jobFilter, dateRange]);

  const hasActiveFilters =
    !!nameFilter ||
    statusFilter.length > 0 ||
    locationFilter.length > 0 ||
    hrDecisionFilter.length > 0 ||
    jobFilter.length > 0 ||
    !!dateRange?.from ||
    !!dateRange?.to;

  const clearFilters = () => {
    setNameFilter("");
    setStatusFilter([]);
    setLocationFilter([]);
    setHrDecisionFilter([]);
    setJobFilter([]);
    setDateRange({ from: undefined, to: undefined });
  };

  return {
    nameFilter,
    setNameFilter,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    hrDecisionFilter,
    setHrDecisionFilter,
    jobFilter,
    setJobFilter,
    dateRange,
    setDateRange,
    statusOptions,
    locationOptions,
    jobOptions,
    minDate,
    filteredCandidates,
    hasActiveFilters,
    clearFilters,
  };
};

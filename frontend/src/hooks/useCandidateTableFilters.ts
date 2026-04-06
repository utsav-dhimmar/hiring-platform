import { useMemo, useState } from "react";
import { startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { UnifiedCandidate } from "@/types/candidate";

export const useCandidateTableFilters = <T extends UnifiedCandidate>(candidates: T[]) => {
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [hrDecisionFilter, setHrDecisionFilter] = useState<string[]>([]);
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
      if (c.location) set.add(c.location);
    });
    return Array.from(set).sort();
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

      // Location filter (multi-select)
      if (locationFilter.length > 0) {
        const candidateLocation = c.location || "";
        if (!locationFilter.includes(candidateLocation)) return false;
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
  }, [candidates, nameFilter, statusFilter, locationFilter, hrDecisionFilter, dateRange]);

  const hasActiveFilters =
    !!nameFilter ||
    statusFilter.length > 0 ||
    locationFilter.length > 0 ||
    hrDecisionFilter.length > 0 ||
    !!dateRange?.from ||
    !!dateRange?.to;

  const clearFilters = () => {
    setNameFilter("");
    setStatusFilter([]);
    setLocationFilter([]);
    setHrDecisionFilter([]);
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
    dateRange,
    setDateRange,
    statusOptions,
    locationOptions,
    filteredCandidates,
    hasActiveFilters,
    clearFilters,
  };
};

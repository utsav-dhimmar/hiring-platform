import { useMemo, useState } from "react";
import { startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { UnifiedCandidate } from "@/types/candidate";

export const useCandidateTableFilters = <T extends UnifiedCandidate>(candidates: T[]) => {
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [hrDecisionFilter, setHrDecisionFilter] = useState<string>("all");
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

      // Status filter
      if (statusFilter !== "all") {
        const candidateStatus = c.processing_status || c.current_status || "";
        if (candidateStatus !== statusFilter) return false;
      }

      // Location filter
      if (locationFilter !== "all" && (c.location || "") !== locationFilter) {
        return false;
      }

      // Date range filter
      const rawDate = c.applied_at || c.created_at;
      if (rawDate && (dateRange?.from || dateRange?.to)) {
        const d = new Date(rawDate);
        if (dateRange.from && d < startOfDay(dateRange.from)) return false;
        if (dateRange.to && d > endOfDay(dateRange.to)) return false;
      }

      // HR Decision filter
      if (hrDecisionFilter !== "all") {
        if (hrDecisionFilter === "pending") {
          if (c.hr_decision) return false;
        } else if (c.hr_decision !== hrDecisionFilter) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, nameFilter, statusFilter, locationFilter, hrDecisionFilter, dateRange]);

  const hasActiveFilters =
    !!nameFilter ||
    statusFilter !== "all" ||
    locationFilter !== "all" ||
    hrDecisionFilter !== "all" ||
    !!dateRange?.from ||
    !!dateRange?.to;

  const clearFilters = () => {
    setNameFilter("");
    setStatusFilter("all");
    setLocationFilter("all");
    setHrDecisionFilter("all");
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

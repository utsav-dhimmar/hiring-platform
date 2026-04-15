import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { UnifiedCandidate } from "@/types/candidate";
import { toTitleCase } from "@/lib/utils";
import { adminLocationService } from "@/apis/admin/location";
import jobService from "@/apis/job";
import { slugify } from "@/utils/slug";

export const useCandidateTableFilters = <T extends UnifiedCandidate>(
  candidates: T[],
  externalNameFilter?: string,
  onNameFilterChange?: (val: string) => void
) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [internalNameFilter, setInternalNameFilter] = useState(() => searchParams.get("q") || "");

  const nameFilter = externalNameFilter !== undefined ? externalNameFilter : internalNameFilter;
  const setNameFilter = onNameFilterChange !== undefined ? onNameFilterChange : setInternalNameFilter;

  const [statusFilter, setStatusFilter] = useState<string[]>(() => searchParams.getAll("status"));
  const [locationFilter, setLocationFilter] = useState<string[]>(() => searchParams.getAll("city"));
  const [hrDecisionFilter, setHrDecisionFilter] = useState<string[]>(() => searchParams.getAll("hr_decision"));

  // jobFilter stores IDs internally for filtering and API calls, but we sync slugs to URL
  const [jobFilter, setJobFilter] = useState<string[]>([]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    return {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    };
  });

  const [locationOptions, setLocationOptions] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState("");

  const [jobOptions, setJobOptions] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [jobSearch, setJobSearch] = useState("");

  // Map to resolve slugs from URL back to IDs
  const [allJobs, setAllJobs] = useState<{ id: string; slug: string }[]>([]);

  // Fetch initial mapping for all jobs to resolve slugs from URL
  useEffect(() => {
    const fetchAllJobs = async () => {
      try {
        const response = await jobService.getJobs(0, 100);
        const mapping = response.data.map(j => ({ id: j.id, slug: slugify(j.title) }));
        setAllJobs(mapping);

        // Once mapping is loaded, initialize jobFilter from slugs in URL
        const jobSlugs = searchParams.getAll("job");
        if (jobSlugs.length > 0) {
          const ids = jobSlugs
            .map(slug => mapping.find(m => m.slug === slug)?.id)
            .filter((id): id is string => !!id);
          setJobFilter(ids);
        }
      } catch (error) {
        console.error("Failed to fetch jobs for slug resolution:", error);
      }
    };
    fetchAllJobs();
  }, []); // Only once on mount

  // Sync state from URL when URL changes (e.g. back/forward navigation)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    if (q !== internalNameFilter) setInternalNameFilter(q);

    const status = searchParams.getAll("status");
    if (JSON.stringify(status) !== JSON.stringify(statusFilter)) setStatusFilter(status);

    const city = searchParams.getAll("city");
    if (JSON.stringify(city) !== JSON.stringify(locationFilter)) setLocationFilter(city);

    const hr = searchParams.getAll("hr_decision");
    if (JSON.stringify(hr) !== JSON.stringify(hrDecisionFilter)) setHrDecisionFilter(hr);

    const jobSlugs = searchParams.getAll("job");
    if (allJobs.length > 0) {
      const ids = jobSlugs
        .map(slug => allJobs.find(m => m.slug === slug)?.id)
        .filter((id): id is string => !!id);
      if (JSON.stringify(ids) !== JSON.stringify(jobFilter)) {
        setJobFilter(ids);
      }
    }

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    if (fromDate?.getTime() !== dateRange?.from?.getTime() || toDate?.getTime() !== dateRange?.to?.getTime()) {
      setDateRange({ from: fromDate, to: toDate });
    }
  }, [searchParams, allJobs]);

  // Update URL search params when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Helper to update multi-value params
    const updateParam = (key: string, values: string[]) => {
      params.delete(key);
      values.forEach((v) => params.append(key, v));
    };

    if (nameFilter) params.set("q", nameFilter);
    else params.delete("q");

    updateParam("status", statusFilter);
    updateParam("city", locationFilter);
    updateParam("hr_decision", hrDecisionFilter);

    // Sync job IDs to slugs in URL
    const jobSlugs = jobFilter
      .map(id => allJobs.find(m => m.id === id)?.slug || jobOptions.find(o => o.id === id)?.slug)
      .filter((slug): slug is string => !!slug);
    updateParam("job", jobSlugs);

    if (dateRange?.from) params.set("from", dateRange.from.toISOString());
    else params.delete("from");
    if (dateRange?.to) params.set("to", dateRange.to.toISOString());
    else params.delete("to");

    // Only update if something actually changed to avoid unnecessary re-renders
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [nameFilter, statusFilter, locationFilter, hrDecisionFilter, jobFilter, dateRange, setSearchParams, searchParams, allJobs, jobOptions]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const fetchLocations = async () => {
        try {
          const response = await adminLocationService.getAllLocations(0, 500, locationSearch);
          const names = response.data.map((loc) => toTitleCase(loc.name.trim()));
          // Ensure unique and sorted names
          const uniqueNames = Array.from(new Set(names)).sort();
          setLocationOptions(uniqueNames);
        } catch (error) {
          console.error("Failed to fetch locations for filter:", error);
        }
      };
      fetchLocations();
    }, 300); // 300ms debounce

    return () => clearTimeout(handler);
  }, [locationSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const fetchJobs = async () => {
        try {
          const response = await jobService.getJobs(0, 100, jobSearch);
          const options = response.data.map((job) => ({
            id: job.id,
            title: job.title.trim(),
            slug: slugify(job.title),
          }));
          setJobOptions(options);
        } catch (error) {
          console.error("Failed to fetch jobs for filter:", error);
        }
      };
      fetchJobs();
    }, 300);

    return () => clearTimeout(handler);
  }, [jobSearch]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      const s = c.processing_status || c.current_status;
      if (s) set.add(s);
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
        const candidateJobId = c.applied_job_id || "";
        if (!jobFilter.includes(candidateJobId)) return false;
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
    setJobSearch("");
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
    locationSearch,
    setLocationSearch,
    jobSearch,
    setJobSearch,
    minDate,
    filteredCandidates,
    hasActiveFilters,
    clearFilters,
  };
};

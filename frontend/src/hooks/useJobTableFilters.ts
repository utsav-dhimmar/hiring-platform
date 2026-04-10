import { useMemo, useState } from "react";
import { startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Job } from "@/types/job";

export const useJobTableFilters = (jobs: Job[]) => {
  const [titleFilter, setTitleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const minDate = useMemo(() => {
    if (jobs.length === 0) return new Date();
    const dates = jobs.map((job) => new Date(job.created_at).getTime());
    return new Date(Math.min(...dates));
  }, [jobs]);
  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.department?.name) set.add(j.department.name);
      else if (j.department_name) set.add(j.department_name);
    });
    return Array.from(set).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      // Title search is handled server-side via the 'q' parameter.

      // Status filter
      if (statusFilter.length > 0) {
        const jobStatus = j.is_active ? "active" : "inactive";
        if (!statusFilter.includes(jobStatus)) return false;
      }

      // Department filter
      if (departmentFilter.length > 0) {
        const dept = j.department?.name || j.department_name || "";
        if (!departmentFilter.includes(dept)) return false;
      }

      // Date range filter (created_at)
      if (j.created_at && (dateRange?.from || dateRange?.to)) {
        const d = new Date(j.created_at);
        if (dateRange.from && d < startOfDay(dateRange.from)) return false;
        if (dateRange.to && d > endOfDay(dateRange.to)) return false;
      }

      return true;
    });
  }, [jobs, titleFilter, statusFilter, departmentFilter, dateRange]);

  const hasActiveFilters =
    !!titleFilter ||
    statusFilter.length > 0 ||
    departmentFilter.length > 0 ||
    !!dateRange?.from ||
    !!dateRange?.to;

  const clearFilters = () => {
    setTitleFilter("");
    setStatusFilter([]);
    setDepartmentFilter([]);
    setDateRange({ from: undefined, to: undefined });
  };

  return {
    titleFilter,
    setTitleFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    dateRange,
    setDateRange,
    departmentOptions,
    filteredJobs,
    hasActiveFilters,
    clearFilters,
    minDate
  };
};

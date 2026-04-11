import { useMemo, useState, useEffect } from "react";
import { startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { Job } from "@/types/job";
import { adminDepartmentService } from "@/apis/admin/department";

export const useJobTableFilters = (jobs: Job[]) => {
  const [titleFilter, setTitleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [departmentSearch, setDepartmentSearch] = useState("");

  const minDate = useMemo(() => {
    if (jobs.length === 0) return new Date();
    const dates = jobs.map((job) => new Date(job.created_at).getTime());
    return new Date(Math.min(...dates));
  }, [jobs]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const fetchDepartments = async () => {
        try {
          const response = await adminDepartmentService.getAllDepartments(0, 500, departmentSearch);
          const names = response.data.map((dept) => dept.name.trim());
          const uniqueNames = Array.from(new Set(names)).sort();
          setDepartmentOptions(uniqueNames);
        } catch (error) {
          console.error("Failed to fetch departments for filter:", error);
        }
      };
      fetchDepartments();
    }, 300);

    return () => clearTimeout(handler);
  }, [departmentSearch]);

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
    departmentSearch,
    setDepartmentSearch,
    filteredJobs,
    hasActiveFilters,
    clearFilters,
    minDate
  };
};

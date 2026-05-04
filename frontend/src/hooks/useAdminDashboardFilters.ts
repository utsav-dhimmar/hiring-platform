import { useState, useMemo, useCallback } from "react";
import type { HiringReport, JobPipelineStats } from "@/types/admin";
import type { JobTitle } from "@/types/job";

// Types
export interface FilterState {
  jobIds: string[];
  stages: string[];
  departments: string[];
}

type PipelineStatsItem = JobPipelineStats & Record<string, number | undefined>;

const INITIAL_FILTERS: FilterState = {
  jobIds: [],
  stages: [],
  departments: [],
};

// helper functions 
const buildLookupMap = (items: { title: string; id: string }[]) => {
  const map: Record<string, string> = {};
  for (const item of items) map[item.title] = item.id;
  return map;
};

// helper functions 
const buildDeptMap = (candidates: HiringReport["candidates_by_job"]) => {
  const map: Record<string, string> = {};
  for (const item of candidates) {
    if (item.job_title && item.department) {
      map[item.job_title] = item.department;
    }
  }
  return map;
};

// helper functions 
const extractDepartments = (candidates: HiringReport["candidates_by_job"]): string[] => {
  const deps = new Set<string>();
  for (const item of candidates) {
    if (item.department) deps.add(item.department);
  }
  return Array.from(deps).sort();
};

export const useAdminDashboardFilters = (
  report: HiringReport | undefined,
  jobs: JobTitle[]
) => {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Lookup maps
  const jobTitleToId = useMemo(() => buildLookupMap(jobs), [jobs]);
  const jobToDept = useMemo(
    () => (report ? buildDeptMap(report.candidates_by_job) : {}),
    [report]
  );

  // Derived: departments
  const departments = useMemo(
    () => (report ? extractDepartments(report.candidates_by_job) : []),
    [report]
  );

  // Derived: filtered jobs for dropdown
  const filteredJobs = useMemo(() => {
    if (!report || filters.departments.length === 0) return jobs;

    const validTitles = new Set(
      report.candidates_by_job
        .filter((c) => c.job_title && c.department && filters.departments.includes(c.department))
        .map((c) => c.job_title)
    );

    return jobs.filter((j) => validTitles.has(j.title));
  }, [jobs, filters.departments, report]);

  // Derived: filtered report
  const filteredReport = useMemo(() => {
    if (!report) return null;

    const hasFilters = Object.values(filters).some((arr) => arr.length > 0);
    if (!hasFilters) return report;

    // 1. Filter pipeline stats (for the chart only)
    // Find the item that contains the full list of job names
    const namesHolder = report.job_pipeline_stats.find((item) => item.job_names);
    const allJobNames = namesHolder?.job_names || [];

    const filteredJobNames = allJobNames.filter((name) => {
      const dept = jobToDept[name];
      const id = jobTitleToId[name];
      return (
        (filters.departments.length === 0 || (dept && filters.departments.includes(dept))) &&
        (filters.jobIds.length === 0 || (id && filters.jobIds.includes(id)))
      );
    });

    const jobPipelineStats = report.job_pipeline_stats
      .map((item): PipelineStatsItem | null => {
        // If filtering by stage, only keep the selected stages
        if (filters.stages.length > 0 && item.stage && !filters.stages.includes(item.stage)) {
          return null;
        }

        const newItem: PipelineStatsItem = { ...item };

        // If it's a data point (has stage), remove non-filtered jobs
        if (item.stage) {
          allJobNames.forEach(name => {
            if (!filteredJobNames.includes(name)) {
              delete newItem[name];
            }
          });
          // Only keep the stage if at least one filtered job has candidates
          return filteredJobNames.some(name => (newItem[name] ?? 0) > 0) ? newItem : null;
        }

        // If it's the names holder (has job_names), update it
        if (item.job_names) {
          newItem.job_names = filteredJobNames;
          return filteredJobNames.length > 0 ? newItem : null;
        }

        return newItem;
      })
      .filter((item): item is PipelineStatsItem => item !== null);

    return {
      ...report,
      job_pipeline_stats: jobPipelineStats,
    };
  }, [report, filters, jobToDept, jobTitleToId]);

  // Actions
  const hasActiveFilters = Object.values(filters).some((arr) => arr.length > 0);

  const resetFilters = useCallback(() => setFilters(INITIAL_FILTERS), []);

  const toggleFilter = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K][number]) => {
      setFilters((prev) => {
        const arr = prev[key];
        const newArr = arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value];

        // Clear jobIds when departments change
        const resetJobs = key === "departments" ? { jobIds: [] as string[] } : {};
        return { ...prev, [key]: newArr, ...resetJobs };
      });
    },
    []
  );

  const setFilter = useCallback(
    <K extends keyof FilterState>(key: K, values: FilterState[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: values,
        // Clear jobIds ONLY if we are explicitly changing departments to something else
        ...(key === "departments" ? { jobIds: [] as string[] } : {}),
      }));
    },
    []
  );

  const clearFilter = useCallback(
    <K extends keyof FilterState>(key: K) => {
      setFilters((prev) => ({
        ...prev,
        [key]: [] as any,
        ...(key === "departments" ? { jobIds: [] as string[] } : {}),
      }));
    },
    []
  );

  return {
    filters,
    departments,
    filteredJobs,
    filteredReport,
    hasActiveFilters,
    resetFilters,
    toggleFilter,
    setFilter,
    clearFilter,
  };
};
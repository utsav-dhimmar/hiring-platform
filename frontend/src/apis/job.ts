import client from "@/apis/client";
import type { Job } from "@/types/job";

/**
 * Job service for managing job postings.
 * Provides methods to fetch available jobs from the API.
 */
const jobService = {
  /**
   * Retrieves a list of job postings.
   * @param skip - Number of records to skip for pagination (default: 0)
   * @param limit - Maximum number of records to return (default: 100)
   * @returns Promise resolving to an array of job postings
   * @example
   * ```ts
   * const jobs = await jobService.getJobs(0, 50);
   * ```
   */
  getJobs: async (skip = 0, limit = 100): Promise<Job[]> => {
    const response = await client.get<{ data: Job[]; total: number }>("/jobs/", {
      params: { skip, limit },
    });
    return response.data.data;
  },

  /**
   * Searches for jobs by title or description.
   * @param query - The search query
   * @param skip - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise resolving to an array of matching job postings
   */
  searchJobs: async (query: string, skip = 0, limit = 100): Promise<Job[]> => {
    const response = await client.get<{ data: Job[]; total: number }>("/jobs/search", {
      params: { q: query, skip, limit },
    });
    return response.data.data;
  },
};

export default jobService;

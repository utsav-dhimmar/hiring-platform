import client from "@/apis/client";
import type { Job } from "@/types/job";
import type { ResumeScreeningResultsResponse } from "@/types/admin";

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

  /**
   * Creates a new job posting.
   * @param data - The job data to create
   * @returns Promise resolving to the created job
   */
  createJob: async (data: any): Promise<Job> => {
    const response = await client.post<Job>("/jobs/", data);
    return response.data;
  },

  /**
   * Retrieves a single job by its UUID.
   * @param jobId - The UUID of the job
   * @returns Promise resolving to the job details
   */
  getJob: async (jobId: string): Promise<Job> => {
    const response = await client.get<Job>(`/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Updates an existing job posting.
   * @param jobId - The UUID of the job to update
   * @param data - The updated job data
   * @returns Promise resolving to the updated job
   */
  updateJob: async (jobId: string, data: any): Promise<Job> => {
    const response = await client.patch<Job>(`/jobs/${jobId}`, data);
    return response.data;
  },

  /**
   * Retrieves candidates for a single job.
   * @param jobId - The UUID of the job
   * @returns Promise resolving to the list of candidates
   */
  getJobCandidates: async (jobId: string): Promise<ResumeScreeningResultsResponse> => {
    const response = await client.get<ResumeScreeningResultsResponse>(`/jobs/${jobId}/candidates`);
    return response.data;
  },

  /**
   * Uploads a resume for a specific job.
   * @param jobId - The UUID of the job
   * @param file - The resume file to upload
   * @returns Promise resolving to the upload response
   */
  uploadResume: async (jobId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("resume", file);
    const response = await client.post(`/jobs/${jobId}/resume`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Deletes a job posting.
   * @param jobId - The UUID of the job to delete
   * @returns Promise resolving to void
   */
  deleteJob: async (jobId: string): Promise<void> => {
    await client.delete(`/jobs/${jobId}`);
  },
};

export default jobService;

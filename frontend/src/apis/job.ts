import client from "@/apis/client";
import type { Job, JobVersionDetail } from "@/types/job";
import type { ResumeScreeningResultsResponse } from "@/types/admin";

type JobPayload = Record<string, unknown>;

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
  createJob: async (data: JobPayload): Promise<Job> => {
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
   * Retrieves a specific job version snapshot by version UUID.
   * Note: this depends on backend support for a version-details endpoint.
   * @param versionId - The UUID of the job version snapshot
   * @returns Promise resolving to the version snapshot
   */
  getJobVersion: async (versionId: string): Promise<JobVersionDetail> => {
    const response = await client.get<JobVersionDetail>(`/jobs/versions/${versionId}`);
    return response.data;
  },

  /**
   * Updates an existing job posting.
   * @param jobId - The UUID of the job to update
   * @param data - The updated job data
   * @returns Promise resolving to the updated job
   */
  updateJob: async (jobId: string, data: JobPayload): Promise<Job> => {
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
   * Triggers re-analysis for a specific candidate against the latest job changes.
   * @param jobId - The UUID of the job
   * @param candidateId - The UUID of the candidate
   * @returns Promise resolving to the API acknowledgement message
   */
  reanalyzeCandidate: async (
    jobId: string,
    candidateId: string,
  ): Promise<{ message: string }> => {
    const response = await client.post<{ message: string }>(
      `/jobs/${jobId}/candidates/${candidateId}/reanalyze`,
    );
    return response.data;
  },

  /**
   * Uploads a resume for a specific job.
   * @param jobId - The UUID of the job
   * @param file - The resume file to upload
   * @returns Promise resolving to the upload response
   */
  uploadResume: async (jobId: string, file: File): Promise<unknown> => {
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

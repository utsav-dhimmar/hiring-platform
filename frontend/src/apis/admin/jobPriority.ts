import client from "@/apis/client";
import type { JobPriorityRead } from "@/types/admin";


// export type PriorityResponse = {
//   data: JobPriorityRead[];
//   // total: number;
// }

export type PriorityResponse = JobPriorityRead[];

/**
 * Service for managing job priorities in the admin panel.
 */
export const adminJobPriorityService = {
  /**
   * Retrieves all job priorities with pagination.
   * @param skip - Number of records to skip
   * @param limit - Maximum number of records to return
   * @param search - Search query
   * @returns Promise resolving to job priorities and total count
   */
  getAllPriorities: async (
    skip: number = 0, // api has not support for pagination for now
    limit: number = 100, // api has not support for pagination for now
    search?: string // api has not support for pagination for now
  ): Promise<PriorityResponse> => {
    const response = await client.get<PriorityResponse>(
      "/job-priorities",
      {
        params: { skip, limit, q: search ? search : undefined },
      }
    );
    return response.data;
  },

  /**
   * Creates a new job priority.
   * @param data - The priority data (name, duration_days)
   * @returns Promise resolving to the created priority
   */
  createPriority: async (data: { duration_days: number }): Promise<JobPriorityRead> => {
    const response = await client.post<JobPriorityRead>("/job-priorities", data);
    return response.data;
  },

  /**
   * Updates an existing job priority.
   * @param id - The UUID of the priority to update
   * @param data - The updated data
   * @returns Promise resolving to the updated priority
   */
  updatePriority: async (
    id: string,
    data: { duration_days?: number }
  ): Promise<JobPriorityRead> => {
    const response = await client.patch<JobPriorityRead>(`/job-priorities/${id}`, data);
    return response.data;
  },

  /**
   * Deletes a job priority.
   * @param id - The UUID of the priority to delete
   */
  deletePriority: async (id: string): Promise<void> => {
    await client.delete(`/job-priorities/${id}`);
  },
};

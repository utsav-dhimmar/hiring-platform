import apiClient from "@/apis/client";
import type { CriterionCreate, CriterionRead, CriterionUpdate } from "@/types/admin";

const ADMIN_PATH = import.meta.env.VITE_ADMIN_API_ENDPOINT || "/admin";

/**
 * Criteria Management APIs
 */
export const adminCriteriaService = {
  /**
   * Get all available evaluation criteria.
   * @returns Promise resolving to an array of criteria
   */
  getAllCriteria: async (): Promise<CriterionRead[]> => {
    const response = await apiClient.get<CriterionRead[]>(`${ADMIN_PATH}/criteria`);
    return response.data;
  },

  /**
   * Get an evaluation criterion by ID.
   * @param criterionId - Criterion ID
   * @returns Promise resolving to the criterion details
   */
  getCriterionById: async (criterionId: string): Promise<CriterionRead> => {
    const response = await apiClient.get<CriterionRead>(`${ADMIN_PATH}/criteria/${criterionId}`);
    return response.data;
  },

  /**
   * Create a new evaluation criterion.
   * @param criterion - Criterion creation payload
   * @returns Promise resolving to the created criterion
   */
  createCriterion: async (criterion: CriterionCreate): Promise<CriterionRead> => {
    const response = await apiClient.post<CriterionRead>(`${ADMIN_PATH}/criteria`, criterion);
    return response.data;
  },

  /**
   * Update an existing evaluation criterion.
   * @param criterionId - ID of the criterion to update
   * @param criterion - Update payload
   * @returns Promise resolving to the updated criterion
   */
  updateCriterion: async (
    criterionId: string,
    criterion: CriterionUpdate,
  ): Promise<CriterionRead> => {
    const response = await apiClient.patch<CriterionRead>(
      `${ADMIN_PATH}/criteria/${criterionId}`,
      criterion,
    );
    return response.data;
  },

  /**
   * Delete an evaluation criterion.
   * @param criterionId - ID of the criterion to delete
   */
  deleteCriterion: async (criterionId: string): Promise<void> => {
    await apiClient.delete(`${ADMIN_PATH}/criteria/${criterionId}`);
  },
};

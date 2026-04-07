import apiClient from "@/apis/client";
import type { StageTemplateCreate, StageTemplateUpdate } from "@/types/admin";
import type { StageTemplate } from "@/types/stage";

const ADMIN_PATH = import.meta.env.VITE_ADMIN_API_ENDPOINT || "/admin";

/**
 * Stage Template Management APIs (Admin only)
 */
export const adminStageTemplateService = {
  /**
   * Get all stage templates.
   * @returns Promise resolving to an array of stage templates
   */
  getAllTemplates: async (): Promise<StageTemplate[]> => {
    const response = await apiClient.get<StageTemplate[]>(`${ADMIN_PATH}/stage-templates`);
    return response.data;
  },

  /**
   * Create a new stage template.
   * @param template - Payload for creating a template
   * @returns Promise resolving to the created template
   */
  createTemplate: async (template: StageTemplateCreate): Promise<StageTemplate> => {
    const response = await apiClient.post<StageTemplate>(`${ADMIN_PATH}/stage-templates`, template);
    return response.data;
  },

  /**
   * Update an existing stage template.
   * @param id - Template ID
   * @param template - Payload for updating the template
   * @returns Promise resolving to the updated template
   */
  updateTemplate: async (id: string, template: StageTemplateUpdate): Promise<StageTemplate> => {
    const response = await apiClient.patch<StageTemplate>(
      `${ADMIN_PATH}/stage-templates/${id}`,
      template,
    );
    return response.data;
  },

  /**
   * Delete a stage template.
   * @param id - Template ID
   */
  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`${ADMIN_PATH}/stage-templates/${id}`);
  },
};

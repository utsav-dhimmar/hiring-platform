import apiClient from "@/apis/client";


const ADMIN_PATH = import.meta.env.VITE_ADMIN_API_ENDPOINT || "/admin";

/**
 * System APIs
 */
export const adminSystemService = {
    /**
     * Clear the entire system cache (Redis).
     * Requires: `system:manage` permission.
     */
    clearCache: async (): Promise<void> => {
        await apiClient.delete(`${ADMIN_PATH}/cache`);
    },
};

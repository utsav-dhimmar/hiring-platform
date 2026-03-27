import apiClient from "@/apis/client";
import type { AnalyticsSummary, AuditLogRead, HiringReport, RecentUploadRead } from "@/types/admin";

const ADMIN_PATH = "/admin";

/**
 * Analytics and Audit APIs
 */
export const adminAnalyticsService = {
  /**
   * Get all audit logs (admin only).
   */
  getAuditLogs: async (skip: number = 0, limit: number = 100): Promise<AuditLogRead[]> => {
    const response = await apiClient.get<AuditLogRead[]>(`${ADMIN_PATH}/audit-logs`, {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Get recent file uploads (admin only).
   */
  getRecentUploads: async (skip: number = 0, limit: number = 50): Promise<RecentUploadRead[]> => {
    const response = await apiClient.get<RecentUploadRead[]>(`${ADMIN_PATH}/recent-uploads`, {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Get analytics summary (admin only).
   */
  getAnalytics: async (): Promise<AnalyticsSummary> => {
    const response = await apiClient.get<AnalyticsSummary>(`${ADMIN_PATH}/analytics`);
    return response.data;
  },

  /**
   * Get hiring report with detailed statistics (admin only).
   */
  getHiringReport: async (): Promise<HiringReport> => {
    const response = await apiClient.get<HiringReport>(`${ADMIN_PATH}/hiring-report`);
    return response.data;
  },
};

/**
 * Log Service Layer
 * Handles fetching user-specific activity logs.
 */

import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";

/**
 * Log Entry Interface
 */
export interface LogEntry {
  id: string;
  category: string;
  action: string;
  message: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  createdAt: string;
  metadata?: any;
}

/**
 * System Logs Response Interface
 */
export interface SystemLogsResponse {
  logs: LogEntry[];
  meta: {
    currentPage: number;
    pageSize: number;
    totalEntries: number;
    totalPages: number;
  };
}

/**
 * Fetch logs for the currently authenticated user.
 * Reads from /activity-meta/me
 * @param config - Optional axios config with metadata
 * @returns List of user activities
 */
export async function GetMyActivities(
  config?: AxiosConfigWithMeta,
): Promise<SystemLogsResponse> {
  const { data } = await apiClient.get(
    API_ROUTES.superadmin.logs.myLogs,
    config,
  );
  return data;
}

export const logService = {
  GetMyActivities,
};

/**
 * Superadmin Service
 * Handles M2M client management, user management, and system logs
 */

import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";
import type {
  M2MClient,
  CreateM2MClientRequest,
  CreateM2MClientResponse,
  SystemLog,
  SystemLogsResponse,
  SystemLogsParams,
  LogStats,
  ListUsersParams,
  ListUsersResponse,
  AdminAnalytics,
  LogActivityStat,
  RoleDistribution,
  WhitelistEntry,
} from "../types";

export interface M2MQueryParams {
  includeRevoked?: boolean;
  sort_by?: string;
  sort_order?: string;
}

export interface WhitelistQueryParams {
  sort_by?: string;
  sort_order?: string;
  search?: string;
  role_id?: number;
}

/**
 * Get all M2M clients
 */
export const GetM2MClients = async (
  params: M2MQueryParams = {},
  config?: AxiosConfigWithMeta,
): Promise<M2MClient[]> => {
  try {
    const { data } = await apiClient.get(
      API_ROUTES.superadmin.m2mClients.list,
      {
        ...config,
        params: { 
          include_revoked: params.includeRevoked ?? false,
          sort_by: params.sort_by,
          sort_order: params.sort_order
        },
      },
    );
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Register new M2M client
 */
export const PostM2MClient = async (
  data: CreateM2MClientRequest,
  config?: AxiosConfigWithMeta,
): Promise<CreateM2MClientResponse> => {
  try {
    const response = await apiClient.post(
      API_ROUTES.superadmin.m2mClients.create,
      data,
      config,
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Revoke M2M client
 */
export const DeleteM2MClient = async (
  id: number,
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  try {
    await apiClient.delete(API_ROUTES.superadmin.m2mClients.revoke(id), config);
  } catch (error) {
    throw error;
  }
};

/**
 * Rotate M2M client secret
 */
export const PostM2MSecret = async (
  id: number,
  config?: AxiosConfigWithMeta,
): Promise<{ clientSecret: string }> => {
  try {
    const { data } = await apiClient.post(
      API_ROUTES.superadmin.m2mClients.rotateSecret(id),
      {},
      config,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify M2M client
 */
export const PatchVerifyM2MClient = async (
  id: number,
  hasPersonalInfoAccess: boolean,
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  try {
    await apiClient.patch(
      API_ROUTES.superadmin.m2mClients.verify(id),
      { hasPersonalInfoAccess },
      config,
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Reject M2M client
 */
export const PatchRejectM2MClient = async (
  id: number,
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  try {
    await apiClient.patch(
      API_ROUTES.superadmin.m2mClients.reject(id),
      {},
      config,
    );
  } catch (error) {
    throw error;
  }
};

/**
 * List all users with filtering and pagination
 */
export const GetUsers = async (
  params?: ListUsersParams,
  config?: AxiosConfigWithMeta,
): Promise<ListUsersResponse> => {
  try {
    const { data } = await apiClient.get(API_ROUTES.superadmin.users.list, {
      ...config,
      params,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get user role distribution
 */
export const GetUserDistribution = async (
  config?: AxiosConfigWithMeta,
): Promise<RoleDistribution[]> => {
  try {
    const { data } = await apiClient.get(
      API_ROUTES.superadmin.users.distribution,
      config,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Block/Unblock a user
 */
export const PostToggleUserStatus = async (
  id: string,
  action: "block" | "unblock",
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  try {
    await apiClient.post(
      API_ROUTES.superadmin.users.toggleStatus(id, action),
      {},
      config,
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Get Admin/System Analytics
 */
export const GetAdminAnalytics = async (
  range?: string,
  config?: AxiosConfigWithMeta,
): Promise<AdminAnalytics> => {
  try {
    const { data } = await apiClient.get(
      API_ROUTES.superadmin.analytics.admin,
      {
        ...config,
        params: { range, source: "system" },
      },
    );
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get security logs
 */
export const GetSecurityLogs = async (
  params?: SystemLogsParams,
  config?: AxiosConfigWithMeta,
): Promise<SystemLogsResponse> => {
  try {
    const { data } = await apiClient.get(API_ROUTES.superadmin.logs.security, {
      ...config,
      params,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get system logs
 */
export const GetSystemLogs = async (
  params?: SystemLogsParams,
  config?: AxiosConfigWithMeta,
): Promise<SystemLogsResponse> => {
  try {
    const { data } = await apiClient.get(API_ROUTES.superadmin.logs.system, {
      ...config,
      params,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get audit logs
 */
export const GetAuditLogs = async (
  params?: SystemLogsParams,
  config?: AxiosConfigWithMeta,
): Promise<SystemLogsResponse> => {
  try {
    const { data } = await apiClient.get(API_ROUTES.superadmin.logs.audit, {
      ...config,
      params,
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get log statistics
 */
export const GetLogStats = async (
  startDate?: string,
  endDate?: string,
  config?: AxiosConfigWithMeta,
): Promise<LogStats[]> => {
  try {
    const { data } = await apiClient.get(API_ROUTES.superadmin.logs.stats, {
      ...config,
      params: {
        start_date: startDate,
        end_date: endDate,
      },
    });
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get time-series log activity
 */
export const GetLogActivity = async (
  config?: AxiosConfigWithMeta,
): Promise<LogActivityStat[]> => {
  try {
    const { data } = await apiClient.get(
      API_ROUTES.superadmin.logs.activity,
      config,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get active sessions for a user
 */
export const GetUserSessions = async (
  id: string,
  config?: AxiosConfigWithMeta,
): Promise<any[]> => {
  try {
    const { data } = await apiClient.get(
      API_ROUTES.superadmin.users.sessions(id),
      config,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Revoke a specific user session
 */
export const DeleteUserSession = async (
  userId: string,
  sessionId: string,
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  try {
    await apiClient.delete(
      API_ROUTES.superadmin.users.revokeSession(userId, sessionId),
      config,
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Get activity logs for a specific user
 */
export const GetUserActivity = async (
  id: string,
  params?: SystemLogsParams,
  config?: AxiosConfigWithMeta,
): Promise<SystemLogsResponse> => {
  try {
    const { data } = await apiClient.get(
      API_ROUTES.superadmin.users.activity(id),
      { ...config, params },
    );
    return data;
  } catch (error) {
    throw error;
  }
};
/**
 * Update user roles with audit trail
 */
export const PostUpdateUserRoles = async (
  userId: string,
  roleIds: number[],
  reason: string,
  referenceId: string,
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  try {
    await apiClient.post(
      API_ROUTES.superadmin.users.updateRoles,
      {
        userId,
        roleIds,
        reason,
        referenceId,
      },
      config,
    );
  } catch (error) {
    throw error;
    throw error;
  }
};

/**
 * Get single log detail by ID
 */
export const GetLogDetail = async (
  id: string,
  config?: AxiosConfigWithMeta,
): Promise<SystemLog> => {
  try {
    const { data } = await apiClient.get(
      API_ROUTES.superadmin.logs.detail(id),
      config,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get trace tracks by trace ID
 */
export const GetTraceTracks = async (
  traceId: string,
  config?: AxiosConfigWithMeta,
): Promise<SystemLog[]> => {
  try {
    const { data } = await apiClient.get(
      API_ROUTES.superadmin.logs.traceTracks(traceId),
      config,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Add a user to whitelist
 */
export const PostAddUserToWhitelist = async (
  email: string,
  roleIds: number[],
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  try {
    await apiClient.post(
      API_ROUTES.superadmin.users.whitelist,
      { email, roleIds },
      config,
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Remove user from whitelist
 */
export const PostRemoveUserFromWhitelist = async (
  email: string,
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  try {
    await apiClient.post(
      API_ROUTES.superadmin.users.removeWhitelist,
      { email },
      config,
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Get all whitelisted users
 */
export const GetWhitelist = async (
  params?: WhitelistQueryParams,
  config?: AxiosConfigWithMeta,
): Promise<WhitelistEntry[]> => {
  try {
    const { data } = await apiClient.get<WhitelistEntry[]>(
      API_ROUTES.superadmin.users.whitelist,
      {
        ...config,
        params,
      },
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export interface ServiceHealth {
  name: string;
  status: string;
  isHealthy: boolean;
}

/**
 * Get detailed real-time health status of all subsystems
 */
export const GetSystemHealth = async (
  config?: AxiosConfigWithMeta,
): Promise<ServiceHealth[]> => {
  try {
    const { data } = await apiClient.get<ServiceHealth[]>(
      API_ROUTES.superadmin.logs.health,
      config,
    );
    return data;
  } catch (error) {
    throw error;
  }
};

export const superadminService = {
  listM2MClients: GetM2MClients,
  createM2MClient: PostM2MClient,
  revokeM2MClient: DeleteM2MClient,
  rotateM2MSecret: PostM2MSecret,
  verifyM2MClient: PatchVerifyM2MClient,
  rejectM2MClient: PatchRejectM2MClient,
  listUsers: GetUsers,
  getUserDistribution: GetUserDistribution,
  toggleUserStatus: PostToggleUserStatus,
  updateUserRoles: PostUpdateUserRoles,
  addUserToWhitelist: PostAddUserToWhitelist,
  removeUserFromWhitelist: PostRemoveUserFromWhitelist,
  getWhitelist: GetWhitelist,
  getAdminAnalytics: GetAdminAnalytics,
  getSecurityLogs: GetSecurityLogs,
  getSystemLogs: GetSystemLogs,
  getAuditLogs: GetAuditLogs,
  getLogStats: GetLogStats,
  getLogActivity: GetLogActivity,
  getUserSessions: GetUserSessions,
  revokeUserSession: DeleteUserSession,
  getUserActivity: GetUserActivity,
  getTraceTracks: GetTraceTracks,
  getLogDetail: GetLogDetail,
  getSystemHealth: GetSystemHealth,
};

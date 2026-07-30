import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { superadminService } from "../services";
import { QUERY_KEYS } from "@/config/queryKeys";
import { CACHE_TIMING } from "@/config/constants";
import type {
  CreateM2MClientRequest,
  SystemLogsParams,
  ListUsersParams,
} from "../types";

export interface M2MQueryParams {
  includeRevoked?: boolean;
  sort_by?: string;
  sort_order?: string;
}

// M2M Client hooks
export function useM2MClients(params: M2MQueryParams = {}) {
  const includeRevoked = params.includeRevoked ?? false;
  
  return useQuery({
    queryKey: [...QUERY_KEYS.superadmin.m2mClients(includeRevoked), params.sort_by, params.sort_order],
    queryFn: () => superadminService.listM2MClients(params),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}

export function useCreateM2MClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateM2MClientRequest) =>
      superadminService.createM2MClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.superadmin.m2mClients(false),
      });
    },
  });
}

export function useRevokeM2MClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => superadminService.revokeM2MClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.superadmin.m2mClients(false),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.superadmin.m2mClients(true),
      });
    },
  });
}

export function useRotateM2MSecret() {
  return useMutation({
    mutationFn: (id: number) => superadminService.rotateM2MSecret(id),
  });
}

export function useVerifyM2MClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      hasPersonalInfoAccess,
    }: {
      id: number;
      hasPersonalInfoAccess: boolean;
    }) =>
      superadminService.verifyM2MClient(id, hasPersonalInfoAccess),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.superadmin.m2mClients(false),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.superadmin.m2mClients(true),
      });
    },
  });
}

export function useRejectM2MClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => superadminService.rejectM2MClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.superadmin.m2mClients(false),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.superadmin.m2mClients(true),
      });
    },
  });
}

// User Management hooks
export function useUsers(params?: ListUsersParams) {
  return useQuery({
    queryKey: QUERY_KEYS.superadmin.users(params),
    queryFn: () => superadminService.listUsers(params),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
  });
}

export function useUserDistribution() {
  return useQuery({
    queryKey: QUERY_KEYS.superadmin.userDistribution,
    queryFn: () => superadminService.getUserDistribution(),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "block" | "unblock" }) =>
      superadminService.toggleUserStatus(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "users"],
      });
    },
  });
}

export function useUpdateUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      roleIds,
      reason,
      referenceId,
    }: {
      userId: string;
      roleIds: number[];
      reason: string;
      referenceId: string;
    }) => superadminService.updateUserRoles(userId, roleIds, reason, referenceId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "users"],
      });
    },
  });
}

// Analytics hooks
export function useAdminAnalytics(range?: "daily" | "weekly" | "monthly" | "yearly") {
  return useQuery({
    queryKey: [QUERY_KEYS.superadmin.analytics, { range }],
    queryFn: () => superadminService.getAdminAnalytics(range),
    staleTime: CACHE_TIMING.LONG.staleTime,
    gcTime: CACHE_TIMING.LONG.gcTime,
  });
}

// Log hooks
export function useSecurityLogs(params?: SystemLogsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.superadmin.securityLogs(params),
    queryFn: () => superadminService.getSecurityLogs(params),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}

export function useSystemLogs(params?: SystemLogsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.superadmin.systemLogs(params),
    queryFn: () => superadminService.getSystemLogs(params),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}

export function useAuditLogs(params?: SystemLogsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.superadmin.auditLogs(params),
    queryFn: () => superadminService.getAuditLogs(params),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}

export function useM2MLogs(params?: SystemLogsParams) {
  return useQuery({
    queryKey: QUERY_KEYS.superadmin.m2mLogs(params),
    queryFn: () => superadminService.getM2MLogs(params),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}

export function useLogStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.superadmin.logStats(startDate, endDate),
    queryFn: () => superadminService.getLogStats(startDate, endDate),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}

export function useLogActivity() {
  return useQuery({
    queryKey: QUERY_KEYS.superadmin.logActivity,
    queryFn: () => superadminService.getLogActivity(),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
  });
}

// User Audit hooks
export function useUserSessions(id: string) {
  return useQuery({
    queryKey: ["superadmin", "users", id, "sessions"],
    queryFn: () => superadminService.getUserSessions(id),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    enabled: !!id,
  });
}

export function useRevokeUserSession(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      superadminService.revokeUserSession(userId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "users", userId, "sessions"],
      });
    },
  });
}

export function useUserActivity(id: string, params?: SystemLogsParams) {
  return useQuery({
    queryKey: ["superadmin", "users", id, "activity", params],
    queryFn: () => superadminService.getUserActivity(id, params),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    enabled: !!id,
  });
}

export function useLogDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.superadmin.logDetail(id),
    queryFn: () => superadminService.getLogDetail(id),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
    enabled: !!id,
  });
}

export function useTraceTracks(traceId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.superadmin.traceTracks(traceId),
    queryFn: () => superadminService.getTraceTracks(traceId),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
    enabled: !!traceId,
  });
}

export function useAddUserToWhitelist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      email,
      roleIds,
    }: {
      email: string;
      roleIds: number[];
    }) => superadminService.addUserToWhitelist(email, roleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "users"],
      });
    },
  });
}

export function useRemoveUserFromWhitelist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      superadminService.removeUserFromWhitelist(email),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["superadmin", "users"],
      });
    },
  });
}

export function useWhitelist(params?: { sort_by?: string; sort_order?: string; search?: string; role_id?: number }) {
  return useQuery({
    queryKey: [...QUERY_KEYS.superadmin.whitelist, params],
    queryFn: () => superadminService.getWhitelist(params),
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ["superadmin", "system", "health"],
    queryFn: () => superadminService.getSystemHealth(),
    refetchInterval: 10000, // Poll every 10 seconds for real-time accuracy
    refetchIntervalInBackground: false,
    staleTime: 5000,
  });
}


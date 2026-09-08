import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GetAllSlips,
  GetMySlips,
  PostStartSlip,
  slipService,
} from "../services";
import { QUERY_KEYS } from "@/config/queryKeys";
import { CACHE_TIMING } from "@/config/constants";
import { useMe } from "@/features/users/hooks/useMe";
import { QueryParams } from "../types";

/**
 * Hook to fetch all slips (Admin/Staff view)
 */
export function useGetAllSlips(params?: QueryParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.slips.all, "all", params],
    queryFn: () => slipService.GetAllSlips(params),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch current user's slips (Student view)
 */
export function useGetMySlips(params?: QueryParams) {
  const { data: me } = useMe({});
  return useQuery({
    queryKey: [...QUERY_KEYS.slips.mySlips, me?.id, params],
    queryFn: () =>
      GetMySlips(params, {
        handlerName: "useGetMySlips",
        stepName: "Fetch My Slips",
      }),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    enabled: !!me,
  });
}

/**
 * Flexible hook that switches between Admin and Student views
 */
export function useSlips({
  isAdmin = false,
  params,
}: { isAdmin?: boolean; params?: QueryParams } = {}) {
  const { data: me } = useMe({});
  return useQuery({
    queryKey: isAdmin
      ? [...QUERY_KEYS.slips.all, "admin", params]
      : [...QUERY_KEYS.slips.mySlips, me?.id, params],
    queryFn: isAdmin
      ? () =>
          GetAllSlips(params, {
            handlerName: "useSlips",
            stepName: "Fetch All Slips",
          })
      : () =>
          GetMySlips(params, {
            handlerName: "useSlips",
            stepName: "Fetch My Slips",
          }),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    enabled: !!me,
  });
}

/**
 * Hook to fetch urgent/pending slip statistics
 */
export function useGetUrgentSlips(params?: any) {
  return useQuery({
    queryKey: [...QUERY_KEYS.slips.stats, "urgent", params],
    queryFn: () => slipService.GetUrgentSlips(params),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch general slip statistics
 */
export function useGetSlipStats({ params }: { params?: any } = {}) {
  const { data: me } = useMe({});
  return useQuery({
    queryKey: [...QUERY_KEYS.slips.stats, me?.id, params],
    queryFn: () => slipService.GetSlipStats(params),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

export interface SlipLogsParams extends QueryParams {
  startDate?: string;
  endDate?: string;
}

/**
 * Hook to fetch all slips for historical logging
 */
export function useSlipLogs(params?: SlipLogsParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.slips.all, "logs", params],
    queryFn: () => slipService.GetAllSlips(params),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook to fetch slip by ID
 */
export function useGetSlipById(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.slips.all, "byId", id],
    queryFn: () => slipService.GetSlipById(id),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    enabled: !!id,
  });
}

/**
 * Hook to start slip validation duration on-site
 */
export function useStartSlip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      params: string | { id: string; offsetMinutes?: number },
    ) => {
      if (typeof params === "string") {
        return PostStartSlip(params, 0);
      }
      return PostStartSlip(params.id, params.offsetMinutes ?? 0);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.slips.stats,
      });
    },
  });
}

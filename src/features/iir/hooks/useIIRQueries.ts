import { useQuery } from "@tanstack/react-query";
import {
  GetIIRByUserId,
  GetIIRResource,
  GetStudents,
} from "../services/service";
import { useMe } from "@/features/users/hooks/useMe";
import { QUERY_KEYS } from "@/config/queryKeys";
import { CACHE_TIMING } from "@/config/constants";
import { IIRForm, QueryParam } from "../types";

const STUDENTS_PAGE_SIZE = 24;

/**
 * Hook to check if the current user has submitted an IIR
 */
export function useIIRStatus() {
  const { data: me } = useMe({});
  const userId = me?.id;

  return useQuery({
    queryKey: QUERY_KEYS.iir.inventory.byUserId(userId || ""),
    queryFn: async () => {
      try {
        const iirRecord = await GetIIRByUserId(userId || "");
        return iirRecord?.isSubmitted ?? false;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 404 || status === 500) {
          return false;
        }
        throw error;
      }
    },
    enabled: !!userId,
    retry: false,
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}

/**
 * Hook to fetch a specific user's IIR record
 */
export function useUserIIR(userID?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.iir.inventory.byUserId(userID ?? ""),
    queryFn: async () => {
      return GetIIRByUserId(userID as string);
    },
    staleTime: CACHE_TIMING.LONG.staleTime,
    gcTime: CACHE_TIMING.LONG.gcTime,
    enabled: Boolean(userID),
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
  });
}

/**
 * Hook to fetch a full IIR profile by IIR ID
 */
export function useIIRProfile(iirId: string) {
  return useQuery<IIRForm>({
    queryKey: QUERY_KEYS.iir.inventory.profile(iirId),
    queryFn: async () => {
      return GetIIRResource(iirId, "IIRProfile");
    },
    enabled: !!iirId,
    staleTime: CACHE_TIMING.MEDIUM.staleTime,
    gcTime: CACHE_TIMING.MEDIUM.gcTime,
  });
}

/**
 * Hook for paginated student IIR records (Admin/Staff view)
 */
export function useIIRPagination(params: QueryParam) {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.iir.inventory.all,
      params.programId,
      params.search,
      params.genderId,
      params.yearLevel,
      params.statusId,
      params.page,
      params.orderBy,
      params.sortOrder,
    ],
    queryFn: () =>
      GetStudents({
        ...params,
        pageSize: STUDENTS_PAGE_SIZE,
      }),
    placeholderData: (prevData) => prevData,
  });
}

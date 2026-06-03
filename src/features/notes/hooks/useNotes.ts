/**
 * React Query hooks for Significant Notes feature
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesService } from "../services/notesService";
import { CreateNoteRequest } from "../types/types";
import { QUERY_KEYS } from "@/config/queryKeys";
import { CACHE_TIMING } from "@/config/constants";

/**
 * Hook to fetch student notes
 * @param iirId - Student IIR ID
 * @returns Query result with notes data
 */
export function useStudentNotes(iirId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.notes.byIirId(iirId),
    queryFn: () =>
      notesService.getStudentNotes(iirId, {
        handlerName: "useStudentNotes",
        stepName: "Fetch Notes",
      }),
    enabled: !!iirId,
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
  });
}

/**
 * Hook to create a new note
 * @param iirId - Student IIR ID
 * @param onSuccess - Callback on successful creation
 * @param onError - Callback on error
 * @returns Mutation object
 */
export function useCreateNote(
  iirId: string,
  onSuccess?: () => void,
  onError?: (error: any) => void,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNoteRequest) =>
      notesService.createNote(iirId, data, {
        handlerName: "useCreateNote",
        stepName: "Create Note",
      }),
    onSuccess: (_, variables) => {
      // Invalidate and refetch notes
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notes.byIirId(iirId),
      });

      // Invalidate related appointment if applicable
      if (variables.appointmentId) {
        queryClient.invalidateQueries({
          queryKey: [
            ...QUERY_KEYS.appointments.all,
            "byId",
            variables.appointmentId,
          ],
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.appointments.all,
        });
      }

      // Invalidate related admission slip if applicable
      if (variables.admissionSlipId) {
        queryClient.invalidateQueries({
          queryKey: [
            ...QUERY_KEYS.slips.all,
            "byId",
            variables.admissionSlipId,
          ],
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.slips.all,
        });
      }

      onSuccess?.();
    },
    onError: (error: any) => {
      onError?.(error);
    },
  });
}

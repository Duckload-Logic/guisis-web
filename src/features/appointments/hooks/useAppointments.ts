import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  appointmentService,
  PostCancelAppointment,
} from "@/features/appointments/services";
import { QUERY_KEYS } from "@/config/queryKeys";
import { CACHE_TIMING } from "@/config/constants";
import {
  Appointment,
  AppointmentStatus,
  StatusCount,
  CreateAppointmentRequest,
  type PaginatedAppointmentsResponse,
} from "../types";
import { QueryParam } from "../types/reqParams";
import { useMe } from "@/features/users/hooks/useMe";

export const useAppointments = (
  {
    isMe = false,
    params,
  }: {
    isMe?: boolean;
    params: QueryParam;
  } = {} as any,
) => {
  const { data: me } = useMe({});
  return useQuery<PaginatedAppointmentsResponse>({
    queryKey: isMe
      ? [...QUERY_KEYS.appointments.myAppointments, me?.email, params]
      : [...QUERY_KEYS.appointments.all, params],
    queryFn: async () => {
      const result = isMe
        ? await appointmentService.GetMyAppointments(params)
        : await appointmentService.GetAllAppointments(params);
      return result;
    },
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
    enabled: isMe ? !!me?.email : true,
  });
};

export const useAppointmentsStats = ({ params }: { params?: QueryParam }) => {
  const { data: me } = useMe({});
  return useQuery<StatusCount[]>({
    queryKey: [...QUERY_KEYS.appointments.stats, me?.email, params],
    queryFn: () => appointmentService.GetAppointmentStats(params),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
};

export function useSubmitAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) =>
      appointmentService.PostAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments.myAppointments,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments.stats,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analytics.all,
      });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  const { data: me } = useMe({});

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      appointmentService.PatchAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments.myAppointments,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments.stats,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analytics.all,
      });
    },
  });
}

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Appointment }) =>
      appointmentService.PatchAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments.stats,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analytics.all,
      });
    },
  });
};

export const useAppointment = (id: string) => {
  return useQuery<Appointment>({
    queryKey: [...QUERY_KEYS.appointments.all, "byId", id],
    queryFn: () => appointmentService.GetAppointmentById(id),
    staleTime: CACHE_TIMING.SHORT.staleTime,
    gcTime: CACHE_TIMING.SHORT.gcTime,
    refetchOnWindowFocus: false,
    enabled: !!id,
  });
};

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      PostCancelAppointment(id, {
        reason,
        notifyCounselor: true,
        notifyRoles: ["Counselor", "Admin"],
        notificationType: "appointment_cancelled",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments.myAppointments,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments.all,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.appointments.stats,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.analytics.all,
      });
    },
  });
}


/**
 * Appointment Service Layer
 * Handles all appointment-related API calls
 */

import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";
import type {
  Appointment,
  CreateAppointmentRequest,
  AvailableTimeSlotView,
  ConcernCategory,
  AppointmentStatus,
  PaginatedAppointmentsResponse,
  StatusCount,
} from "../types";
import { QueryParam } from "../types/reqParams";
import { DailyStatusCount } from "../types/calendar";
import { toISODateString } from "@/utils";

// Re-export types for legacy imports
export type { Appointment, CreateAppointmentRequest, AvailableTimeSlotView };

/**
 * Get current user's appointments
 * @param params - Query parameters
 * @param config - Axios config with logging metadata
 * @returns Paginated appointments response with iirId
 * @throws Error on 403 (Day One student) or other failures
 */
export async function GetMyAppointments(
  params: QueryParam,
  config?: AxiosConfigWithMeta,
): Promise<PaginatedAppointmentsResponse> {
  try {
    const response = await apiClient.get(
      API_ROUTES.appointments.myAppointments,
      { ...config, params },
    );
    return response.data;
  } catch (error: any) {
    // Handle Day One student (403 Forbidden)
    if (error.response?.status === 403) {
      throw new Error("Please complete your IIR profile");
    }

    throw error;
  }
}

/**
 * Get all appointments with pagination
 * @param params - Query parameters
 * @param config - Axios config with logging metadata
 * @returns Paginated appointments response
 */
export async function GetAllAppointments(
  params?: QueryParam,
  config?: AxiosConfigWithMeta,
): Promise<PaginatedAppointmentsResponse> {
  try {
    const response = await apiClient.get(API_ROUTES.appointments.all, {
      ...config,
      params,
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get appointment statistics
 * @param params - Query parameters
 * @param config - Axios config with logging metadata
 * @returns Status count array
 */
export async function GetAppointmentStats(
  params?: QueryParam,
  config?: AxiosConfigWithMeta,
): Promise<StatusCount[]> {
  try {
    const response = await apiClient.get(API_ROUTES.appointments.stats, {
      ...config,
      params,
    });
    // Fallback unwrap if interceptor hasn't handled it
    return response.data?.data || response.data || [];
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get calendar statistics
 * @param params - Query parameters
 * @param config - Axios config with logging metadata
 * @returns Daily status count array
 */
export async function GetCalendarStats(
  params: QueryParam,
  config?: AxiosConfigWithMeta,
): Promise<DailyStatusCount[]> {
  try {
    const response = await apiClient.get(
      API_ROUTES.appointments.calendarStats,
      { ...config, params },
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get appointment by ID
 * @param id - Appointment ID
 * @param config - Axios config with logging metadata
 * @returns Appointment details
 */
export async function GetAppointmentById(
  id: string,
  config?: AxiosConfigWithMeta,
): Promise<Appointment> {
  try {
    const response = await apiClient.get(
      API_ROUTES.appointments.byId(id),
      config,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get available appointment slots
 * @param date - Date to check availability
 * @param config - Axios config with logging metadata
 * @returns Available time slots
 */
export async function GetAvailableSlots(
  date?: Date,
  config?: AxiosConfigWithMeta,
): Promise<AvailableTimeSlotView[]> {
  try {
    const params = date ? { date: toISODateString(date) } : {};
    const response = await apiClient.get(
      API_ROUTES.appointments.lookups.slots,
      { ...config, params },
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get appointment concern categories
 * @param config - Axios config with logging metadata
 * @returns Array of concern categories
 */
export async function GetAppointmentCategories(
  config?: AxiosConfigWithMeta,
): Promise<ConcernCategory[]> {
  try {
    const response = await apiClient.get(
      API_ROUTES.appointments.lookups.categories,
      config,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Get appointment statuses
 * @param config - Axios config with logging metadata
 * @returns Array of appointment statuses
 */
export async function GetAppointmentStatuses(
  config?: AxiosConfigWithMeta,
): Promise<AppointmentStatus[]> {
  try {
    const response = await apiClient.get(
      API_ROUTES.appointments.lookups.statuses,
      config,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Submit a new appointment
 * @param data - Appointment creation request
 *   (userId handled by middleware)
 * @param config - Axios config with logging metadata
 * @returns Created appointment response
 * @throws Error on 403 (Day One student) or other failures
 */
export async function PostAppointment(
  data: CreateAppointmentRequest,
  config?: AxiosConfigWithMeta,
): Promise<Appointment> {
  try {
    const response = await apiClient.post(
      API_ROUTES.appointments.all,
      data,
      config,
    );
    return response.data;
  } catch (error: any) {
    // Handle Day One student (403 Forbidden)
    if (
      error.response?.status === 403 &&
      error.response.data?.error?.includes("IIR")
    ) {
      throw new Error("Please complete your IIR profile");
    }

    throw error;
  }
}

/**
 * Update appointment status
 * @param id - Appointment ID
 * @param status - New status
 * @param config - Axios config with logging metadata
 * @returns Updated appointment
 */
export async function PatchAppointmentStatus(
  id: string,
  status: AppointmentStatus,
  config?: AxiosConfigWithMeta,
): Promise<Appointment> {
  try {
    const response = await apiClient.patch(
      API_ROUTES.appointments.byId(id),
      { status },
      config,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Update appointment details
 * @param id - Appointment ID
 * @param data - Updated appointment data
 * @param config - Axios config with logging metadata
 * @returns Updated appointment
 */
export async function PatchAppointment(
  id: string,
  data: Appointment,
  config?: AxiosConfigWithMeta,
): Promise<Appointment> {
  try {
    const response = await apiClient.patch(
      API_ROUTES.appointments.byId(id),
      data,
      config,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Cancel an appointment (Student only)
 * @param id - Appointment ID
 * @param config - Axios config
 * @returns Success message
 */
export async function PostCancelAppointment(
  id: string,
  data?: { reason: string },
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.post(
      API_ROUTES.appointments.cancel(id),
      data || {},
      config,
    );
    return response.data;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Legacy service object for backward compatibility
 * Gradually migrate to direct function imports
 */
export const appointmentService = {
  GetMyAppointments,
  GetAllAppointments,
  GetAppointmentStats,
  GetCalendarStats,
  GetAppointmentById,
  GetAvailableSlots,
  GetAppointmentCategories,
  GetAppointmentStatuses,
  PostAppointment,
  PatchAppointmentStatus,
  PatchAppointment,
};

export default appointmentService;

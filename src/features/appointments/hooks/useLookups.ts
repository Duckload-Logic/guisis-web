/**
 * Appointment Lookup Hooks
 * Migrated to use generic useLookup factory
 */

import { useLookup, useLookupWithMeta } from "@/hooks/useLookup";
import { appointmentService } from "@/features/appointments/services";
import { QUERY_KEYS } from "@/config/queryKeys";
import { toISODateString } from "@/utils";
import type {
  AvailableTimeSlotView,
  ConcernCategory,
  AppointmentStatus,
} from "../types";

/**
 * Fetch available appointment slots for a given date
 * Uses CACHE_TIMING.LONG (1 hour stale, 2 hours gc)
 *
 * @param date - Date to check availability
 * @returns Query result with available slots
 */
export const useAvailableSlots = (date: Date | undefined) => {
  return useLookup<AvailableTimeSlotView[]>(
    QUERY_KEYS.appointments.lookups.slots(
      date ? toISODateString(date) : "",
    ),
    () => appointmentService.GetAvailableSlots(date),
    { enabled: !!date },
  );
};

/**
 * Fetch appointment concern categories
 * Uses CACHE_TIMING.LONG (1 hour stale, 2 hours gc)
 *
 * @returns Query result with categories
 */
export const useCategories = () => {
  return useLookupWithMeta<ConcernCategory[]>(
    QUERY_KEYS.appointments.lookups.categories,
    (config) => appointmentService.GetAppointmentCategories(config),
    "GetAppointmentCategories",
    "Fetch Categories",
  );
};

/**
 * Fetch appointment statuses
 * Uses CACHE_TIMING.LONG (1 hour stale, 2 hours gc)
 *
 * @returns Query result with statuses
 */
export const useStatuses = () => {
  return useLookupWithMeta<AppointmentStatus[]>(
    QUERY_KEYS.appointments.lookups.statuses,
    (config) => appointmentService.GetAppointmentStatuses(config),
    "GetAppointmentStatuses",
    "Fetch Statuses",
  );
};

export type SafeguardedStudentService = "appointments" | "slips";

const isAllowed = (value: string | undefined) =>
  value?.trim().toLowerCase() !== "false";

export const STUDENT_SERVICE_AVAILABILITY = Object.freeze({
  appointments: isAllowed(import.meta.env.VITE_ALLOW_APPT),
  slips: isAllowed(import.meta.env.VITE_ALLOW_SLIP),
});

export function getBlockedStudentService(
  pathname: string,
): SafeguardedStudentService | null {
  if (
    !STUDENT_SERVICE_AVAILABILITY.appointments &&
    (pathname === "/student/appointments" ||
      pathname.startsWith("/student/appointments/"))
  ) {
    return "appointments";
  }

  if (
    !STUDENT_SERVICE_AVAILABILITY.slips &&
    (pathname === "/student/slips" || pathname.startsWith("/student/slips/"))
  ) {
    return "slips";
  }

  return null;
}

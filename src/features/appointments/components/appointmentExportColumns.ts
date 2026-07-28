// src/features/appointments/components/appointmentExportColumns.ts
import type { CSVColumn } from "@/lib/csvExport";
import { Appointment } from "../types";
import { format12HourTime } from "@/utils/dateTime";

function getAppointmentStudentName(apt: Appointment): string {
  return [
    apt.user?.firstName,
    apt.user?.middleName?.[0] ? `${apt.user.middleName[0]}.` : "",
    apt.user?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function formatCompactDate(value?: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getUrgencyLabel(apt: Appointment): string {
  const raw = apt.urgencyLevel ?? apt.urgency;
  if (!raw) return "";
  if (typeof raw === "string") return raw;
  return raw.name || "";
}

export const appointmentExportColumns: CSVColumn<Appointment>[] = [
  { header: "Student Name", accessor: (a) => getAppointmentStudentName(a) || "Unnamed Student" },
  { header: "Student Number", accessor: (a) => a.studentNumber ?? a.user?.email ?? "" },
  { header: "Date Requested", accessor: (a) => formatCompactDate(a.createdAt) },
  { header: "Appointment Date", accessor: (a) => formatCompactDate(a.whenDate) },
  { header: "Appointment Time", accessor: (a) => format12HourTime(a.timeSlot?.time || "") || "" },
  { header: "Category", accessor: (a) => a.appointmentCategory?.name ?? "" },
  { header: "Status", accessor: (a) => a.status?.name ?? "" },
  { header: "Urgency", accessor: (a) => getUrgencyLabel(a) },
];
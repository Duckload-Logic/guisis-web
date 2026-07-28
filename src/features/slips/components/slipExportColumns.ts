import type { CSVColumn } from "@/lib/csvExport";
import type { Slip } from "@/features/slips/types";
import { formatDate } from "@/utils/dateTime"; // Swapped to existing utility

function getSlipStudentFullName(slip: Slip): string {
  const lastName = slip.user?.lastName || "";
  const firstName = slip.user?.firstName || "";
  
  if (lastName && firstName) {
    return `${lastName}, ${firstName}`;
  }
  return lastName || firstName || "Unnamed Student";
}

function formatSlipDate(dateString?: string | null): string {
  if (!dateString) return "N/A";
  return formatDate(dateString) || "N/A";
}

export const slipExportColumns: CSVColumn<Slip>[] = [
  { header: "Student Name", accessor: (s) => getSlipStudentFullName(s) },
  { header: "Student Number", accessor: (s) => s.studentNumber || s.user?.studentNumber || "N/A" },
  { header: "Email Address", accessor: (s) => s.user?.email || "N/A" },
  { header: "Absence Date", accessor: (s) => formatSlipDate(s.dateOfAbsence) },
  { header: "Date Needed", accessor: (s) => formatSlipDate(s.dateNeeded) },
  { header: "Category", accessor: (s) => s.category?.name || "N/A" },
  { header: "Status", accessor: (s) => s.status?.name || "Unknown" },
  { header: "Date Submitted", accessor: (s) => formatSlipDate(s.createdAt) },
];
import type { CSVColumn } from "@/lib/csvExport";
import type { IIRProfileView } from "@/features/iir/types";

const YEAR_LEVEL_LABELS: Record<number, string> = {
  1: "1st Year",
  2: "2nd Year",
  3: "3rd Year",
  4: "4th Year",
};

function getStudentFullName(student: IIRProfileView): string {
  const lastNameWithSuffix = `${student.lastName || ""}${
    student.suffixName ? ` ${student.suffixName}` : ""
  }`.trim();

  const firstNameWithMI = `${student.firstName || ""}${
    student.middleName ? ` ${student.middleName.charAt(0).toUpperCase()}.` : ""
  }`.trim();

  return [lastNameWithSuffix, firstNameWithMI].filter(Boolean).join(", ");
}

// MAKE SURE THIS EXACT NAME IS EXPORTED HERE
export const studentExportColumns: CSVColumn<IIRProfileView>[] = [
  { header: "Student Name", accessor: (s) => getStudentFullName(s) || "Unnamed Student" },
  { header: "Student Number", accessor: (s) => s.studentNumber ?? "" },
  { header: "Email Address", accessor: (s) => s.email ?? "" },
  { header: "Program", accessor: (s) => s.program?.code ?? "" },
  { header: "Year Level", accessor: (s) => YEAR_LEVEL_LABELS[s.yearLevel] ?? "" },
  { header: "Status", accessor: (s) => s.status?.name ?? "Unknown" },
];
export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

export function exportToCSV<T>(
  data: T[],
  columns: CSVColumn<T>[],
  filenamePrefix: string,
) {
  const escapeCell = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.map((c) => escapeCell(c.header)).join(",");
  const rows = data.map((row) =>
    columns.map((c) => escapeCell(c.accessor(row))).join(","),
  );
  const csvContent = [header, ...rows].join("\r\n");

  // BOM ensures Excel reads UTF-8 correctly (accented names, ñ, etc.)
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = `${String(now.getHours()).padStart(2, "0")}-${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;

  link.href = url;
  link.setAttribute("download", `${filenamePrefix}-${date}_${time}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
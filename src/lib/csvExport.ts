import api from "./api";

export interface CSVColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

type ExportQueryParams = Record<
  string,
  string | number | boolean | null | undefined
>;

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

export async function exportBackendCSV(
  endpoint: string,
  params: ExportQueryParams,
  filenamePrefix: string,
) {
  try {
    // An export must represent the whole result set. Keep the active search,
    // filters, and sort settings, but never carry table pagination to export.
    const { page, page_size, pageSize, ...exportParams } = params;

    const response = await api.get(endpoint, {
      params: {
        ...exportParams,
        export: "csv",
      },
      responseType: "blob",
    });

    const blob = new Blob(["\uFEFF", response.data], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    const disposition = response.headers["content-disposition"];
    let finalFilename = `${filenamePrefix}.csv`;

    if (disposition && disposition.includes("filename=")) {
      finalFilename = disposition.split("filename=")[1].replace(/["']/g, "");
    } else {
      const now = new Date();
      const date = now.toISOString().split("T")[0];
      const time = `${String(now.getHours()).padStart(2, "0")}-${String(
        now.getMinutes(),
      ).padStart(2, "0")}`;
      finalFilename = `${filenamePrefix}-${date}_${time}.csv`;
    }

    link.setAttribute("download", finalFilename);
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download CSV from backend:", error);
    throw error;
  }
}

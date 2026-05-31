import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "appointments" | "slips";
  monthName: string;
  yearName: string;
  data: any[];
}

export function ReportModal({
  isOpen,
  onClose,
  type,
  monthName,
  yearName,
  data,
}: ReportModalProps) {
  const filteredData = useMemo(() => {
    if (type === "appointments") {
      return data.filter(
        (item) => item.status?.name?.toLowerCase() === "completed",
      );
    } else {
      return data.filter((item) => item.ticket?.isVerified === true);
    }
  }, [data, type]);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    filteredData.forEach((item) => {
      const cat =
        type === "appointments"
          ? item.appointmentCategory?.name || "General"
          : item.category?.name || "Excuse Slip";
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return stats;
  }, [filteredData, type]);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const title =
      type === "appointments"
        ? "Monthly Counseling Logbook - Appointments"
        : "Monthly Logbook - Verified Admission Slips";

    const period = `${monthName} ${yearName}`;

    const rowsHtml = filteredData
      .map((item, index) => {
        if (type === "appointments") {
          const sName = item.user
            ? `${item.user.lastName}, ${item.user.firstName}`
            : "N/A";
          const sNum =
            item.studentNumber || item.user?.studentNumber || "N/A";
          const catName = item.appointmentCategory?.name || "N/A";
          const reason = item.reason || "N/A";
          return `
            <tr>
              <td style="
                border: 1px solid #333;
                padding: 6px;
                text-align: center;
              ">${index + 1}</td>
              <td style="border: 1px solid #333; padding: 6px;">
                ${item.whenDate}
              </td>
              <td style="border: 1px solid #333; padding: 6px;">
                ${sName}
              </td>
              <td style="border: 1px solid #333; padding: 6px;">
                ${sNum}
              </td>
              <td style="border: 1px solid #333; padding: 6px;">
                ${catName}
              </td>
              <td style="border: 1px solid #333; padding: 6px;">
                ${reason}
              </td>
              <td style="
                border: 1px solid #333;
                padding: 6px;
                text-align: center;
              ">Completed</td>
            </tr>
          `;
        } else {
          const sName = item.user
            ? `${item.user.lastName}, ${item.user.firstName}`
            : "N/A";
          const sNum = item.user?.studentNumber || "N/A";
          const code = item.ticket?.ticketCode || "N/A";
          const dates = item.dateOfAbsence || "N/A";
          const reason = item.reason || "N/A";
          return `
            <tr>
              <td style="
                border: 1px solid #333;
                padding: 6px;
                text-align: center;
              ">${index + 1}</td>
              <td style="border: 1px solid #333; padding: 6px;">
                ${dates}
              </td>
              <td style="border: 1px solid #333; padding: 6px;">
                ${sName}
              </td>
              <td style="border: 1px solid #333; padding: 6px;">
                ${sNum}
              </td>
              <td style="border: 1px solid #333; padding: 6px;">
                ${code}
              </td>
              <td style="border: 1px solid #333; padding: 6px;">
                ${reason}
              </td>
              <td style="
                border: 1px solid #333;
                padding: 6px;
                text-align: center;
              ">Verified</td>
            </tr>
          `;
        }
      })
      .join("");

    const statsHtml = Object.entries(categoryStats)
      .map(
        ([cat, count]) => `
      <div style="
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        font-size: 14px;
      ">
        <span><strong>${cat}:</strong></span>
        <span>${count}</span>
      </div>
    `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              font-size: 18px;
              font-weight: bold;
            }
            .header h2 {
              margin: 5px 0 0;
              font-size: 14px;
              font-weight: normal;
            }
            .header h3 {
              margin: 5px 0 0;
              font-size: 14px;
              font-weight: bold;
            }
            .main-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 12px;
            }
            .main-table th {
              border: 1px solid #333;
              padding: 8px;
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .main-table td {
              border: 1px solid #333;
              padding: 8px;
            }
            .summary {
              margin-top: 20px;
              border: 1px solid #333;
              padding: 15px;
              border-radius: 4px;
            }
            .summary-title {
              font-weight: bold;
              margin-bottom: 10px;
              font-size: 14px;
              border-bottom: 1px solid #333;
              padding-bottom: 5px;
            }
            .footer {
              margin-top: 50px;
              display: flex;
              justify-content: space-between;
            }
            .signature {
              width: 200px;
              text-align: center;
            }
            .signature-line {
              border-bottom: 1px solid #333;
              margin-top: 40px;
              margin-bottom: 5px;
            }
            @media print {
              body { padding: 0; }
              .summary, .footer { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>POLYTECHNIC UNIVERSITY OF THE PHILIPPINES</h1>
            <h2>Office of Counselling and Guidance</h2>
            <h3>${title}</h3>
            <p style="margin: 5px 0 0; font-size: 12px;">Period: ${period}</p>
          </div>
          <div style="
            margin-bottom: 20px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
          ">
            <span>
              <strong>Generated:</strong>{" "}
              {new Date().toLocaleString()}
            </span>
            <span>
              <strong>Total Verified Records:</strong>{" "}
              {filteredData.length}
            </span>
          </div>
          <table class="main-table">
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                ${
                  type === "appointments"
                    ? `
                  <th style="width: 15%">Date</th>
                  <th style="width: 25%">Student Name</th>
                  <th style="width: 15%">Student Number</th>
                  <th style="width: 15%">Category</th>
                  <th style="width: 15%">Reason</th>
                  <th style="width: 10%">Status</th>
                `
                    : `
                  <th style="width: 15%">Date of Absence</th>
                  <th style="width: 25%">Student Name</th>
                  <th style="width: 15%">Student Number</th>
                  <th style="width: 15%">Ticket Code</th>
                  <th style="width: 20%">Reason</th>
                  <th style="width: 10%">Status</th>
                `
                }
              </tr>
            </thead>
            <tbody>
              ${
                rowsHtml ||
                `<tr>
                  <td colspan="7" style="text-align: center; padding: 20px;">
                    No records found.
                  </td>
                </tr>`
              }
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-title">STATISTICAL SUMMARY</div>
            <div style="
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-size: 14px;
            ">
              <span><strong>Total:</strong></span>
              <span><strong>${filteredData.length}</strong></span>
            </div>
            ${statsHtml}
          </div>

          <div class="footer">
            <div class="signature">
              <div class="signature-line"></div>
              <div style="font-size: 12px; font-weight: bold;">Prepared By</div>
              <div style="font-size: 10px; color: #666;">
                Guidance Counselor
              </div>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div style="font-size: 12px; font-weight: bold;">Approved By</div>
              <div style="font-size: 10px; color: #666;">
                Director of Guidance
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    const filename = `${type}_report_${monthName}_${yearName}.csv`;
    let headers: string[];
    let rows: string[][];

    if (type === "appointments") {
      headers = [
        "No.",
        "Date",
        "Student Name",
        "Student Number",
        "Category",
        "Reason",
        "Status",
      ];
      rows = filteredData.map((item, index) => {
        const sName = item.user
          ? `${item.user.lastName}, ${item.user.firstName}`
          : "N/A";
        const sNum =
          item.studentNumber || item.user?.studentNumber || "N/A";
        const catName = item.appointmentCategory?.name || "N/A";
        const reason = item.reason || "N/A";
        return [
          String(index + 1),
          item.whenDate,
          sName,
          sNum,
          catName,
          reason,
          "Completed",
        ];
      });
    } else {
      headers = [
        "No.",
        "Date of Absence",
        "Student Name",
        "Student Number",
        "Ticket Code",
        "Reason",
        "Status",
      ];
      rows = filteredData.map((item, index) => {
        const sName = item.user
          ? `${item.user.lastName}, ${item.user.firstName}`
          : "N/A";
        const sNum = item.user?.studentNumber || "N/A";
        const code = item.ticket?.ticketCode || "N/A";
        const dates = item.dateOfAbsence || "N/A";
        const reason = item.reason || "N/A";
        return [
          String(index + 1),
          dates,
          sName,
          sNum,
          code,
          reason,
          "Verified",
        ];
      });
    }

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [
        headers.join(","),
        ...rows.map((e) =>
          e.map((val) => `"${val.replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent
        className="max-w-4xl max-h-[85vh] flex flex-col p-6 rounded-2xl"
      >
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Monthly Report Preview
          </DialogTitle>
          <DialogDescription>
            Preview of logbook report for {monthName} {yearName}. Only{" "}
            {type === "appointments" ? "completed" : "verified"} items are
            included.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto my-4 space-y-6 pr-1">
          {/* Header section */}
          <div className="text-center space-y-1 py-4 border-b border-border">
            <h1 className="font-bold text-base tracking-wide text-foreground">
              POLYTECHNIC UNIVERSITY OF THE PHILIPPINES
            </h1>
            <p className="text-xs text-muted-foreground">
              Office of Counselling and Guidance
            </p>
            <p className="font-semibold text-sm pt-2 text-foreground">
              {type === "appointments"
                ? "Monthly Counseling Logbook - Appointments"
                : "Monthly Logbook - Verified Admission Slips"}
            </p>
            <p className="text-xs text-muted-foreground">
              Period: {monthName} {yearName}
            </p>
          </div>

          {/* Table Preview */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th
                    className={
                      "p-3 font-semibold " +
                      "text-muted-foreground w-12 text-center"
                    }
                  >
                    #
                  </th>
                  {type === "appointments" ? (
                    <>
                      <th
                        className="p-3 font-semibold text-muted-foreground w-28"
                      >
                        Date
                      </th>
                      <th className="p-3 font-semibold text-muted-foreground">
                        Student Name
                      </th>
                      <th
                        className="p-3 font-semibold text-muted-foreground w-32"
                      >
                        Student Number
                      </th>
                      <th
                        className="p-3 font-semibold text-muted-foreground w-36"
                      >
                        Category
                      </th>
                      <th className="p-3 font-semibold text-muted-foreground">
                        Reason
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        className="p-3 font-semibold text-muted-foreground w-36"
                      >
                        Date of Absence
                      </th>
                      <th className="p-3 font-semibold text-muted-foreground">
                        Student Name
                      </th>
                      <th
                        className="p-3 font-semibold text-muted-foreground w-32"
                      >
                        Student Number
                      </th>
                      <th
                        className="p-3 font-semibold text-muted-foreground w-32"
                      >
                        Ticket Code
                      </th>
                      <th className="p-3 font-semibold text-muted-foreground">
                        Reason
                      </th>
                    </>
                  )}
                  <th
                    className={
                      "p-3 font-semibold " +
                      "text-muted-foreground w-20 text-center"
                    }
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No records found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => {
                    const sName = item.user
                      ? `${item.user.lastName}, ${item.user.firstName}`
                      : "N/A";
                    const sNum =
                      type === "appointments"
                        ? item.studentNumber ||
                          item.user?.studentNumber ||
                          "N/A"
                        : item.user?.studentNumber || "N/A";
                    const col2 =
                      type === "appointments"
                        ? item.whenDate
                        : item.dateOfAbsence;
                    const col5 =
                      type === "appointments"
                        ? item.appointmentCategory?.name || "N/A"
                        : item.ticket?.ticketCode || "N/A";

                    return (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-muted/30"
                      >
                        <td className="p-3 text-center text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-medium text-foreground">
                          {col2}
                        </td>
                        <td className="p-3 text-foreground">{sName}</td>
                        <td className="p-3 text-muted-foreground">{sNum}</td>
                        <td className="p-3 text-foreground">{col5}</td>
                        <td
                          className={
                            "p-3 text-muted-foreground " +
                            "max-w-xs truncate"
                          }
                        >
                          {item.reason}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={
                              "px-2 py-0.5 rounded-full text-[10px] " +
                              "font-medium bg-emerald-500/10 " +
                              "text-emerald-500 border border-emerald-500/20"
                            }
                          >
                            {type === "appointments" ? "Completed" : "Verified"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Statistical Summary section */}
          <div
            className={
              "bg-muted/30 border border-border " +
              "p-4 rounded-xl space-y-3"
            }
          >
            <h3
              className="font-semibold text-xs tracking-wider " +
                "text-muted-foreground uppercase"
            >
              Statistical Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div
                className="flex justify-between items-center py-1 " +
                  "border-b border-border/50"
              >
                <span className="text-muted-foreground">Total Count:</span>
                <span className="font-bold text-foreground">
                  {filteredData.length}
                </span>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="text-xs text-muted-foreground font-medium pt-1">
                  Breakdown by Category:
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  {Object.entries(categoryStats).map(([cat, count]) => (
                    <div
                      key={cat}
                      className="flex justify-between py-1 border-b " +
                        "border-border/20"
                    >
                      <span className="text-muted-foreground">{cat}:</span>
                      <span className="font-semibold text-foreground">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportCSV}
            className="flex items-center gap-2"
            disabled={filteredData.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={handlePrint}
            className="flex items-center gap-2"
            disabled={filteredData.length === 0}
          >
            <Printer className="h-4 w-4" />
            Print Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

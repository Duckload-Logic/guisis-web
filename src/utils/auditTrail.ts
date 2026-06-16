import { formatDate, format12HourTime } from "@/utils/dateTime";

export interface AuditTrailEntry {
  timestamp: string;
  status: string;
  remarks: string;
  details?: string;
}

export const formatAuditTimestamp = (tsStr: string): string => {
  if (!tsStr) return "";
  const isoStr = tsStr.replace(" ", "T");
  const dateObj = new Date(isoStr);
  if (isNaN(dateObj.getTime())) return tsStr;

  const dateFormatted = formatDate(dateObj);
  const timeFormatted = format12HourTime(isoStr).replace(" ", "");
  return `${dateFormatted} ${timeFormatted}`;
};

export const parseAuditTrail = (adminNotes?: string): AuditTrailEntry[] => {
  if (!adminNotes) return [];
  const entries: AuditTrailEntry[] = [];
  const blocks = adminNotes.split("------------------------------");

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;

    const lines = block.split("\n");
    const headerLine = lines[0];
    const match = headerLine.match(/^\[(.*?)\]\s+STATUS:\s+(.*)$/i);

    if (match) {
      const timestamp = match[1];
      const status = match[2];
      let remarks = "";
      let details = "";

      const rest = lines.slice(1).join("\n").trim();
      if (rest) {
        if (rest.startsWith("Remarks:")) {
          const remMatch = rest.match(
            /^Remarks:\s*([\s\S]*?)(?:\nRescheduled from|$)/i,
          );
          if (remMatch) {
            remarks = remMatch[1].trim();
          }
          const detIdx = rest.indexOf("Rescheduled from");
          if (detIdx !== -1) {
            details = rest.substring(detIdx).trim();
          }
        } else {
          remarks = rest;
        }
      }

      entries.push({
        timestamp: formatAuditTimestamp(timestamp),
        status,
        remarks,
        details,
      });
    } else {
      entries.push({
        timestamp: "",
        status: "Note Added",
        remarks: block,
      });
    }
  }
  return entries;
};

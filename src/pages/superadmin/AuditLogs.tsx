import { ClipboardList } from "lucide-react";
import LogsTable from "@/features/system-admin/components/LogsTable";
import { useAuditLogs } from "@/features/system-admin/hooks";

const AUDIT_ACTIONS = [
  "USER_CREATED",
  "USER_CREATE_FAILED",
  "USER_UPDATED",
  "USER_UPDATE_FAILED",
  "USER_DELETED",
  "USER_DELETE_FAILED",
  "USER_BLOCKED",
  "USER_BLOCK_FAILED",
  "USER_UNBLOCKED",
  "USER_UNBLOCK_FAILED",
  "ROLE_CHANGED",
  "ROLE_CHANGE_FAILED",
  "APPOINTMENT_CREATED",
  "APPOINTMENT_CREATE_FAILED",
  "APPOINTMENT_UPDATED",
  "APPOINTMENT_UPDATE_FAILED",
  "APPOINTMENT_DELETED",
  "APPOINTMENT_DELETE_FAILED",
  "APPOINTMENT_FAILED",
  "SLIP_CREATED",
  "SLIP_CREATE_FAILED",
  "SLIP_STATUS_UPDATED",
  "SLIP_UPDATED",
  "SLIP_UPDATE_FAILED",
  "SLIP_DELETED",
  "SLIP_DELETE_FAILED",
  "SLIP_FAILED",
  "NOTE_CREATED",
  "NOTE_CREATE_FAILED",
  "NOTE_UPDATED",
  "NOTE_UPDATE_FAILED",
  "NOTE_DELETED",
  "NOTE_DELETE_FAILED",
  "IIR_CREATED",
  "IIR_CREATE_FAILED",
  "IIR_UPDATED",
  "IIR_UPDATE_FAILED",
  "IIR_DELETED",
  "IIR_DELETE_FAILED",
  "IIR_DRAFT_SAVED",
  "IIR_SUBMITTED",
];

export default function AuditLogs() {
  return (
    <LogsTable
      title="Audit Logs"
      icon={<ClipboardList className="h-5 w-5" />}
      description="Review data changes and trace important actions across the system."
      useLogsHook={useAuditLogs}
      actionOptions={AUDIT_ACTIONS}
      showIPAddress={true}
    />
  );
}

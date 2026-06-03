import { Server } from "lucide-react";
import LogsTable from "@/features/system-admin/components/LogsTable";
import { useSystemLogs } from "@/features/system-admin/hooks";

const SYSTEM_ACTIONS = [
  "M2M_CLIENT_CREATED",
  "M2M_CLIENT_REVOKED",
  "M2M_CLIENT_VERIFIED",
  "M2M_CLIENT_SECRET_ROTATED",
  "SETTING_CHANGED",
  "M2M_CLIENT_CREATE_FAILED",
  "M2M_CLIENT_REVOKE_FAILED",
  "M2M_CLIENT_VERIFY_FAILED",
  "M2M_CLIENT_SECRET_ROTATE_FAILED",
  "SETTING_CHANGE_FAILED",
  "EMAIL_SEND_SUCCESS",
  "EMAIL_SEND_FAILED",
  "OCR_PROCESSING_SUCCESS",
  "OCR_PROCESSING_FAILED",
];

export default function SystemLogs() {
  return (
    <LogsTable
      title="System Logs"
      icon={<Server className="h-5 w-5" />}
      description="Track system-level events such as API key operations and settings changes."
      useLogsHook={useSystemLogs}
      actionOptions={SYSTEM_ACTIONS}
    />
  );
}
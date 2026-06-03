import { Shield } from "lucide-react";
import LogsTable from "@/features/system-admin/components/LogsTable";
import { useSecurityLogs } from "@/features/system-admin/hooks";

const SECURITY_ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "TOKEN_REFRESHED",
  "ACCESS_DENIED",
  "RATE_LIMIT_EXCEEDED",
  "INVALID_TOKEN",
  "M2M_CLIENT_USED",
  "M2M_CLIENT_INVALID",
  "M2M_AUTH_SUCCESS",
  "M2M_AUTH_FAILED",
  "M2M_TOKEN_REFRESHED",
  "ELEVATE_ROLES",
  "ELEVATE_ROLES_FAILED",
  "M2M_DATA_ACCESS",
  "M2M_DATA_ACCESS_DENIED",
];

export default function SecurityLogs() {
  return (
    <LogsTable
      title="Security Logs"
      icon={<Shield className="h-5 w-5" />}
      description="Monitor authentication, authorization, and access-related security events."
      useLogsHook={useSecurityLogs}
      actionOptions={SECURITY_ACTIONS}
      showIPAddress
    />
  );
}
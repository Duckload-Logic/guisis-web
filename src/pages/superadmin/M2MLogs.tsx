import { Code } from "lucide-react";
import LogsTable from "@/features/system-admin/components/LogsTable";
import { useM2MLogs } from "@/features/system-admin/hooks";
import { API_ROUTES } from "@/config/apiRoutes";

const M2M_ACTIONS = [
  "M2M_CLIENT_CREATED",
  "M2M_CLIENT_REVOKED",
  "M2M_CLIENT_VERIFIED",
  "M2M_CLIENT_SECRET_ROTATED",
  "M2M_CLIENT_CREATE_FAILED",
  "M2M_CLIENT_REVOKE_FAILED",
  "M2M_CLIENT_VERIFY_FAILED",
  "M2M_CLIENT_SECRET_ROTATE_FAILED",
  "M2M_CLIENT_USED",
  "M2M_CLIENT_INVALID",
  "M2M_AUTH_SUCCESS",
  "M2M_AUTH_FAILED",
  "M2M_TOKEN_REFRESHED",
  "M2M_DATA_ACCESS",
  "M2M_DATA_ACCESS_DENIED",
];

export default function M2MLogs() {
  return (
    <LogsTable
      title="M2M Logs"
      icon={<Code className="h-5 w-5" />}
      description="Monitor machine-to-machine activity and API integrations."
      useLogsHook={useM2MLogs}
      actionOptions={M2M_ACTIONS}
      showIPAddress={true}
      exportEndpoint={API_ROUTES.superadmin.logs.m2m}
    />
  );
}

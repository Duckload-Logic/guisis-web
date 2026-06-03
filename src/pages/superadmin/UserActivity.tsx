import { useParams } from "react-router-dom";
import { History } from "lucide-react";
import LogsTable from "@/features/system-admin/components/LogsTable";
import { useUserActivity, useUsers } from "@/features/system-admin/hooks";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";

const ACTIVITY_ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "USER_CREATED",
  "USER_UPDATED",
  "ROLE_CHANGED",
  "APPOINTMENT_CREATED",
  "APPOINTMENT_UPDATED",
  "SLIP_CREATED",
  "SLIP_STATUS_UPDATED",
  "NOTE_CREATED",
  "NOTE_UPDATED",
  "NOTE_DELETED",
  "IIR_CREATED",
  "IIR_UPDATED",
  "IIR_DELETED",
  "IIR_SUBMITTED",
];

export default function UserActivity() {
  const { userId } = useParams<{ userId: string }>();

  // Fetch user info for the header
  const { data: userData } = useUsers({ search: userId });
  const targetUser = useMemo(
    () => userData?.users.find((u) => u.id === userId),
    [userData, userId],
  );

  // Wrapper hook for LogsTable
  const useActivityHook = (params?: any) => useUserActivity(userId!, params);

  return (
    <div className="space-y-6">
      {targetUser && (
        <div className="flex items-center gap-4 rounded-[22px] border border-white/20 bg-white/40 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
            {targetUser.firstName[0]}
            {targetUser.lastName[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {targetUser.firstName} {targetUser.lastName}
            </h2>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {targetUser.email}
              </span>
              <div className="flex flex-wrap gap-1">
                {targetUser.roles.map((role) => (
                  <Badge
                    key={role.id}
                    variant="outline"
                    className="h-5 rounded-full text-[10px] uppercase"
                  >
                    {role.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <LogsTable
        title="User Activity Audit"
        icon={<History className="h-5 w-5" />}
        description="Comprehensive audit trail of all actions performed by this user."
        useLogsHook={useActivityHook}
        actionOptions={ACTIVITY_ACTIONS}
        showIPAddress={true}
      />
    </div>
  );
}

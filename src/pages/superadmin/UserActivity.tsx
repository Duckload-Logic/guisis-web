import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { History, ArrowLeft } from "lucide-react";
import LogsTable from "@/features/system-admin/components/LogsTable";
import { useUserActivity, useUsers } from "@/features/system-admin/hooks";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();

  // Fetch user info for the header
  const { data: userData } = useUsers({ search: userId });
  const targetUser = useMemo(
    () => userData?.users.find((u) => u.id === userId),
    [userData, userId],
  );

  // Wrapper hook for LogsTable
  const useActivityHook = (params?: any) => useUserActivity(userId!, params);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate("/superadmin/users")}
          className="h-10 gap-2 rounded-xl border-border/70 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Users</span>
        </Button>
      </div>

      {targetUser && (
        <div
          className={cn(
            "flex items-center gap-4 rounded-[22px] border border-border",
            "bg-card/60 p-5 backdrop-blur-xl",
          )}
        >
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl",
              "bg-primary/10 text-lg font-bold text-primary",
            )}
          >
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
                {targetUser.roles?.map((role) => (
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
        description="Comprehensive audit trail of all actions for this user."
        useLogsHook={useActivityHook}
        actionOptions={ACTIVITY_ACTIONS}
        showIPAddress={true}
      />
    </motion.div>
  );
}

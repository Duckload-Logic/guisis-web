import { useParams, useNavigate } from "react-router-dom";
import { useLogDetail } from "@/features/system-admin/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePageMetadata } from "@/context";
import {
  ArrowLeft,
  Clock,
  User,
  Globe,
  ArrowRight,
  Terminal,
  Database,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TraceTracksViewer } from "@/features/system-admin/components/LogsTable";

const ACTION_BADGE_COLORS: Record<string, string> = {
  LOGIN_SUCCESS:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  LOGIN_FAIL: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  LOGOUT:
    "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400",
  USER_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  USER_BLOCKED:
    "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  USER_UNBLOCKED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  ROLE_CHANGED:
    "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  SLIP_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  SLIP_STATUS_UPDATED:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  APPOINTMENT_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  APPOINTMENT_UPDATED:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  STUDENT_RECORD_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  STUDENT_RECORD_UPDATED:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  M2M_CLIENT_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  M2M_CLIENT_REVOKED:
    "border-red-500/20 bg-red-500/10 " +
    "text-red-700 dark:text-red-400",
  M2M_CLIENT_VERIFIED:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  M2M_CLIENT_SECRET_ROTATED:
    "border-amber-500/20 bg-amber-500/10 " +
    "text-amber-700 dark:text-amber-400",
  M2M_CLIENT_USED:
    "border-blue-500/20 bg-blue-500/10 " +
    "text-blue-700 dark:text-blue-400",
  M2M_CLIENT_INVALID:
    "border-red-500/20 bg-red-500/10 " +
    "text-red-700 dark:text-red-400",
  M2M_AUTH_SUCCESS:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  M2M_AUTH_FAILED:
    "border-red-500/20 bg-red-500/10 " +
    "text-red-700 dark:text-red-400",
  M2M_TOKEN_REFRESHED:
    "border-blue-500/20 bg-blue-500/10 " +
    "text-blue-700 dark:text-blue-400",
  M2M_DATA_ACCESS:
    "border-blue-500/20 bg-blue-500/10 " +
    "text-blue-700 dark:text-blue-400",
  M2M_DATA_ACCESS_DENIED:
    "border-red-500/20 bg-red-500/10 " +
    "text-red-700 dark:text-red-400",
  BACKUP_COMPLETED:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  BACKUP_FAILED:
    "border-red-500/20 bg-red-500/10 " +
    "text-red-700 dark:text-red-400",
};

export default function LogDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: log, isLoading, error } = useLogDetail(id || "");

  usePageMetadata({
    title: "Log Entry Details",
    description:
      "Detailed system telemetry data and transactional execution traces.",
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ");
  };

  if (isLoading) {
    return (
      <div className="flex h-64 animate-pulse items-center justify-center">
        <Clock className="mr-2 h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          Loading log detail...
        </span>
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-destructive">
              Error Loading Log Details
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't retrieve the specified log entry. It may not exist.
            </p>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="mt-4 rounded-xl"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Details Section */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Terminal size={18} />
                </span>
                Log Information (ID #{log.id})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Action
                  </span>
                  <div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-2.5 py-1 text-xs font-semibold",
                        ACTION_BADGE_COLORS[log.action] ||
                          "border-white/20 bg-white/5 text-muted-foreground",
                      )}
                    >
                      {formatAction(log.action)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Timestamp
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {formatDate(log.createdAt)}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actor
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {log.userEmail || "System"}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Target
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    {log.targetEmail || "None"}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    IP Address
                  </span>
                  <div className="flex items-center gap-1.5 text-sm text-foreground">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {log.ipAddress || "—"}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    User Agent
                  </span>
                  <div
                    className="max-w-sm truncate text-sm text-foreground"
                    title={log.userAgent}
                  >
                    {log.userAgent || "—"}
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Message
                </span>
                <div className="border-card-border max-h-[400px] overflow-x-auto rounded-xl border bg-background p-4 font-mono text-xs text-muted-foreground">
                  {log.message}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <Card>
              <CardHeader className="border-card-border border-b pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Database className="h-5 w-5 text-primary" />
                  Metadata Changes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <pre className="border-card-border max-h-[400px] overflow-x-auto rounded-xl border bg-background p-4 font-mono text-xs text-muted-foreground">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Trace Tracks Timeline */}
        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader className="border-b border-white/10 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="h-5 w-5 animate-pulse text-primary" />
                Execution Trace Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {log.traceId ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-background p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Trace ID
                    </span>
                    <span className="select-all break-all font-mono text-xs text-foreground">
                      {log.traceId}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Chronological Events
                    </span>
                    <div className="mt-4 h-full">
                      <TraceTracksViewer
                        traceId={log.traceId}
                        currentLogId={log.id}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-sm italic text-muted-foreground">
                  No Trace ID associated with this log.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

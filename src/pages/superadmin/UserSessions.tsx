import { useParams } from "react-router-dom";
import {
  ShieldCheck,
  Monitor,
  MapPin,
  Clock,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import {
  useUserSessions,
  useRevokeUserSession,
  useUsers,
} from "@/features/system-admin/hooks";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePageMetadata } from "@/context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UserSessions() {
  const { userId } = useParams<{ userId: string }>();

  // Fetch user info for the header
  const { data: userData } = useUsers({ search: userId });
  const targetUser = useMemo(
    () => userData?.users.find((u) => u.id === userId),
    [userData, userId],
  );

  const { data: sessions, isLoading, refetch } = useUserSessions(userId!);
  const revokeMutation = useRevokeUserSession(userId!);

  usePageMetadata({
    title: "Active Sessions Audit",
    description:
      "Monitor and manage active device sessions for this security principal.",
    badgeText: "Security Audit",
    badgeIcon: <ShieldCheck className="h-3 w-3" />,
  });

  const handleRevoke = async (sessionId: string) => {
    try {
      await revokeMutation.mutateAsync(sessionId);
      refetch();
    } catch (error) {}
  };

  const formatBrowser = (ua: string) => {
    if (!ua) return "Unknown Device";
    if (ua.includes("Firefox")) return "Mozilla Firefox";
    if (ua.includes("Chrome")) return "Google Chrome";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Apple Safari";
    if (ua.includes("Edge")) return "Microsoft Edge";
    return "Web Browser";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-32 w-full animate-pulse rounded-2xl bg-white/20"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      {targetUser && (
        <div className="flex items-center gap-4 rounded-[22px] border border-white/20 bg-white/40 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
            {targetUser.firstName[0]}
            {targetUser.lastName[0]}
          </div>
          <div className="flex-1">
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
          <div className="text-right">
            <Badge
              variant="outline"
              className="rounded-lg border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-600"
            >
              {sessions?.length || 0} Active Session
              {(sessions?.length || 0) !== 1 ? "s" : ""}
            </Badge>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {sessions?.length === 0 ? (
          <Card className="border-2 border-dashed bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <ShieldAlert className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
              <p className="font-semibold text-muted-foreground">
                No active sessions found.
              </p>
              <p className="mt-1 text-sm text-muted-foreground/60">
                This user is currently logged out of all devices.
              </p>
            </CardContent>
          </Card>
        ) : (
          sessions?.map((session: any) => (
            <Card
              key={session.jti}
              className="group overflow-hidden rounded-[22px] border border-white/20 bg-white/45 transition-all hover:bg-white/60 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-5 p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/30 bg-white/70 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]">
                      <Monitor className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold tracking-tight">
                          {formatBrowser(session.userAgent)}
                        </h3>
                        {session.isCurrent && (
                          <Badge
                            variant="secondary"
                            className="rounded-md border-primary/20 bg-primary/10 text-primary"
                          >
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-muted-foreground md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <MapPin
                            size={14}
                            className="opacity-60"
                          />
                          <span className="font-mono text-xs">
                            {session.ipAddress || "Unknown IP"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock
                            size={14}
                            className="opacity-60"
                          />
                          <span>Last active: Just now</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center bg-card sm:border-l sm:border-t-0 sm:px-8">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-11 w-full gap-2 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 sm:w-auto"
                        >
                          <XCircle size={18} />
                          Revoke Session
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Revoke Device Session?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will immediately terminate the user's session
                            on this device. They will be forced to log in again.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">
                            Keep Session
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRevoke(session.jti)}
                            className="rounded-xl bg-red-500 text-white hover:bg-red-600"
                          >
                            Revoke Access
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

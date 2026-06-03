import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Fingerprint,
  Activity,
  ShieldAlert,
  Key,
  Server,
  Database,
  Layers,
  Cpu,
  Mail,
  Clock,
  AlertTriangle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { usePageMetadata } from "@/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useLogStats,
  useAdminAnalytics,
  useM2MClients,
  useSystemLogs,
  useAuditLogs,
  useSecurityLogs,
  useLogActivity,
} from "@/features/system-admin/hooks";
import { cn } from "@/lib/utils";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const { data: logStatsData, isLoading: logStatsLoading } = useLogStats();
  const logStats = logStatsData ?? [];
  const { data: analytics, isLoading: analyticsLoading } = useAdminAnalytics();
  const { data: m2mClientsData, isLoading: m2mLoading } = useM2MClients();
  const m2mClients = m2mClientsData ?? [];
  const { data: systemLogsData, isLoading: logsLoading } = useSystemLogs({
    page_size: 5,
  });
  const { data: auditLogsData, isLoading: auditLogsLoading } = useAuditLogs({
    page_size: 5,
  });
  const { data: securityLogsData, isLoading: securityLogsLoading } =
    useSecurityLogs({
      page_size: 5,
    });
  const { data: logActivityData, isLoading: activityLoading } =
    useLogActivity();
  const logActivity = logActivityData ?? [];

  const systemLogs = systemLogsData?.logs ?? [];
  const auditLogs = auditLogsData?.logs ?? [];
  const securityLogs = securityLogsData?.logs ?? [];

  const isLoading =
    logStatsLoading ||
    analyticsLoading ||
    m2mLoading ||
    logsLoading ||
    auditLogsLoading ||
    securityLogsLoading ||
    activityLoading;

  const pendingM2M = useMemo(
    () => m2mClients.filter((c) => !c.isVerified),
    [m2mClients],
  );

  const { totalRequests, totalErrors } = useMemo(() => {
    return logActivity.reduce(
      (acc, curr) => {
        acc.totalRequests += curr.requests;
        acc.totalErrors += curr.errors;
        return acc;
      },
      { totalRequests: 0, totalErrors: 0 },
    );
  }, [logActivity]);

  const uptimeValue = useMemo(() => {
    if (totalRequests === 0) return "100.00%";
    const rate = ((totalRequests - totalErrors) / totalRequests) * 100;
    return `${Math.max(0, rate).toFixed(2)}%`;
  }, [totalRequests, totalErrors]);

  const hasAIError = useMemo(() => {
    const threshold = Date.now() - 15 * 60 * 1000; // 15 minutes
    return [...systemLogs, ...auditLogs, ...securityLogs].some((log) => {
      const isMatch =
        log.message.toLowerCase().includes("huggingface") ||
        log.message.toLowerCase().includes("classifierclient") ||
        log.message.toLowerCase().includes("ai classification") ||
        log.message.toLowerCase().includes("ocr_processing_failed") ||
        log.message.toLowerCase().includes("ocr cor processing");
      const isRecent = new Date(log.createdAt).getTime() > threshold;
      return isMatch && isRecent;
    });
  }, [systemLogs, auditLogs, securityLogs]);

  const hasMailError = useMemo(() => {
    const threshold = Date.now() - 15 * 60 * 1000; // 15 minutes
    return [...systemLogs, ...auditLogs, ...securityLogs].some((log) => {
      const isMatch =
        log.message.toLowerCase().includes("mailpit") ||
        log.message.toLowerCase().includes("smtp mailer failed") ||
        log.message.toLowerCase().includes("failed to send email");
      const isRecent = new Date(log.createdAt).getTime() > threshold;
      return isMatch && isRecent;
    });
  }, [systemLogs, auditLogs, securityLogs]);

  usePageMetadata(
    useMemo(
      () => ({
        title: "System Control",
        badgeText: "Operational Hub",
        badgeIcon: <Server className="h-3 w-3" />,
        description:
          "Operational command center for service health, " +
          "critical security logs, and developer API keys.",
      }),
      [hasAIError, hasMailError],
    ),
  );

  const metrics = [
    {
      label: "Operational Uptime",
      value: uptimeValue,
      icon: Clock,
      subtext: "Last 24 hours success rate",
      colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Active Redis Sessions",
      value: analytics?.liveSessions ?? 0,
      icon: Activity,
      subtext: "Live active token instances",
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Security Audit Alerts",
      value:
        logStats.find(
          (s) =>
            s.category === "SECURITY" &&
            (s.level === "ERROR" || s.level === "WARNING"),
        )?.count ?? 0,
      icon: ShieldAlert,
      subtext: "Flagged login anomalies",
      colorClass: "text-red-500 bg-red-500/10 border-red-500/20",
    },
    {
      label: "Unverified M2M Clients",
      value: pendingM2M.length,
      icon: Key,
      subtext: "M2M partners awaiting audit",
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
  ];

  const services = useMemo(() => {
    const isApiHealthy = !isLoading && logStatsData !== undefined;
    const isDbHealthy = !isLoading && logStatsData !== undefined;
    const isRedisHealthy = !isLoading && analytics !== undefined;
    const isAIHealthy = isApiHealthy && !hasAIError;
    const isMailHealthy = isApiHealthy && !hasMailError;

    return [
      {
        name: "API Gateway Server",
        status: isApiHealthy ? "Operational" : "Offline",
        desc: "Go-Gin engine routing client & admin endpoints",
        icon: Server,
        isHealthy: isApiHealthy,
      },
      {
        name: "MySQL Database",
        status: isDbHealthy ? "Connected" : "Offline",
        desc: "Relational persistence layer, indexing guidances & accounts",
        icon: Database,
        isHealthy: isDbHealthy,
      },
      {
        name: "Redis Cache Store",
        status: isRedisHealthy ? "Connected" : "Offline",
        desc: "In-memory session manager tracking live web tokens",
        icon: Layers,
        isHealthy: isRedisHealthy,
      },
      {
        name: "AI FastAPI Service",
        status: isAIHealthy ? "Operational" : "Degraded",
        desc: "HuggingFace model classifying student IIR submissions",
        icon: Cpu,
        isHealthy: isAIHealthy,
      },
      {
        name: "Notification SMTP",
        status: isMailHealthy ? "Active" : "Degraded",
        desc: "Outgoing transactional mailer sending alerts & summaries",
        icon: Mail,
        isHealthy: isMailHealthy,
      },
    ];
  }, [isLoading, logStatsData, analytics, hasAIError, hasMailError]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className={
              "h-12 w-12 animate-spin rounded-full border-4 " +
              "border-primary border-t-transparent"
            }
          />
          <p className="animate-pulse text-sm text-muted-foreground">
            Synchronizing command interface...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-6">
      {/* Alert Banner for pending M2M approvals */}
      {pendingM2M.length > 0 && (
        <div
          className={
            "flex flex-col gap-4 rounded-2xl border border-amber-500/20 " +
            "bg-amber-500/10 p-4 sm:flex-row sm:items-center" +
            "sm:justify-between"
          }
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-amber-500">
                M2M Clients Awaiting Security Verification
              </p>
              <p className="text-xs text-muted-foreground">
                There are {pendingM2M.length} developer clients that need manual
                approval before accessing student integration endpoints.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "border-amber-500/20 text-amber-600",
              "hover:bg-amber-500/20 hover:text-amber-700 sm:w-auto",
            )}
            onClick={() => navigate("/superadmin/m2m-management")}
          >
            Review Clients
          </Button>
        </div>
      )}

      {/* KPI Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div
                  className={cn("rounded-2xl border p-3", metric.colorClass)}
                >
                  <metric.icon size={20} />
                </div>
              </div>
              <div className="mt-4">
                <p
                  className={
                    "text-xs font-bold uppercase " + "text-muted-foreground"
                  }
                >
                  {metric.label}
                </p>
                <p className="mt-1 text-3xl font-bold">{metric.value}</p>
                <p className="mt-1 text-[10px] text-muted-foreground/60">
                  {metric.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Operations Overview and Status Dashboard */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Core Services Health Board */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Platform Service Board
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Dynamic operational health checklist of critical subsystems
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service) => (
              <div
                key={service.name}
                className={cn(
                  "flex items-start gap-3 rounded-xl border",
                  "border-white/5 bg-white/[0.01] p-3 text-sm",
                )}
              >
                <div
                  className={
                    "mt-0.5 rounded-lg bg-muted/40 p-2 " +
                    "text-muted-foreground"
                  }
                >
                  <service.icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground">
                      {service.name}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        service.isHealthy
                          ? "bg-emerald-500/10 text-emerald-500"
                          : service.status === "Degraded"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-red-500/10 text-red-500",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          service.isHealthy
                            ? "animate-pulse bg-emerald-500"
                            : service.status === "Degraded"
                              ? "bg-amber-500"
                              : "bg-red-500",
                        )}
                      />
                      {service.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {service.desc}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Live System Activity Feed */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Recent Logs
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Most recent administrative audits and firewall log triggers
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...systemLogs, ...auditLogs, ...securityLogs].length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  No system logs recorded.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {[...systemLogs, ...auditLogs, ...securityLogs]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .slice(0, 6)
                    .map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "flex flex-col gap-2 py-3.5 first:pt-0",
                          "last:pb-0 sm:flex-row sm:items-center",
                          "sm:justify-between",
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                log.category === "SECURITY"
                                  ? "border bg-red-500/10 text-red-500 " +
                                      "border-red-500/20"
                                  : log.category === "SYSTEM"
                                    ? "bg-amber-500/10 text-amber-500 " +
                                      "border border-amber-500/20"
                                    : "border bg-blue-500/10 text-blue-500 " +
                                      "border-blue-500/20",
                              )}
                            >
                              {log.category}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              {log.action.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {log.message}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] text-muted-foreground/60">
                            {log.userEmail || "System Agent"}
                          </p>
                          <p className="text-[10px] text-muted-foreground/40">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access Utility Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Admin Shortcuts
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Administrative portals and active user access controllers
          </p>
        </CardHeader>
        <CardContent
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-2",
            "lg:grid-cols-3",
          )}
        >
          {[
            {
              title: "M2M Client Portal",
              desc: "Manage security client keys & integration secrets",
              link: "/superadmin/m2m-management",
              icon: Fingerprint,
              colorClass: "bg-primary/10 text-primary",
            },
            {
              title: "User Management",
              desc: "Manage roles, update statuses, audit activity logs",
              link: "/superadmin/users",
              icon: Users,
              colorClass: "bg-secondary/10 text-secondary",
            },
            {
              title: "System Performance",
              desc: "Detailed charts on metrics and api load metrics",
              link: "/superadmin/analytics",
              icon: Activity,
              colorClass: "bg-primary/10 text-primary",
            },
          ].map((shortcut) => (
            <Button
              key={shortcut.title}
              variant="ghost"
              className={cn(
                "h-auto flex-col items-center justify-center p-6",
                "border border-white/5 bg-white/[0.01]",
                "transition-all hover:bg-muted/30",
              )}
              onClick={() => navigate(shortcut.link)}
            >
              <div
                className={cn(
                  "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl",
                  shortcut.colorClass,
                )}
              >
                <shortcut.icon size={22} />
              </div>
              <span className="font-bold text-foreground">
                {shortcut.title}
              </span>
              <span className="mt-1 text-center text-xs text-muted-foreground">
                {shortcut.desc}
              </span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

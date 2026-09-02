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
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { usePageMetadata } from "@/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useLogStats,
  useM2MClients,
  useSystemLogs,
  useAuditLogs,
  useSecurityLogs,
  useLogActivity,
  useSystemHealth,
} from "@/features/system-admin/hooks";
import { cn } from "@/lib/utils";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const { data: logStatsData, isLoading: logStatsLoading } = useLogStats();
  const logStats = logStatsData ?? [];
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

  const logDistribution = useMemo(() => {
    const total = logStats.reduce((sum, s) => sum + s.count, 0) || 1;
    const secCount =
      logStats
        .filter((s) => s.category === "SECURITY")
        .reduce((sum, s) => sum + s.count, 0) || 0;
    const sysCount =
      logStats
        .filter((s) => s.category === "SYSTEM")
        .reduce((sum, s) => sum + s.count, 0) || 0;
    const auditCount =
      logStats
        .filter((s) => s.category === "AUDIT")
        .reduce((sum, s) => sum + s.count, 0) || 0;

    return {
      security: Math.round((secCount / total) * 100),
      system: Math.round((sysCount / total) * 100),
      audit: Math.round((auditCount / total) * 100),
      secCount,
      sysCount,
      auditCount,
    };
  }, [logStats]);

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
      [],
    ),
  );

  const metrics = [
    {
      label: "Operational Uptime",
      value: uptimeValue,
      icon: Clock,
      subtext: "24-hour request success rate",
      colorClass: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "24h Request Volume",
      value: totalRequests.toLocaleString(),
      icon: Activity,
      subtext: `${totalErrors} errors captured in 24h`,
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
      subtext: "Flagged access & auth anomalies",
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

  const { data: systemHealthData } = useSystemHealth();

  const services = useMemo(() => {
    const serviceMeta: Record<string, { desc: string; icon: any }> = {
      "API Gateway Server": {
        desc: "Go-Gin engine routing client & admin endpoints",
        icon: Server,
      },
      "MySQL Database": {
        desc: "Relational persistence layer, indexing guidances & accounts",
        icon: Database,
      },
      "Redis Cache Store": {
        desc: "In-memory session manager tracking live web tokens",
        icon: Layers,
      },
      "AI FastAPI Service": {
        desc: "HuggingFace model classifying student IIR submissions",
        icon: Cpu,
      },
      "Notification SMTP": {
        desc: "Outgoing transactional mailer sending alerts & summaries",
        icon: Mail,
      },
      "Identity Provider (IDP)": {
        desc: "SSO server authentication gate & OTP fallback controller",
        icon: Fingerprint,
      },
    };

    if (!systemHealthData) {
      return Object.entries(serviceMeta).map(([name, meta]) => ({
        name,
        status: "Checking...",
        desc: meta.desc,
        icon: meta.icon,
        isHealthy: false,
      }));
    }

    return systemHealthData.map((s) => {
      const meta = serviceMeta[s.name] || {
        desc: "System service",
        icon: Server,
      };
      return {
        name: s.name,
        status: s.status,
        desc: meta.desc,
        icon: meta.icon,
        isHealthy: s.isHealthy,
      };
    });
  }, [systemHealthData]);

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
          className={cn(
            "flex flex-col gap-4 rounded-2xl border border-amber-500/20",
            "bg-amber-500/10 p-4 sm:flex-row sm:items-center",
            "sm:justify-between",
          )}
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
              "w-full shrink-0 border-amber-500/20 text-amber-600",
              "hover:bg-amber-500/20 hover:text-amber-700 sm:w-auto",
            )}
            onClick={() => navigate("/superadmin/m2m-management")}
          >
            Review Clients
          </Button>
        </div>
      )}

      {/* Bento Grid Top Section: Key Performance Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className="transition-all hover:border-primary/20 hover:shadow-md"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div
                  className={cn("rounded-xl border p-2.5", metric.colorClass)}
                >
                  <metric.icon size={18} />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground/70">
                  Live Status
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-bold uppercase text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {metric.value}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">
                  {metric.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bento Grid Middle Section: Core Subsystems Board & Log Telemetry */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Main Bento Tile (Span 2): Subsystem Health Check Board */}
        <Card className="col-span-1 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Platform Subsystems Board
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Operational health status across primary system components
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Monitor
              </span>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.name}
                className={cn(
                  "flex flex-col justify-between rounded-xl border p-3.5",
                  "border-border/60 bg-card/50 transition-all",
                  "hover:border-primary/30 hover:bg-card hover:shadow-sm",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={cn(
                      "shrink-0 rounded-lg bg-muted/40 p-2",
                      "text-muted-foreground",
                    )}
                  >
                    <service.icon size={16} />
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5",
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
                    {service.status === "Checking..."
                      ? "Checking"
                      : service.status}
                  </span>
                </div>
                <div className="mt-3 min-w-0">
                  <p className="truncate font-semibold text-foreground text-sm">
                    {service.name}
                  </p>
                  <p
                    className={cn(
                      "mt-1 line-clamp-2 text-xs",
                      "text-wrap leading-relaxed text-muted-foreground",
                    )}
                  >
                    {service.desc}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Side Bento Tile (Span 1): Log Distribution & Telemetry Meters */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Telemetry & Log Mix
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Proportional audit log distribution by category
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-red-500">
                  <ShieldAlert size={14} /> Security Logs
                </span>
                <span>
                  {logDistribution.secCount} ({logDistribution.security}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-500"
                  style={{ width: `${logDistribution.security}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-amber-500">
                  <AlertCircle size={14} /> System Events
                </span>
                <span>
                  {logDistribution.sysCount} ({logDistribution.system}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${logDistribution.system}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-blue-500">
                  <CheckCircle2 size={14} /> Administrative Audits
                </span>
                <span>
                  {logDistribution.auditCount} ({logDistribution.audit}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${logDistribution.audit}%` }}
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl border bg-muted/20 p-3.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <TrendingUp size={14} className="text-emerald-500" />
                System Health Summary
              </div>
              <p className="mt-1 leading-relaxed">
                All security policies and ownership middlewares are enforcing
                access rules normally.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bento Grid Bottom Section: Recent Audit Feed & Command Shortcuts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Live Security & System Audit Log Feed (Span 2) */}
        <Card className="col-span-1 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                Recent Security & Audit Logs
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Real-time security events, access control denials, and audits
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => navigate("/superadmin/security-logs")}
            >
              View All Logs
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...systemLogs, ...auditLogs, ...securityLogs].length === 0 ? (
                <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                  No system logs recorded.
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {[...systemLogs, ...auditLogs, ...securityLogs]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .slice(0, 5)
                    .map((log) => (
                      <div
                        key={log.id}
                        className={cn(
                          "flex min-w-0 flex-col gap-2 py-3 first:pt-0",
                          "last:pb-0 sm:flex-row sm:items-center",
                          "sm:justify-between",
                        )}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px]",
                                "font-bold uppercase border",
                                log.category === "SECURITY"
                                  ? "bg-red-500/10 text-red-500 " +
                                      "border-red-500/20"
                                  : log.category === "SYSTEM"
                                    ? "bg-amber-500/10 text-amber-500 " +
                                      "border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-500 " +
                                      "border-blue-500/20",
                              )}
                            >
                              {log.category}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              {log.action.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="break-words text-xs text-muted-foreground">
                            {log.message}
                          </p>
                        </div>
                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-[10px] text-muted-foreground/80 font-medium">
                            {log.userEmail || "System Agent"}
                          </p>
                          <p className="text-[10px] text-muted-foreground/50">
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

        {/* Quick Command Shortcuts (Span 1) */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Admin Shortcuts
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Direct portals for administrative management
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                title: "M2M Client Portal",
                desc: "Manage client keys & API secrets",
                link: "/superadmin/m2m-management",
                icon: Fingerprint,
                colorClass: "bg-emerald-500/10 text-emerald-500",
              },
              {
                title: "User Control Center",
                desc: "Manage roles, statuses, and sessions",
                link: "/superadmin/users",
                icon: Users,
                colorClass: "bg-blue-500/10 text-blue-500",
              },
              {
                title: "System Performance",
                desc: "Detailed telemetry and error metrics",
                link: "/superadmin/analytics",
                icon: Activity,
                colorClass: "bg-indigo-500/10 text-indigo-500",
              },
            ].map((shortcut) => (
              <div
                key={shortcut.title}
                onClick={() => navigate(shortcut.link)}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3.5",
                  "border-border/60 bg-card cursor-pointer transition-all",
                  "hover:border-primary/40 hover:bg-muted/30 hover:shadow-sm",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      shortcut.colorClass,
                    )}
                  >
                    <shortcut.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {shortcut.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shortcut.desc}
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-muted-foreground/60" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

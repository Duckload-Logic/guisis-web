import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  BarChart,
  Activity,
  ShieldAlert,
  Server,
  Database,
  Layers,
  Cpu,
  Mail,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { usePageMetadata } from "@/context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminAnalytics,
  useUsers,
  useM2MClients,
  useLogStats,
  useUserDistribution,
  useLogActivity,
  useSystemHealth,
} from "@/features/system-admin/hooks";
import { cn } from "@/lib/utils";

// --- CONSTANTS ---
const COLOR_SYSTEM_LOGINS = "#10b981";
const COLOR_SYSTEM_ACTIVITY = "#6366f1";
const COLOR_REQUESTS = "#10b981";
const COLOR_ERRORS = "#ef4444";
const CHART_GRID_STROKE = "rgba(255, 255, 255, 0.06)";
const CHART_TICK_FILL = "#888888";
const CHART_TOOLTIP_BG = "rgba(10, 10, 10, 0.88)";

const ROLE_COLORS: Record<string, string> = {
  superadmin: "#6366f1",
  admin: "#3b82f6",
  counselor: "#06b6d4",
  developer: "#10b981",
  student: "hsl(var(--primary))",
};

export default function AnalyticsOverview() {
  const navigate = useNavigate();
  const [range, setRange] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("daily");

  const {
    data: analytics,
    isLoading: analyticsLoading,
    isFetching: analyticsFetching,
  } = useAdminAnalytics(range);

  const { data: usersData, isLoading: usersLoading } = useUsers({
    page_size: 1,
  });
  const { data: m2mClientsData, isLoading: m2mLoading } = useM2MClients();
  const { data: logStatsData, isLoading: statsLoading } = useLogStats();
  const { data: userDistData, isLoading: distLoading } =
    useUserDistribution();
  const { data: logActivityData, isLoading: activityLoading } =
    useLogActivity();
  const { data: healthData, isLoading: healthLoading } =
    useSystemHealth();

  const isInitialLoading =
    (analyticsLoading && !analytics) ||
    usersLoading ||
    m2mLoading ||
    statsLoading ||
    distLoading ||
    activityLoading ||
    healthLoading;

  usePageMetadata(
    useMemo(
      () => ({
        title: "System Analytics",
        badgeText: "System Intelligence",
        badgeIcon: <BarChart className="h-3 w-3" />,
        description:
          "Operational telemetry, traffic volume, and access footprint.",
      }),
      [],
    ),
  );

  const visitorData = useMemo(() => {
    if (!analytics?.monthlyVisitors) return [];
    return analytics.monthlyVisitors.map((v) => ({
      name: v.period,
      logins: v.logins,
      activity: v.activity,
    }));
  }, [analytics]);

  const logActivity = logActivityData ?? [];

  const activeM2M = useMemo(
    () => (m2mClientsData ?? []).filter((c) => c.isActive).length,
    [m2mClientsData],
  );

  const totalM2M = useMemo(
    () => (m2mClientsData ?? []).length,
    [m2mClientsData],
  );

  const totalLogs = useMemo(
    () => (logStatsData ?? []).reduce((acc, curr) => acc + curr.count, 0),
    [logStatsData],
  );

  const securityEvents = useMemo(
    () =>
      (logStatsData ?? []).find((s) => s.category === "SECURITY")?.count ?? 0,
    [logStatsData],
  );

  const totalUsers = useMemo(
    () => (userDistData ?? []).reduce((acc, curr) => acc + curr.count, 0),
    [userDistData],
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

  const uptimeRate = useMemo(() => {
    if (totalRequests === 0) return "100.0%";
    const rate = ((totalRequests - totalErrors) / totalRequests) * 100;
    return `${Math.max(0, rate).toFixed(1)}%`;
  }, [totalRequests, totalErrors]);

  const errorRate = useMemo(() => {
    if (totalRequests === 0) return "0.00%";
    const rate = (totalErrors / totalRequests) * 100;
    return `${Math.min(100, rate).toFixed(2)}%`;
  }, [totalRequests, totalErrors]);

  const allServicesHealthy = useMemo(() => {
    if (!healthData || healthData.length === 0) return true;
    return healthData.every((s) => s.isHealthy);
  }, [healthData]);

  const subsystems = useMemo(() => {
    const metaMap: Record<
      string,
      { icon: any; searchKey: string }
    > = {
      "API Gateway Server": {
        icon: Server,
        searchKey: "Gateway",
      },
      "MySQL Database": {
        icon: Database,
        searchKey: "MySQL",
      },
      "Redis Cache Store": {
        icon: Layers,
        searchKey: "Redis",
      },
      "AI FastAPI Service": {
        icon: Cpu,
        searchKey: "FastAPI",
      },
      "Notification SMTP": {
        icon: Mail,
        searchKey: "SMTP",
      },
      "Identity Provider (IDP)": {
        icon: Fingerprint,
        searchKey: "IDP",
      },
    };

    if (!healthData || healthData.length === 0) {
      return Object.entries(metaMap).map(([name, meta]) => ({
        name,
        status: "Checking...",
        isHealthy: true,
        latencyMs: undefined as number | undefined,
        icon: meta.icon,
        searchKey: meta.searchKey,
      }));
    }

    return healthData.map((s) => {
      const meta = metaMap[s.name] || {
        icon: Server,
        searchKey: s.name,
      };
      const raw = s as { latencyMs?: number; latency_ms?: number };
      const resolvedLatency =
        typeof s.latencyMs === "number"
          ? s.latencyMs
          : typeof raw.latency_ms === "number"
            ? raw.latency_ms
            : undefined;
      return {
        name: s.name,
        status: s.status,
        isHealthy: s.isHealthy,
        latencyMs: resolvedLatency,
        icon: meta.icon,
        searchKey: meta.searchKey,
      };
    });
  }, [healthData]);

  const metrics = [
    {
      label: "Live Active Sessions",
      value: (analytics?.liveSessions ?? 0).toLocaleString(),
      subtext: "Tracked in-memory token states",
      icon: Activity,
      accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "24h Request Volume",
      value: totalRequests.toLocaleString(),
      subtext: `${uptimeRate} success rate (${totalErrors} err)`,
      icon: Server,
      accent: "text-primary bg-primary/10 border-primary/20",
    },
    {
      label: "Security Audit Events",
      value: securityEvents.toLocaleString(),
      subtext: `${totalLogs.toLocaleString()} total logged events`,
      icon: ShieldAlert,
      accent: "text-red-500 bg-red-500/10 border-red-500/20",
    },
    {
      label: "Registered Users",
      value: (usersData?.meta?.total ?? 0).toLocaleString(),
      subtext: `${activeM2M} of ${totalM2M} active M2M clients`,
      icon: Users,
      accent: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
  ];

  if (isInitialLoading) {
    return (
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        <Card className="h-16">
          <CardContent className="h-full p-4">
            <Skeleton className="h-full w-64 bg-muted/60" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28 bg-muted/60" />
                  <Skeleton className="h-8 w-8 rounded-lg bg-muted/60" />
                </div>
                <Skeleton className="h-8 w-20 bg-muted/60" />
                <Skeleton className="h-3 w-36 bg-muted/60" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="h-36">
          <CardContent className="p-4">
            <Skeleton className="h-full w-full bg-muted/60" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="h-[380px] lg:col-span-2">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-44 bg-muted/60" />
              <Skeleton className="h-3 w-64 bg-muted/60" />
            </CardHeader>
            <CardContent className="h-[280px]">
              <Skeleton className="h-full w-full rounded-xl bg-muted/60" />
            </CardContent>
          </Card>

          <Card className="h-[380px]">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-36 bg-muted/60" />
              <Skeleton className="h-3 w-48 bg-muted/60" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full bg-muted/60" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="mx-auto w-full max-w-[1700px] space-y-6"
    >
      {/* Subsystem Health Indicator Header */}
      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border border-border/60",
          "bg-card/40 p-4 backdrop-blur-sm sm:flex-row sm:items-center",
          "sm:justify-between",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              "border",
              allServicesHealthy
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                : "border-amber-500/20 bg-amber-500/10 text-amber-500",
            )}
          >
            {allServicesHealthy ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                {allServicesHealthy
                  ? "All Core Subsystems Operational"
                  : "Core Subsystem Degradation Detected"}
              </span>
              <span className="relative flex h-2 w-2">
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping",
                    "rounded-full opacity-75",
                    allServicesHealthy ? "bg-emerald-400" : "bg-amber-400",
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex h-2 w-2 rounded-full",
                    allServicesHealthy ? "bg-emerald-500" : "bg-amber-500",
                  )}
                />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time telemetry across Gateway, Database, Cache, and Identity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span
            className={cn(
              "rounded-lg border border-border/50 bg-muted/20",
              "px-3 py-1 text-xs",
            )}
          >
            Uptime:{" "}
            <strong className="text-foreground">{uptimeRate}</strong>
          </span>
          <span
            className={cn(
              "rounded-lg border border-border/50 bg-muted/20",
              "px-3 py-1 text-xs",
            )}
          >
            24h Error Rate:{" "}
            <strong
              className={
                totalErrors > 0 ? "text-red-400" : "text-emerald-400"
              }
            >
              {errorRate}
            </strong>
          </span>
        </div>
      </div>

      {/* 4 Telemetry Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item) => (
          <Card
            key={item.label}
            className="border-border/60 bg-card/60 shadow-xs"
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    "border",
                    item.accent,
                  )}
                >
                  <item.icon size={16} />
                </div>
              </div>
              <div className="mt-3">
                <p
                  className={cn(
                    "text-2xl font-bold tracking-tight text-foreground",
                    "sm:text-3xl",
                  )}
                >
                  {item.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.subtext}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dedicated Subsystem Observability Panel */}
      <Card className="border-border/60 bg-card/60 shadow-xs">
        <CardHeader
          className={cn(
            "flex flex-col gap-2 border-b border-border/40 pb-4",
            "sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div>
            <CardTitle
              className="flex items-center gap-2 text-base font-semibold"
            >
              <Server className="h-4 w-4 text-primary" />
              Subsystem Heartbeat & Latency Monitor
            </CardTitle>
            <CardDescription className="text-xs">
              Live response ping for Database, Redis Cache, and API Gateway
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/superadmin/system-logs?level=ERROR")}
            className="h-8 gap-1.5 rounded-lg text-xs font-medium"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
            Trace Downtime in Logs
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {subsystems.map((sub) => (
              <div
                key={sub.name}
                onClick={() =>
                  navigate(
                    `/superadmin/system-logs?search=${encodeURIComponent(
                      sub.searchKey,
                    )}`,
                  )
                }
                className={cn(
                  "group flex flex-col justify-between rounded-xl border p-3",
                  "cursor-pointer transition-all duration-200",
                  "hover:border-primary/40",
                  sub.isHealthy
                    ? "border-border/60 bg-muted/10 hover:bg-muted/20"
                    : "border-red-500/30 bg-red-500/5 hover:bg-red-500/10",
                )}
                title={`Click to trace ${sub.name} in system logs`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg",
                      "border",
                      sub.isHealthy
                        ? cn(
                            "border-emerald-500/20 bg-emerald-500/10",
                            "text-emerald-500",
                          )
                        : "border-red-500/20 bg-red-500/10 text-red-500",
                    )}
                  >
                    <sub.icon className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2",
                      "py-0.5 text-[10px] font-semibold",
                      sub.isHealthy
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-red-500/10 text-red-500",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        sub.isHealthy ? "bg-emerald-500" : "bg-red-500",
                      )}
                    />
                    {sub.status}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {sub.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Ping:{" "}
                    <strong
                      className={
                        typeof sub.latencyMs === "number"
                          ? sub.latencyMs < 50
                            ? "font-mono text-foreground"
                            : "font-mono text-amber-400"
                          : "text-muted-foreground"
                      }
                    >
                      {typeof sub.latencyMs === "number"
                        ? `${sub.latencyMs.toFixed(1)}ms`
                        : "—"}
                    </strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Ingestion & Distributions Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Real-time Activity Heat (2 cols) */}
        <Card className="border-border/60 bg-card/60 shadow-xs lg:col-span-2">
          <CardHeader
            className={cn(
              "flex flex-col gap-2 border-b border-border/40 pb-4",
              "sm:flex-row sm:items-center sm:justify-between",
            )}
          >
            <div>
              <CardTitle className="text-base font-semibold">
                System Ingestion & Error Monitor
              </CardTitle>
              <CardDescription className="text-xs">
                Hourly throughput vs. runtime exceptions in the last 24 hours
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5",
                  "py-1 text-xs font-medium border-emerald-500/20",
                  "bg-emerald-500/10 text-emerald-500",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Requests
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5",
                  "py-1 text-xs font-medium border-red-500/20",
                  "bg-red-500/10 text-red-500",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Errors ({totalErrors})
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={logActivity} key={logActivity.length}>
                  <defs>
                    <linearGradient
                      id="colorRequests"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={COLOR_REQUESTS}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor={COLOR_REQUESTS}
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient
                      id="colorErrors"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={COLOR_ERRORS}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor={COLOR_ERRORS}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={CHART_GRID_STROKE}
                  />

                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: CHART_TICK_FILL }}
                    tickFormatter={(value) => {
                      if (!value) return "";
                      try {
                        const date = new Date(value.replace(" ", "T"));
                        return format(date, "h:mm a");
                      } catch {
                        return value;
                      }
                    }}
                    interval="preserveStartEnd"
                  />

                  {/* Restored visible Y-axis for real telemetry */}
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: CHART_TICK_FILL }}
                    domain={[0, "auto"]}
                    tickFormatter={(val) =>
                      val >= 1000
                        ? `${(val / 1000).toFixed(1)}k`
                        : `${val}`
                    }
                    width={35}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_TOOLTIP_BG,
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#fff", fontWeight: 600 }}
                    labelFormatter={(value) => {
                      if (!value) return "";
                      try {
                        const date = new Date(value.replace(" ", "T"));
                        return format(date, "MMM d, yyyy - h:mm a");
                      } catch {
                        return value;
                      }
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="requests"
                    name="Requests"
                    stroke={COLOR_REQUESTS}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRequests)"
                    connectNulls
                  />

                  <Area
                    type="monotone"
                    dataKey="errors"
                    name="Errors"
                    stroke={COLOR_ERRORS}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorErrors)"
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distributions Card */}
        <Card className="border-border/60 bg-card/60 shadow-xs">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">
              Access & Identity Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              User base by security role breakdown
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-3">
              {(userDistData ?? []).map((item) => {
                const percentage =
                  totalUsers > 0 ? (item.count / totalUsers) * 100 : 0;
                const roleColor =
                  ROLE_COLORS[item.roleName.toLowerCase()] ?? "#6b7280";
                return (
                  <div key={item.roleName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: roleColor }}
                        />
                        <span
                          className={cn(
                            "font-medium capitalize text-foreground",
                          )}
                        >
                          {item.roleName.toLowerCase()}s
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {item.count.toLocaleString()}
                        </span>
                        <span
                          className={cn(
                            "w-10 text-right text-muted-foreground/70",
                          )}
                        >
                          {percentage < 0.1 && percentage > 0
                            ? "<0.1%"
                            : `${percentage.toFixed(1)}%`}
                        </span>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "h-1.5 w-full overflow-hidden rounded-full",
                        "bg-muted/40",
                      )}
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                        )}
                        style={{
                          width: `${Math.max(percentage, 1)}%`,
                          backgroundColor: roleColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Traffic Trends */}
      <Card className="border-border/60 bg-card/60 shadow-xs">
        <CardHeader
          className={cn(
            "flex flex-col gap-4 border-b border-border/40 pb-4",
            "sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div>
            <CardTitle
              className="flex items-center gap-2 text-base font-semibold"
            >
              <TrendingUp className="h-4 w-4 text-primary" />
              Traffic & Authentication Trends
            </CardTitle>
            <CardDescription className="text-xs">
              Aggregated logins vs. operational system activity
            </CardDescription>
          </div>
          <div
            className={cn(
              "grid w-full grid-cols-4 items-center gap-1 rounded-xl",
              "border border-border/50 bg-muted/20 p-1 sm:flex sm:w-auto",
            )}
          >
            {(["daily", "weekly", "monthly", "yearly"] as const).map((r) => (
              <Button
                key={r}
                variant="ghost"
                size="sm"
                onClick={() => setRange(r)}
                className={cn(
                  "h-8 rounded-lg px-3 text-xs font-medium capitalize",
                  "transition-all duration-200",
                  range === r
                    ? cn(
                        "bg-secondary text-secondary-foreground",
                        "shadow-xs font-semibold",
                      )
                    : "text-muted-foreground hover:bg-muted/40",
                )}
              >
                {r}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="relative h-[290px] w-full">
            {analyticsFetching && (
              <div
                className={cn(
                  "absolute inset-0 z-10 flex items-center justify-center",
                  "rounded-xl bg-background/50 backdrop-blur-[2px]",
                )}
              >
                <div
                  className={cn(
                    "h-7 w-7 animate-spin rounded-full border-2",
                    "border-primary border-t-transparent",
                  )}
                />
              </div>
            )}
            {visitorData.length === 0 && !analyticsFetching ? (
              <div
                className={cn(
                  "flex h-full flex-col items-center justify-center",
                  "text-center",
                )}
              >
                <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-medium text-foreground">
                  No Traffic Recorded
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  No login events captured for the selected {range} timeframe.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={visitorData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={CHART_GRID_STROKE}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: CHART_TICK_FILL }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: CHART_TICK_FILL }}
                    domain={[0, "auto"]}
                    tickFormatter={(val) =>
                      val >= 1000
                        ? `${(val / 1000).toFixed(1)}k`
                        : `${val}`
                    }
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: CHART_TOOLTIP_BG,
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#fff", fontWeight: 600 }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={32}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="logins"
                    name="Logins"
                    stroke={COLOR_SYSTEM_LOGINS}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: COLOR_SYSTEM_LOGINS,
                      strokeWidth: 0,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activity"
                    name="System Events"
                    stroke={COLOR_SYSTEM_ACTIVITY}
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={false}
                    activeDot={{
                      r: 5,
                      fill: COLOR_SYSTEM_ACTIVITY,
                      strokeWidth: 0,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

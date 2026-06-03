import { useMemo, useState } from "react";
import {
  TrendingUp,
  Users,
  ArrowUpRight,
  BarChart,
  Activity,
  Fingerprint,
  ShieldAlert,
  Server,
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
  PieChart,
  Area,
  Cell,
  Pie,
} from "recharts";
import { usePageMetadata } from "@/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminAnalytics,
  useUsers,
  useM2MClients,
  useLogStats,
  useUserDistribution,
  useLogActivity,
} from "@/features/system-admin/hooks";
import { cn } from "@/lib/utils";

export default function AnalyticsOverview() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly" | "yearly">(
    "daily",
  );

  const { data: analytics, isLoading: analyticsLoading } =
    useAdminAnalytics(range);
  const { data: usersData, isLoading: usersLoading } = useUsers({
    page_size: 1,
  });
  const { data: m2mClientsData, isLoading: m2mLoading } = useM2MClients();
  const { data: logStatsData, isLoading: statsLoading } = useLogStats();
  const { data: userDistData, isLoading: distLoading } = useUserDistribution();
  const { data: logActivityData, isLoading: activityLoading } =
    useLogActivity();

  const isLoading =
    analyticsLoading ||
    usersLoading ||
    m2mLoading ||
    statsLoading ||
    distLoading ||
    activityLoading;

  usePageMetadata(
    useMemo(
      () => ({
        title: "System Analytics",
        badgeText: "System Intelligence",
        badgeIcon: <BarChart className="h-3 w-3" />,
        description:
          "Deep dive into system growth, visitor trends, " +
          "and administrative overhead.",
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

  const getCategoryColor = (category: string) => {
    switch (category.toUpperCase()) {
      case "SECURITY":
        return "bg-red-500";
      case "SYSTEM":
        return "bg-amber-500";
      default:
        return "bg-primary";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "superadmin":
        return "#6366f1";
      case "admin":
      case "counselor":
        return "#3b82f6";
      case "developer":
        return "#10b981";
      case "student":
        return "hsl(var(--primary))";
      default:
        return "#6b7280";
    }
  };

  const metrics = [
    {
      label: "Total Registered Users",
      value: usersData?.meta?.total ?? 0,
      icon: Users,
      color: "primary",
    },
    {
      label: "Active M2M Clients",
      value: `${activeM2M} / ${totalM2M}`,
      icon: Fingerprint,
      color: "secondary",
    },
    {
      label: "Total System Logs",
      value: totalLogs.toLocaleString(),
      icon: Server,
      color: "primary",
    },
    {
      label: "Security Alerts",
      value: securityEvents.toLocaleString(),
      icon: ShieldAlert,
      color: "secondary",
    },
    {
      label: "Active Redis Sessions",
      value: analytics?.liveSessions ?? 0,
      icon: Activity,
      color: "primary",
    },
  ];

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        {/* Metrics Grid Skeleton */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-10 w-10 rounded-2xl bg-muted/60" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24 bg-muted/60" />
                  <Skeleton className="h-8 w-16 bg-muted/60" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Big Chart Skeleton */}
        <Card className="min-h-[450px]">
          <CardHeader className="pb-8">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48 bg-muted/60" />
              <Skeleton className="h-9 w-64 rounded-xl bg-muted/60" />
            </div>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[320px]">
            <Skeleton className="h-full w-full rounded-xl bg-muted/60" />
          </CardContent>
        </Card>

        {/* Bottom Rows Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 min-h-[420px]">
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-36 bg-muted/60" />
              <Skeleton className="h-4 w-48 bg-muted/60" />
            </CardHeader>
            <CardContent className="h-80">
              <Skeleton className="h-full w-full rounded-xl bg-muted/60" />
            </CardContent>
          </Card>

          <Card className="min-h-[420px]">
            <CardHeader>
              <Skeleton className="h-6 w-40 bg-muted/60" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-32 bg-muted/60" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-12 w-full rounded-xl bg-muted/60"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-6">
      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metrics.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div
                  className={
                    "rounded-2xl p-3 " +
                    (item.color === "primary"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary/10 text-secondary")
                  }
                >
                  <item.icon size={20} />
                </div>
              </div>
              <div className="mt-4">
                <p
                  className={
                    "text-xs font-bold uppercase " + "text-muted-foreground"
                  }
                >
                  {item.label}
                </p>
                <p className="mt-1 text-4xl font-bold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Traffic Trends Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-1 min-h-[450px] lg:col-span-3">
          <CardHeader
            className={"flex flex-row items-center justify-between pb-8"}
          >
            <CardTitle className="flex items-center gap-4 text-2xl font-bold">
              <TrendingUp
                size={24}
                className="text-primary"
              />
              System Traffic & Logins
              <div
                className={
                  "backdrop-blur-l flex items-center gap-1 rounded-2xl " +
                  "ml-10 p-1.5"
                }
              >
                {(["daily", "weekly", "monthly", "yearly"] as const).map(
                  (r) => (
                    <Button
                      key={r}
                      variant="ghost"
                      size="sm"
                      onClick={() => setRange(r)}
                      className={cn(
                        "h-9 rounded-xl px-6 font-medium capitalize transition-all duration-300",
                        range === r
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      {r}
                    </Button>
                  ),
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart data={visitorData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#888888" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#888888" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      backdropFilter: "blur(16px)",
                      borderRadius: "20px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={36}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="logins"
                    name="System Logins"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    dot={{
                      r: 6,
                      fill: "hsl(var(--primary))",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="activity"
                    name="System Activity"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={4}
                    strokeDasharray="8 8"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Requests and Distribution Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* System Activity Chart */}
        <Card className="col-span-1 min-h-[420px] lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                System Activity Heat
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Traffic and errors in the last 24 hours
              </p>
            </div>
            <div className="flex gap-2">
              <div
                className={
                  "rounded-md border px-2 py-0.5 text-xs font-semibold " +
                  "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                }
              >
                Requests
              </div>
              <div
                className={
                  "rounded-md border px-2 py-0.5 text-xs font-semibold " +
                  "border-red-500/20 bg-red-500/10 text-red-500"
                }
              >
                Errors
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={logActivity}
                  key={logActivity.length}
                >
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
                        stopColor="#059669"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#059669"
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
                        stopColor="#dc2626"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#dc2626"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(255,255,255,0.05)"
                  />

                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#888888" }}
                    interval={0}
                  />

                  {/* Set concrete baseline constraints */}
                  <YAxis
                    hide
                    domain={[0, "auto"]}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "16px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#059669"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRequests)"
                    connectNulls
                  />

                  <Area
                    type="monotone"
                    dataKey="errors"
                    stroke="#dc2626"
                    strokeWidth={3}
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
        <Card className="col-span-1 min-h-[420px]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              System Distributions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">
              User Roles Breakdown
            </h4>
            <div className="space-y-2">
              {(userDistData ?? []).map((item) => {
                const percentage =
                  totalUsers > 0 ? (item.count / totalUsers) * 100 : 0;
                return (
                  <div
                    key={item.roleName}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {/* Legend Color Indicator */}
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getRoleColor(item.roleName) }}
                      />
                      <span className="capitalize text-muted-foreground">
                        {item.roleName.toLowerCase()}s
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-medium">
                      <span>{item.count.toLocaleString()}</span>
                      <span className="w-12 text-right text-xs text-muted-foreground/60">
                        {percentage < 0.1 && percentage > 0
                          ? "< 0.1%"
                          : `${percentage.toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

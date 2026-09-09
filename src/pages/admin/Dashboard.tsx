import { useState, useMemo, useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  FileText,
  Sparkles,
  AlertTriangle,
  X,
  ChevronRight,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Ticket,
  Eye,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import {
  useAppointments,
} from "@/features/appointments/hooks/useAppointments";
import { useAdminDashboard } from "@/features/analytics/hooks";
import {
  GetAcademicSettings,
} from "@/features/student-core/services/academicSettingsService";
import { useGetSlipStats } from "@/features/slips/hooks/useSlips";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";
import { getProfilePictureUrl } from "@/lib/profilePicture";
import { toISODateString, format12HourTime } from "@/utils";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";

const visitorConfig = {
  visitors: {
    label: "Visitors",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const TIP_QUOTES = [
  "Data-driven guidance is effective; review student notes before sessions.",
  "A brief check before consultations fosters calmer, grounded discussions.",
  "Regular follow-ups turn single appointments into lasting guidance.",
  "Clear record keeping makes future counseling faster and more accurate.",
  "Timely updates to case notes help build reliable student histories.",
  "Prepared counselors create confident and reassuring spaces for students.",
];

export default function Dashboard() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toISODateString(today), [today]);
  const gradientId = useId();

  const formattedToday = useMemo(
    () =>
      today.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    [today],
  );

  const { data: settings } = useQuery({
    queryKey: ["counselor", "academicSettings"],
    queryFn: GetAcademicSettings,
    staleTime: 1000 * 60 * 5,
  });

  const isSettingsOutdated = useMemo(() => {
    if (!settings) return false;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    if (settings.currentYearEnd < currentYear) return true;
    if (currentMonth >= 8 && settings.currentYearStart < currentYear) {
      return true;
    }
    return false;
  }, [settings]);

  const { data: appointmentData, isLoading: isAppointmentsLoading } =
    useAppointments({
      params: {
        startDate: todayStr,
        endDate: todayStr,
      },
    });

  const appointments = appointmentData?.appointments || [];

  const sortedAppointments = useMemo(() => {
    return [...appointments]
      .slice(0, 6)
      .sort((a, b) =>
        (a.timeSlot?.time || "").localeCompare(b.timeSlot?.time || ""),
      );
  }, [appointments]);

  const { data: slipStats, isLoading: isSlipsLoading } = useGetSlipStats();
  const { data: adminAnalytics, isLoading: isAnalyticsLoading } =
    useAdminDashboard();

  const [showDailyTip, setShowDailyTip] = useState(false);

  const dailyTip = useMemo(() => {
    const dayIndex = today.getDate() % TIP_QUOTES.length;
    return TIP_QUOTES[dayIndex];
  }, [today]);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const lastShownDate = localStorage.getItem("dashboard-tip-date");

    if (lastShownDate !== todayKey) {
      setShowDailyTip(true);
      localStorage.setItem("dashboard-tip-date", todayKey);
    }
  }, []);

  const pendingSlips = useMemo(() => {
    return (
      slipStats?.find((s: any) => s.name?.toLowerCase() === "pending")?.count ||
      0
    );
  }, [slipStats]);

  const approvedSlips = useMemo(() => {
    return (
      slipStats?.find((s: any) => s.name?.toLowerCase() === "approved")
        ?.count || 0
    );
  }, [slipStats]);

  const visitorData = useMemo(() => {
    return (
      adminAnalytics?.monthlyVisitors?.map(
        (v: { month: string; count: number }) => ({
          name: v.month,
          visitors: v.count,
        }),
      ) || []
    );
  }, [adminAnalytics]);

  const kpis = useMemo(
    () => [
      {
        title: "Total Students",
        value: adminAnalytics?.totalStudents ?? 0,
        trend: adminAnalytics?.studentsTrend,
        icon: Users,
        iconStyle: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      },
      {
        title: "Significant Notes",
        value: adminAnalytics?.totalReports ?? 0,
        trend: adminAnalytics?.reportsTrend,
        icon: FileText,
        iconStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      },
      {
        title: "Consultations",
        value: adminAnalytics?.totalAppointments ?? 0,
        trend: adminAnalytics?.appointmentsTrend,
        icon: Calendar,
        iconStyle: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      },
      {
        title: "Admission Slips",
        value: adminAnalytics?.totalSlips ?? 0,
        trend: adminAnalytics?.slipsTrend,
        icon: Ticket,
        iconStyle: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
    ],
    [adminAnalytics],
  );

  const getUserInitials = (user?: {
    firstName?: string;
    lastName?: string;
  }) => {
    const firstInitial = user?.firstName?.trim()?.[0] || "";
    const lastInitial = user?.lastName?.trim()?.[0] || "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "ST";
  };

  const getUserFullName = (user?: {
    firstName?: string;
    lastName?: string;
  }) => {
    return (
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Student"
    );
  };

  usePageMetadata({
    title: "Guidance Dashboard",
    description:
      "Polytechnic University of the Philippines – Guidance Services",
    badgeText: "Admin Overview",
    badgeIcon: <Sparkles className="h-3.5 w-3.5" />,
    showDate: true,
    isLoading: false,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "mx-auto flex w-full flex-col space-y-6 pb-12",
        "px-4 sm:px-6 md:px-8",
      )}
    >
      {/* Outdated Academic Settings Warning */}
      {isSettingsOutdated && (
        <div
          className={cn(
            "flex flex-col gap-4 rounded-2xl border border-destructive/30",
            "bg-destructive/10 p-4 backdrop-blur-md transition-all sm:flex-row",
            "sm:items-center sm:justify-between sm:p-5",
          )}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                "rounded-xl bg-destructive p-2.5 text-destructive-foreground",
                "shrink-0 shadow-sm",
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-destructive">
                Academic Year Out of Date
              </h4>
              <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">
                The current active term ({settings?.currentYearStart}–
                {settings?.currentYearEnd}) needs review. Update the school year
                configuration to maintain valid records.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => navigate("/admin/academic-settings")}
            className="shadow-xs h-9 shrink-0 rounded-xl px-4 font-semibold"
          >
            Configure Settings
          </Button>
        </div>
      )}

      {/* Daily Counseling Insight */}
      <AnimatePresence>
        {showDailyTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "relative flex items-center justify-between overflow-hidden",
              "rounded-2xl border border-glass-border bg-card/60 p-4",
              "shadow-xs backdrop-blur-xl sm:p-5",
            )}
          >
            <div className="flex items-center gap-3.5 pr-8">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center",
                  "rounded-xl border border-glass-border bg-primary/10",
                  "shadow-xs text-primary",
                )}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    "text-muted-foreground",
                  )}
                >
                  Daily Counseling Insight
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-xs font-medium italic text-foreground/90",
                    "sm:text-sm",
                  )}
                >
                  &ldquo;{dailyTip}&rdquo;
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDailyTip(false)}
              className={cn(
                "h-7 w-7 shrink-0 rounded-lg text-muted-foreground",
                "hover:bg-muted/60 hover:text-foreground",
              )}
              aria-label="Dismiss daily insight"
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4-Card KPI Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isAnalyticsLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className={cn(
                  "rounded-2xl border border-glass-border bg-card/50",
                  "shadow-xs p-5 backdrop-blur-xl",
                )}
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-7 w-16 rounded-md" />
                  <Skeleton className="h-3 w-28 rounded-md" />
                </div>
              </Card>
            ))
          : kpis.map((kpi, index) => {
              const Icon = kpi.icon;
              const hasTrend = typeof kpi.trend === "number";

              return (
                <Card
                  key={index}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border",
                    "shadow-xs border-glass-border bg-card/60 p-5",
                    "backdrop-blur-xl transition-all duration-300",
                    "hover:-translate-y-0.5 hover:shadow-md",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-semibold text-muted-foreground",
                      )}
                    >
                      {kpi.title}
                    </span>
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-xl",
                        "shadow-xs border border-glass-border",
                        kpi.iconStyle,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3
                      className={cn(
                        "text-2xl font-bold tracking-tight text-foreground",
                      )}
                    >
                      {kpi.value.toLocaleString()}
                    </h3>

                    <div className="mt-1 flex items-center gap-1.5 text-xs">
                      {hasTrend ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 rounded-md",
                            "px-1.5 py-0.5 text-[10px] font-bold",
                            kpi.trend! >= 0
                              ? "bg-emerald-500/10 text-emerald-600 " +
                                  "dark:text-emerald-400"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          <TrendingUp className="h-2.5 w-2.5" />
                          {kpi.trend! >= 0 ? `+${kpi.trend}` : kpi.trend}
                        </span>
                      ) : null}
                      <span className="text-[11px] text-muted-foreground">
                        Recorded total
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Main Workspace (12-Column Split) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Today's Appointments (8 Cols) */}
        <Card
          className={cn(
            "flex flex-col overflow-hidden rounded-2xl border",
            "shadow-xs border-glass-border bg-card/60 backdrop-blur-xl",
            "lg:col-span-8",
          )}
        >
          <CardHeader
            className={cn(
              "flex flex-row items-center justify-between border-b",
              "border-glass-border bg-muted/20 px-6 py-4",
            )}
          >
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-foreground">
                  Today&apos;s Appointments
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg border-primary/20 bg-primary/10 px-2",
                    "py-0.5 text-[10px] font-bold text-primary",
                  )}
                >
                  {formattedToday}
                </Badge>
              </div>
              <CardDescription className="mt-0.5 text-xs text-muted-foreground">
                Upcoming consultations queued for counseling today
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/appointments")}
              className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold"
            >
              <span>View All</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            {isAppointmentsLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center justify-between rounded-xl border",
                      "border-glass-border bg-muted/20 p-3",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28 rounded-md" />
                        <Skeleton className="h-3 w-20 rounded-md" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : sortedAppointments.length === 0 ? (
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-12",
                  "text-center",
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl",
                    "border border-glass-border bg-muted/40",
                    "text-muted-foreground shadow-inner",
                  )}
                >
                  <Calendar className="h-6 w-6 text-primary/70" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-foreground">
                  No appointments scheduled for today
                </h4>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Your counseling agenda is clear today. View the master
                  calendar to review upcoming dates or manage bookings.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/appointments")}
                  className="mt-4 h-8 gap-1.5 rounded-xl px-3 text-xs"
                >
                  Open Appointments Calendar
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-glass-border">
                {sortedAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => navigate(`/admin/appointments/${apt.id}`)}
                    className={cn(
                      "group flex flex-col gap-3 p-4 transition-colors",
                      "cursor-pointer hover:bg-muted/30 sm:flex-row",
                      "sm:items-center sm:justify-between sm:px-6",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        className={cn(
                          "h-9 w-9 shrink-0 rounded-full",
                          "border border-glass-border",
                        )}
                      >
                        <AvatarImage
                          src={getProfilePictureUrl(apt.user?.profilePicture)}
                          alt={getUserFullName(apt.user)}
                          className="object-cover"
                        />
                        <AvatarFallback
                          className={cn(
                            "rounded-full bg-primary/10 text-xs font-bold",
                            "text-primary",
                          )}
                        >
                          {getUserInitials(apt.user)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold text-foreground",
                            "transition-colors group-hover:text-primary",
                          )}
                        >
                          {getUserFullName(apt.user)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {apt.user?.studentNumber || "No Student ID"}
                          {" \u2022 "}
                          <span className="font-medium text-foreground/75">
                            {apt.appointmentCategory?.name}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "flex items-center justify-between gap-3",
                        "sm:justify-end",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[10px]",
                            "font-bold uppercase tracking-wider",
                            STATUS_COLORS[getStatusColorKey(apt.status?.name)],
                          )}
                        >
                          {apt.status?.name || "Pending"}
                        </Badge>

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-lg",
                            "border border-border/60 bg-muted/40 px-2.5 py-1",
                            "text-xs font-semibold text-foreground",
                          )}
                        >
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {format12HourTime(apt.timeSlot?.time || "")}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center",
                          "rounded-lg text-muted-foreground/60",
                          "transition-colors group-hover:bg-primary/10",
                          "group-hover:text-primary",
                        )}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Slips & Visitors (4 Cols) */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Slip Tracker */}
          <Card
            className={cn(
              "overflow-hidden rounded-2xl border border-glass-border",
              "shadow-xs bg-card/60 backdrop-blur-xl",
            )}
          >
            <CardHeader
              className={cn(
                "flex flex-row items-center justify-between border-b",
                "border-glass-border bg-muted/20 px-5 py-3.5",
              )}
            >
              <CardTitle className="text-sm font-bold text-foreground">
                Admission Slip Queue
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/slips")}
                className="h-7 px-2 text-xs font-semibold text-primary"
              >
                Manage
              </Button>
            </CardHeader>

            <CardContent className="p-5">
              {isSlipsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-20 rounded-xl" />
                  <Skeleton className="h-20 rounded-xl" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={cn(
                      "flex flex-col justify-between rounded-xl border",
                      "border-warning-foreground/30 p-3.5",
                      "bg-warning-background text-warning-foreground",
                      "shadow-xs",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-[11px] font-bold uppercase tracking-wider",
                        )}
                      >
                        Pending
                      </span>
                      <Clock className="h-4 w-4" />
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                      {pendingSlips.toLocaleString()}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "flex flex-col justify-between rounded-xl border",
                      "border-success-foreground/30 p-3.5",
                      "bg-success-background text-success-foreground",
                      "shadow-xs",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-[11px] font-bold uppercase tracking-wider",
                        )}
                      >
                        Approved
                      </span>
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="mt-2 text-2xl font-bold">
                      {approvedSlips.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => navigate("/admin/slips")}
                className={cn(
                  "mt-4 h-10 w-full gap-2 rounded-xl bg-primary",
                  "font-semibold text-primary-foreground shadow-sm",
                  "hover:bg-primary/90",
                )}
              >
                <Eye className="h-4 w-4" />
                Review Slips Queue
              </Button>
            </CardContent>
          </Card>

          {/* Monthly Visitors Activity */}
          <Card
            className={cn(
              "overflow-hidden rounded-2xl border border-glass-border",
              "shadow-xs bg-card/60 backdrop-blur-xl",
            )}
          >
            <CardHeader
              className={cn(
                "border-b border-glass-border bg-muted/20 px-5 py-3.5",
              )}
            >
              <CardTitle className="text-sm font-bold text-foreground">
                Monthly Activity Trend
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Visitor touchpoints across recent months
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5">
              <div className="h-44 w-full">
                {isAnalyticsLoading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : visitorData.length > 0 ? (
                  <ChartContainer
                    config={visitorConfig}
                    className="aspect-auto h-full w-full"
                  >
                    <AreaChart
                      data={visitorData}
                      margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id={gradientId}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--color-visitors)"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--color-visitors)"
                            stopOpacity={0.0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fill: "hsl(var(--muted-foreground))",
                        }}
                        dy={6}
                      />
                      <YAxis hide={true} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="var(--color-visitors)"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill={`url(#${gradientId})`}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <div
                    className={cn(
                      "flex h-full flex-col items-center justify-center",
                      "text-center text-xs text-muted-foreground",
                    )}
                  >
                    No visitor records available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

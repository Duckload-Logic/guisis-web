import {
  Calendar,
  Users,
  FileText,
  MoreHorizontal,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useAdminDashboard } from "@/features/analytics/hooks";
import { useQuery } from "@tanstack/react-query";
import { GetAcademicSettings } from "@/features/student-core/services/academicSettingsService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { usePageMetadata } from "@/context";
import { DashboardMetrics } from "@/features/counseling/components/DashboardMetrics";
import { SlipStatusTracker } from "@/features/counseling/components/SlipStatusTracker";
import {
  useGetSlipStats,
  useGetUrgentSlips,
} from "@/features/slips/hooks/useSlips";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toISODateString, format12HourTime } from "@/utils";

export default function Dashboard() {
  const navigate = useNavigate();
  const todayStr = toISODateString(new Date());

  const { data: settings } = useQuery({
    queryKey: ["counselor", "academicSettings"],
    queryFn: GetAcademicSettings,
    staleTime: 1000 * 60 * 5,
  });

  const isSettingsOutdated = useMemo(() => {
    if (!settings) return false;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    if (settings.currentYearEnd < currentYear) {
      return true;
    }
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
  const [showDailyTip, setShowDailyTip] = useState(false);

  const { data: slipStats, isLoading: isSlipsLoading } = useGetSlipStats();
  const { data: urgentSlips } = useGetUrgentSlips({ pageSize: 1 });
  const { data: adminAnalytics, isLoading: isAnalyticsLoading } =
    useAdminDashboard();

  const tipQuotes = useMemo(
    () => [
      "Data-driven guidance is effective; check student records before each session.",
      "A short review before every session helps you guide with more confidence.",
      "Consistent follow-up turns one-time visits into meaningful student support.",
      "Clear records make every counseling session faster, smoother, and more effective.",
      "Small notes today can become valuable guidance insights tomorrow.",
      "Prepared counselors create calmer, more productive student conversations.",
    ],
    [],
  );

  const dailyTip = useMemo(() => {
    const dayIndex = new Date().getDate() % tipQuotes.length;
    return tipQuotes[dayIndex];
  }, [tipQuotes]);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const lastShownDate = localStorage.getItem("dashboard-tip-date");

    if (lastShownDate !== todayKey) {
      setShowDailyTip(true);
      localStorage.setItem("dashboard-tip-date", todayKey);
    }
  }, []);

  const metrics = [
    {
      title: "Students",
      value: adminAnalytics?.totalStudents?.toString() || "0",
      trend: `+${adminAnalytics?.studentsTrend?.toString() || "0"}`,
      icon: Users,
      iconColor: "text-blue-500",
    },
    {
      title: "Significant Notes",
      value: adminAnalytics?.totalReports?.toString() || "0",
      trend: `+${adminAnalytics?.reportsTrend?.toString() || "0"}`,
      icon: FileText,
      iconColor: "text-emerald-500",
    },
    {
      title: "Consultations",
      value: adminAnalytics?.totalAppointments?.toString() || "0",
      trend: `+${adminAnalytics?.appointmentsTrend?.toString() || "0"}`,
      icon: Calendar,
      iconColor: "text-purple-500",
    },
    {
      title: "Slips",
      value: adminAnalytics?.totalSlips?.toString() || "0",
      trend: `+${adminAnalytics?.slipsTrend?.toString() || "0"}`,
      icon: FileText,
      iconColor: "text-amber-500",
    },
  ];

  const visitorData =
    adminAnalytics?.monthlyVisitors?.map(
      (v: { month: string; count: number }) => ({
        name: v.month,
        visitors: v.count,
      }),
    ) || [];

  const visitorConfig = {
    visitors: {
      label: "Visitors",
      color: "#00A18E",
    },
  } satisfies ChartConfig;

  usePageMetadata({
    title: "Guidance Dashboard",
    description:
      "Polytechnic University of the Philippines – Guidance Services Information System",
    badgeText: "Admin Overview",
    badgeIcon: <Sparkles className="h-3.5 w-3.5" />,
    showDate: true,
    isLoading: isAppointmentsLoading,
  });

  if (isAppointmentsLoading || isSlipsLoading || isAnalyticsLoading) {
    return null;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Outdated Academic Settings Warning */}
      {isSettingsOutdated && (
        <div
          className={cn(
            "animate-in fade-in slide-in-from-top-4 relative",
            "overflow-hidden rounded-3xl border border-red-500/20",
            "bg-gradient-to-r from-red-500/10 to-rose-500/10 p-6",
            "backdrop-blur-md duration-700",
          )}
        >
          <div className="flex items-start gap-5">
            <div
              className={cn(
                "rounded-2xl bg-red-500 p-3 text-white shadow-lg",
                "shadow-red-500/20",
              )}
            >
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1 pr-10">
              <h4
                className={cn(
                  "mb-1 flex items-center gap-2 text-sm font-bold",
                  "text-red-950 dark:text-red-100",
                )}
              >
                Academic Year Out of Date
              </h4>
              <p
                className={cn(
                  "text-sm font-medium leading-relaxed",
                  "text-red-900/80 dark:text-red-200/80",
                )}
              >
                The active academic year ({settings?.currentYearStart}–
                {settings?.currentYearEnd}) appears to be outdated. Please
                update the active term and school year configuration.
              </p>
              <button
                onClick={() => navigate("/admin/academic-settings")}
                className={cn(
                  "mt-3 rounded-xl bg-red-500 px-4 py-2 text-xs font-bold",
                  "text-white transition-all hover:bg-red-600",
                  "active:scale-[.98]",
                )}
              >
                Configure Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Tip Alert */}
      {showDailyTip && (
        <div
          className={cn(
            "animate-in fade-in slide-in-from-top-4 group relative",
            "overflow-hidden rounded-3xl border border-teal-500/20",
            "bg-gradient-to-r from-teal-500/10 to-emerald-500/10 p-6",
            "backdrop-blur-md duration-700",
          )}
        >
          <div className="flex items-start gap-5">
            <div className="rounded-2xl bg-teal-500 p-3 text-white shadow-lg shadow-teal-500/20">
              <Sparkles size={24} />
            </div>
            <div className="flex-1 pr-10">
              <h4 className="mb-1 flex items-center gap-2 text-sm font-bold text-teal-900 dark:text-teal-100">
                Daily Counseling Insight
              </h4>
              <p className="text-sm font-medium leading-relaxed text-teal-800/80 dark:text-teal-200/80">
                "{dailyTip}"
              </p>
            </div>
            <button
              onClick={() => setShowDailyTip(false)}
              className={cn(
                "absolute right-4 top-4 rounded-xl p-2 text-teal-900/40",
                "opacity-0 transition-all hover:bg-teal-500/10",
                "hover:text-teal-900 group-hover:opacity-100",
                "dark:text-teal-100/40 dark:hover:text-teal-100",
              )}
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-teal-500/5 blur-2xl" />
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <DashboardMetrics metrics={metrics} />
        {/* Monthly Visitors Analytics */}
        <Card className="overflow-hidden shadow-md backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-bold">
              Monthly Visitors
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-4">
            <div className="h-48 w-full">
              <ChartContainer
                config={visitorConfig}
                className="aspect-auto h-full w-full"
              >
                <LineChart data={visitorData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                    opacity={0.5}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 10,
                      fill: "hsl(var(--muted-foreground))",
                    }}
                    dy={10}
                  />
                  <YAxis hide={true} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    isAnimationActive={false}
                    type="monotone"
                    dataKey="visitors"
                    stroke="var(--color-visitors)"
                    strokeWidth={3}
                    dot={{
                      fill: "var(--color-visitors)",
                      strokeWidth: 2,
                      r: 4,
                      stroke: "hsl(var(--background))",
                    }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-8 xl:flex-row">
        {/* Main Content: Upcoming Appointments */}
        <div className="flex-1 space-y-8">
          <Card className="overflow-hidden shadow-md backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">
                Upcoming Appointments
              </CardTitle>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal size={20} />
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead
                    className={cn(
                      "bg-slate-50/50 text-[10px] font-bold uppercase",
                      "tracking-widest text-slate-400 dark:bg-black/20",
                    )}
                  >
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {appointments
                      .slice(0, 5)
                      .sort((a, b) =>
                        a.timeSlot.time.localeCompare(b.timeSlot.time),
                      )
                      .map((apt) => (
                        <tr
                          key={apt.id}
                          className="group cursor-pointer bg-glass-bg transition-colors"
                          onClick={() =>
                            navigate(`/admin/appointments/${apt.id}`)
                          }
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8 rounded-lg">
                                <AvatarImage src={apt.user?.profilePicture} />
                                <AvatarFallback className="rounded-lg bg-primary/10 text-[10px] font-bold uppercase text-primary">
                                  {apt.user?.firstName?.[0]}
                                  {apt.user?.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                  {apt.user?.firstName} {apt.user?.lastName}
                                </p>
                                <p className="whitespace-nowrap text-[10px] font-medium text-slate-400">
                                  {apt.user?.studentNumber}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-500">
                            {apt.appointmentCategory.name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-500">
                            {new Date(apt.whenDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                            {format12HourTime(apt.timeSlot.time)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {appointments.length === 0 && (
                  <div className="py-10 text-center text-sm italic text-slate-400">
                    No upcoming appointments for today
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Slips & Analytics */}
        <div className="w-full space-y-8 xl:w-96">
          {/* Slip Status Tracker */}
          <SlipStatusTracker
            stats={{
              pending:
                slipStats?.find(
                  (slip: any) => slip.name.toLowerCase() === "pending",
                )?.count || 0,
              approvedToday:
                slipStats?.find(
                  (slip: any) => slip.name.toLowerCase() === "approved",
                )?.count || 0,
              rejectedToday:
                slipStats?.find(
                  (slip: any) => slip.name.toLowerCase() === "rejected",
                )?.count || 0,
              urgentRequests: urgentSlips?.meta?.total || 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}

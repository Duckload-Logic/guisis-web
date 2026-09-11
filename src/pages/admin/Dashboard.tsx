import { useMemo, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  FileText,
  Sparkles,
  Ticket,
} from "lucide-react";

import { useAppointments } from "@/features/appointments/hooks/useAppointments";
import { useAdminDashboard } from "@/features/analytics/hooks";
import {
  GetAcademicSettings,
} from "@/features/student-core/services/academicSettingsService";
import { useGetSlipStats } from "@/features/slips/hooks/useSlips";
import { usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";
import { toISODateString } from "@/utils";

import { AcademicAlert } from "./dashboard/components/AcademicAlert";
import { DailyTipBanner } from "./dashboard/components/DailyTipBanner";
import { DashboardKpiGrid } from "./dashboard/components/DashboardKpiGrid";
import {
  TodayAppointmentsCard,
} from "./dashboard/components/TodayAppointmentsCard";
import { SlipsSummaryCard } from "./dashboard/components/SlipsSummaryCard";
import {
  MonthlyActivityChart,
} from "./dashboard/components/MonthlyActivityChart";

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

  const pendingSlips = useMemo(() => {
    return (
      slipStats?.find(
        (s: { name?: string; count?: number }) =>
          s.name?.toLowerCase() === "pending",
      )?.count || 0
    );
  }, [slipStats]);

  const approvedSlips = useMemo(() => {
    return (
      slipStats?.find(
        (s: { name?: string; count?: number }) =>
          s.name?.toLowerCase() === "approved",
      )?.count || 0
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
      <AcademicAlert
        isOutdated={isSettingsOutdated}
        currentYearStart={settings?.currentYearStart}
        currentYearEnd={settings?.currentYearEnd}
        onConfigure={() => navigate("/admin/academic-settings")}
      />

      <DailyTipBanner />

      <DashboardKpiGrid isLoading={isAnalyticsLoading} kpis={kpis} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <TodayAppointmentsCard
          isLoading={isAppointmentsLoading}
          appointments={sortedAppointments}
          formattedToday={formattedToday}
          onViewAll={() => navigate("/admin/appointments")}
          onSelectAppointment={(id) => navigate(`/admin/appointments/${id}`)}
        />

        <div className="flex flex-col gap-6 lg:col-span-4">
          <SlipsSummaryCard
            isLoading={isSlipsLoading}
            pendingCount={pendingSlips}
            approvedCount={approvedSlips}
            onManage={() => navigate("/admin/slips")}
          />

          <MonthlyActivityChart
            isLoading={isAnalyticsLoading}
            data={visitorData}
            gradientId={gradientId}
          />
        </div>
      </div>
    </motion.div>
  );
}

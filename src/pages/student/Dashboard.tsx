import { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  LayoutDashboard,
} from "lucide-react";

import { AnimationStyles } from "@/components/ui/animations";
import { usePageMetadata } from "@/context";
import { useAppointmentsStats } from "@/features/appointments/hooks/useAppointments";
import { useUserIIR } from "@/features/iir/hooks";
import { useGetSlipStats } from "@/features/slips/hooks";
import { useMe } from "@/features/users/hooks/useMe";
import { cn } from "@/lib/utils";

import { HeaderStats } from "./dashboard/HeaderStats";
import { QuickActionsSection } from "./dashboard/QuickActionsSection";
import { RemindersCard } from "./dashboard/RemindersCard";
import { ServicesOfferedSection } from "./dashboard/ServicesOfferedSection";
import { StatusSummaryCards } from "./dashboard/StatusSummaryCards";
import {
  guidanceServices,
  studentQuickActions,
  studentReminders,
} from "./dashboard/dashboardData";
import type { StudentStatCard } from "./dashboard/types";

export default function Dashboard() {
  const { data: me, isLoading: isUserLoading } = useMe({});
  const { data: iir, isLoading: isIIRLoading } = useUserIIR(
    me?.id || undefined,
  );
  const { data: slipStats } = useGetSlipStats({ params: { scope: "me" } });
  const { data: appointmentStats } = useAppointmentsStats({
    params: { scope: "me" },
  });

  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    setIsPageLoaded(true);
  }, []);

  const totalSlips = useMemo(
    () =>
      slipStats?.reduce((sum: number, stat: any) => sum + (stat.count || 0), 0) ||
      0,
    [slipStats],
  );

  const totalAppointments = useMemo(
    () =>
      appointmentStats?.reduce(
        (sum: number, stat: any) => sum + (stat.count || 0),
        0,
      ) || 0,
    [appointmentStats],
  );

  const isLoading = isUserLoading || isIIRLoading || !isPageLoaded;
  const iirProfileStatus = iir?.isSubmitted ? "Complete" : "Pending";

  const corStatus = me?.studentCorUrl
    ? me?.isStudentCorValid
      ? "Valid"
      : "Outdated"
    : "None";

  const statCards = useMemo<StudentStatCard[]>(
    () => [
      {
        title: "Appointment",
        value: totalAppointments,
        subtitle: "scheduled sessions",
        icon: Clock,
        iconWrap: cn(
          "bg-slate-500/10 border-slate-500/20",
          "text-slate-600 dark:text-slate-400",
        ),
        href: "/student/appointments",
      },
      {
        title: "Admission Slip",
        value: totalSlips,
        subtitle: "submitted excuses",
        icon: ClipboardCheck,
        iconWrap: cn(
          "bg-emerald-500/10 border-emerald-500/20",
          "text-emerald-600 dark:text-emerald-400",
        ),
        href: "/student/slips",
      },
      {
        title: "IIR Record",
        value: iirProfileStatus,
        subtitle: iir?.isSubmitted ? "record completed" : "record pending",
        icon: ClipboardList,
        iconWrap: cn(
          iir?.isSubmitted
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
            : "bg-rose-500/10 border-rose-500/20 text-rose-600",
          iir?.isSubmitted ? "dark:text-emerald-400" : "dark:text-rose-400",
        ),
        href: "/student/iir",
      },
      {
        title: "COR Status",
        value: corStatus,
        subtitle: me?.studentCorUrl
          ? me?.isStudentCorValid
            ? "cor validated"
            : "needs update"
          : "no cor uploaded",
        icon: FileText,
        iconWrap: cn(
          me?.studentCorUrl
            ? me?.isStudentCorValid
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
              : "bg-amber-500/10 border-amber-500/20 text-amber-600"
            : "bg-slate-500/10 border-slate-500/20 text-slate-600",
          me?.studentCorUrl
            ? me?.isStudentCorValid
              ? "dark:text-emerald-400"
              : "dark:text-amber-400"
            : "dark:text-slate-400",
        ),
        href: "/student/cor-management",
      },
    ],
    [
      corStatus,
      iir?.isSubmitted,
      iirProfileStatus,
      me,
      totalAppointments,
      totalSlips,
    ],
  );

  const pageMeta = useMemo(
    () => ({
      title: me ? `Welcome back, ${me.firstName}!` : "Welcome back",
      description:
        "PUP Guidance Services — Supporting your academic and personal growth",
      badgeText: "Student Overview",
      badgeIcon: <LayoutDashboard className="h-4 w-4" />,
      isLoading,
      headerStats: (
        <HeaderStats
          totalAppointments={totalAppointments}
          totalSlips={totalSlips}
        />
      ),
    }),
    [me, totalAppointments, totalSlips, isLoading],
  );

  usePageMetadata(pageMeta);

  if (isLoading) return null;

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col",
        "px-3 pb-28 min-[520px]:px-4 sm:px-6 md:px-7 lg:px-8 lg:pb-24 xl:pb-12",
      )}
    >
      <AnimationStyles />

      <StatusSummaryCards statCards={statCards} />

      <ServicesOfferedSection guidanceServices={guidanceServices} />

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <QuickActionsSection actions={studentQuickActions} />
        <RemindersCard reminders={studentReminders} />
      </section>
    </div>
  );
}

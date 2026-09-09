import { useMemo } from "react";
import {
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  HandHeart,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";

import { AnimationStyles } from "@/components/ui/animations";
import { usePageMetadata } from "@/context";
import {
  useAppointmentsStats,
} from "@/features/appointments/hooks/useAppointments";
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

  const totalSlips = useMemo(
    () =>
      slipStats?.reduce(
        (sum: number, stat: any) => sum + (stat.count || 0),
        0,
      ) || 0,
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

  const isLoading = isUserLoading || isIIRLoading;
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
        iconWrap:
          "border-stale-foreground/30 bg-stale-background " +
          "text-stale-foreground",
      },
      {
        title: "Admission Slip",
        value: totalSlips,
        subtitle: "submitted excuses",
        icon: ClipboardCheck,
        iconWrap:
          "border-success-foreground/30 bg-success-background " +
          "text-success-foreground",
      },
      {
        title: "IIR Record",
        value: iirProfileStatus,
        subtitle: iir?.isSubmitted ? "record completed" : "record pending",
        icon: ClipboardList,
        iconWrap: iir?.isSubmitted
          ? "border-success-foreground/30 bg-success-background " +
            "text-success-foreground"
          : "border-destructive/30 bg-destructive/10 text-destructive",
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
        iconWrap: me?.studentCorUrl
          ? me?.isStudentCorValid
            ? "border-success-foreground/30 bg-success-background " +
              "text-success-foreground"
            : "border-warning-foreground/30 bg-warning-background " +
              "text-warning-foreground"
          : "border-stale-foreground/30 bg-stale-background " +
            "text-stale-foreground",
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

  const dynamicReminders = useMemo(() => {
    const reminders = [];

    if (!iir?.isSubmitted) {
      reminders.push({
        title: "Complete your IIR",
        description:
          "Your Individual Inventory Record is pending. Complete it " +
          "to unlock all guidance services.",
        icon: ClipboardList,
        badge: "Required",
        tone: "warning" as const,
      });
    }

    if (!me?.studentCorUrl || !me?.isStudentCorValid) {
      reminders.push({
        title: "Update your COR",
        description: !me?.studentCorUrl
          ? "No Certificate of Registration uploaded. Submit a copy " +
            "for enrollment verification."
          : "Your Certificate of Registration needs renewal or " +
            "revalidation.",
        icon: FileText,
        badge: "Action Needed",
        tone: "warning" as const,
      });
    }

    reminders.push({
      title: "Check request statuses",
      description:
        "Review your appointment schedules and admission slip " +
        "updates regularly.",
      icon: ShieldCheck,
      tone: "default" as const,
    });

    reminders.push({
      title: "Reach out when needed",
      description:
        "The Guidance Office is here to support your wellbeing and " +
        "academic progress.",
      icon: HandHeart,
      tone: "default" as const,
    });

    return reminders;
  }, [iir?.isSubmitted, me?.studentCorUrl, me?.isStudentCorValid]);

  const pageMeta = useMemo(
    () => ({
      title: me ? `Welcome back, ${me.firstName}!` : "Welcome back",
      description:
        "PUP Guidance Services — Supporting your academic and " +
        "personal growth",
      badgeText: "Student Overview",
      badgeIcon: <LayoutDashboard className="h-4 w-4" />,
      isLoading: false,
      headerStats: (
        <HeaderStats
          totalAppointments={totalAppointments}
          totalSlips={totalSlips}
        />
      ),
    }),
    [me, totalAppointments, totalSlips],
  );

  usePageMetadata(pageMeta);

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col",
        "px-3 pb-28 min-[520px]:px-4 sm:px-6 md:px-7 lg:px-8",
        "lg:pb-24 xl:pb-12",
      )}
    >
      <AnimationStyles />

      {/* KPI Overview Strip */}
      <StatusSummaryCards
        statCards={statCards}
        isLoading={isLoading}
      />

      {/* Action Center: Quick Actions + Dynamic Reminders */}
      <section className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <QuickActionsSection actions={studentQuickActions} />
        <RemindersCard reminders={dynamicReminders} />
      </section>

      {/* Tertiary Reference: Services Offered */}
      <ServicesOfferedSection guidanceServices={guidanceServices} />
    </div>
  );
}

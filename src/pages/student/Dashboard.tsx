import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  FileText,
  ClipboardList,
  User,
  ArrowUpRight,
  LayoutDashboard,
  Clock,
  ClipboardCheck,
} from "lucide-react";
import { useMe } from "@/features/users/hooks/useMe";
import { useUserIIR } from "@/features/iir/hooks";
import { useGetSlipStats } from "@/features/slips/hooks";
import { useAppointmentsStats } from "@/features/appointments/hooks/useAppointments";
import { usePageMetadata } from "@/context";
import { AnimationStyles } from "@/components/ui/animations";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: me, isLoading: isUserLoading } = useMe({});
  const { data: iir, isLoading: isIIRLoading } = useUserIIR(
    me?.id || undefined,
  );
  const { data: slipStats } = useGetSlipStats({});
  const { data: appointmentStats } = useAppointmentsStats({ params: {} });

  const totalSlips =
    slipStats?.reduce((sum: number, s: any) => sum + (s.count || 0), 0) || 0;
  const totalAppointments =
    appointmentStats?.reduce(
      (sum: number, s: any) => sum + (s.count || 0),
      0,
    ) || 0;

  const [isPageLoaded, setIsPageLoaded] = useState(false);
  useEffect(() => setIsPageLoaded(true), []);

  const isLoading = isUserLoading || isIIRLoading || !isPageLoaded;
  const iirProfileStatus = iir?.isSubmitted ? "Complete" : "Pending";
  const studentQuickActions = [
    {
      title: "Schedule Appointment",
      description: "Choose an available counseling session",
      icon: CalendarPlus,
      href: "/student/appointments/schedule",
      accent:
        "from-blue-500/15 to-sky-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
    {
      title: "Submit Admission Slip",
      description: "Upload and track your excuse slip",
      icon: FileText,
      href: "/student/slips/submit",
      accent:
        "from-emerald-500/15 to-green-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      title: "My IIR Profile",
      description: "View your personal record",
      icon: User,
      href: "/student/iir",
      accent:
        "from-rose-500/15 to-red-500/5 text-rose-600 dark:text-rose-400 border-rose-500/20",
    },
  ];

  const corStatus = me?.studentCorUrl
    ? me?.isStudentCorValid
      ? "Valid"
      : "Outdated"
    : "None";

  const statCards = [
    {
      title: "Appointment",
      value: totalAppointments,
      subtitle: "scheduled sessions",
      icon: Clock,
      iconWrap: cn(
        "bg-blue-500/10 border-blue-500/20",
        "text-blue-600 dark:text-blue-400",
      ),
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
    },
  ];

  const pageMeta = useMemo(
    () => ({
      title: me ? `Welcome back, ${me.firstName}!` : "Welcome back",
      description:
        "PUP Guidance Services — Supporting your academic and personal growth",
      badgeText: "Student Overview",
      badgeIcon: <LayoutDashboard className="h-4 w-4" />,
      isLoading,
      headerStats: (
        <div className="hidden grid-cols-2 gap-3 sm:grid">
          <div
            className={cn(
              "rounded-xl border border-white/30 bg-white/60 px-4 py-3",
              "backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]",
            )}
          >
            <p
              className={cn(
                "text-center text-[11px] font-medium uppercase",
                "tracking-[0.18em] text-muted-foreground",
              )}
            >
              Appts
            </p>
            <p
              className={cn(
                "mt-1 text-center text-2xl font-bold",
                "tabular-nums text-foreground",
              )}
            >
              {totalAppointments}
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl border border-white/30 bg-white/60 px-4 py-3",
              "backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]",
            )}
          >
            <p
              className={cn(
                "text-center text-[11px] font-medium uppercase",
                "tracking-[0.18em] text-muted-foreground",
              )}
            >
              Slips
            </p>
            <p
              className={cn(
                "mt-1 text-center text-2xl font-bold",
                "tabular-nums text-foreground",
              )}
            >
              {totalSlips}
            </p>
          </div>
        </div>
      ),
    }),
    [me, totalAppointments, totalSlips, isLoading],
  );

  usePageMetadata(pageMeta);

  if (isLoading) return null;

  return (
    <div className={cn("mx-auto flex w-full flex-col", "px-4 sm:px-6 md:px-8")}>
      <AnimationStyles />

      {/* 1. Stats Grid */}
      <section
        className={cn(
          "grid w-full grid-cols-2 gap-3",
          "sm:grid-cols-4 sm:gap-4",
        )}
      >
        {statCards.map((item) => (
          <Card
            key={item.title}
            className={cn(
              "group overflow-hidden rounded-xl border border-glass-border",
              "bg-glass-bg shadow-md",
              "backdrop-blur-xl transition-all duration-200",
              "hover:-translate-y-0.5",
            )}
          >
            <CardContent className="p-3 sm:p-5">
              <div
                className={cn(
                  "flex flex-col-reverse justify-between gap-3",
                  "sm:flex-row sm:items-start sm:gap-4",
                )}
              >
                <div className="space-y-1 sm:space-y-2.5">
                  <p
                    className={cn(
                      "text-[10px] font-semibold uppercase sm:text-[11px]",
                      "text-muted-foreground",
                    )}
                  >
                    {item.title}
                  </p>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p
                      className={cn(
                        "text-lg font-bold tabular-nums sm:text-2xl",
                        "tracking-tight text-foreground sm:text-3xl",
                      )}
                    >
                      {item.value}
                    </p>
                    <p
                      className={cn(
                        "hidden text-[11px] text-muted-foreground sm:block",
                      )}
                    >
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center sm:h-11 sm:w-11",
                    "justify-center rounded-lg border sm:rounded-xl",
                    "backdrop-blur-md transition-transform duration-200",
                    "group-hover:scale-105",
                    item.iconWrap,
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* 2. Quick Actions */}
      <section className="mt-10 space-y-3">
        <div>
          <p
            className={cn(
              "text-xs font-semibold uppercase",
              "tracking-[0.18em] text-muted-foreground",
            )}
          >
            Self-Services
          </p>
          <h2
            className={cn(
              "mt-1 text-xl font-semibold tracking-tight",
              "text-foreground",
            )}
          >
            Guidance Quick Actions
          </h2>
        </div>
        <div
          className={cn(
            "grid grid-cols-1 gap-3",
            "sm:grid-cols-2 sm:gap-4 md:grid-cols-3",
          )}
        >
          {studentQuickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className="group"
            >
              {/* Desktop View: Grid Cards */}
              <div
                className={cn(
                  "relative hidden overflow-hidden rounded-[18px] sm:flex",
                  "border border-white/20 bg-white/45 p-4",
                  "shadow-[0_8px_22px_rgba(15,23,42,0.06)] backdrop-blur-xl",
                  "transition-all duration-200 hover:-translate-y-0.5",
                  "hover:border-primary/25 hover:bg-white/55",
                  "flex-col dark:border-white/10 dark:bg-white/[0.04]",
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-x-0 top-0 h-20",
                    "bg-gradient-to-br opacity-90",
                    action.accent,
                  )}
                />
                <div
                  className={cn(
                    "relative flex min-h-[120px] flex-col",
                    "justify-between",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center",
                        "rounded-xl border bg-white/70 backdrop-blur-md",
                        "dark:bg-white/[0.06]",
                        action.accent.split(" ").pop(),
                      )}
                    >
                      <action.icon className="h-5 w-5" />
                    </div>
                    <ArrowUpRight
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-all",
                        "duration-200 group-hover:text-foreground",
                      )}
                    />
                  </div>
                  <div className="pt-4">
                    <h3 className="text-base font-semibold text-foreground">
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile View: List Items */}
              <div
                className={cn(
                  "flex items-center justify-between p-4 sm:hidden",
                  "rounded-2xl border border-white/20 bg-white/45",
                  "shadow-[0_4px_12px_rgba(15,23,42,0.04)] backdrop-blur-xl",
                  "dark:border-white/10 dark:bg-white/[0.04]",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center",
                      "rounded-xl border bg-white/70 backdrop-blur-md",
                      "dark:bg-white/[0.06]",
                      action.accent.split(" ").pop(),
                    )}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-foreground">
                      {action.title}
                    </h3>
                    <p
                      className={cn(
                        "text-[11px] text-muted-foreground",
                        "line-clamp-1",
                      )}
                    >
                      {action.description}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CalendarX,
  Plus,
  Tag,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LAYOUT_STYLES, getStatusColorKey } from "@/config/constants";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Appointment,
  AppointmentStatus,
  useAppointments,
} from "@/features/appointments";
import { useStatuses } from "@/features/appointments/hooks/useLookups";
import type { StatusCount } from "@/features/appointments/types";
import { useAppointmentsStats } from "@/features/appointments/hooks/useAppointments";
import { Pagination, Table } from "@/components/shared";
import Dropdown from "@/components/form/Dropdown";
import { format12HourTime, formatDate } from "@/utils/dateTime";
import { useAuth, usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";

const GLASS_CARD = LAYOUT_STYLES.CARD;
const GLASS_INNER = LAYOUT_STYLES.INNER;
const ACTION_REQUIRED_ALERT = LAYOUT_STYLES.ALERT;

const ALL_APPOINTMENT_STATUS: AppointmentStatus = {
  id: 0,
  name: "All",
};

export default function StudentAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: appointmentStatuses = [], isLoading: isStatusesLoading } =
    useStatuses();

  const filterStatuses = useMemo(
    () => [ALL_APPOINTMENT_STATUS, ...appointmentStatuses],
    [appointmentStatuses],
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>(
    ALL_APPOINTMENT_STATUS,
  );

  const { data, isLoading: isAppointmentsLoading } = useAppointments({
    isMe: true,
    params: {
      page: currentPage,
      pageSize: 5,
      statusId: selectedStatus?.id === 0 ? undefined : selectedStatus?.id,
    },
  });

  const { data: appointmentStats, isLoading: isStatsLoading } =
    useAppointmentsStats({});

  const appointments = data?.appointments || [];
  const statusCounts = appointmentStats || ([] as StatusCount[]);
  const isGlobalLoading = isStatsLoading || isStatusesLoading;

  const dropdownOptions = useMemo(() => {
    return filterStatuses.map((filter) => {
      const count =
        filter.id === 0
          ? statusCounts.reduce((sum, item) => sum + (item.count || 0), 0)
          : statusCounts?.find((s) => s.id === filter.id)?.count || 0;
      return {
        id: filter.id,
        name: `${filter.name} (${count})`,
      };
    });
  }, [filterStatuses, statusCounts]);

  const pageBadgeIcon = useMemo(() => <Calendar className="h-3 w-3" />, []);

  const hasValidCor = !!user?.studentCorUrl && !!user?.isStudentCorValid;

  const pageHeaderActions = useMemo(
    () => (
      <Button
        asChild={hasValidCor}
        disabled={!hasValidCor}
        className="h-10 gap-2 rounded-xl shadow-lg shadow-primary/15"
        title={
          !user?.studentCorUrl
            ? "Please upload your COR in your profile to book an appointment"
            : !user?.isStudentCorValid
              ? "Your COR is invalid or outdated for the current academic term"
              : ""
        }
        onClick={(e) => {
          if (!hasValidCor) {
            e.preventDefault();
          }
        }}
      >
        {hasValidCor ? (
          <Link to="/student/appointments/schedule">
            <Plus className="h-4 w-4" />
            New Appointment
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 opacity-50" />
            New Appointment
          </div>
        )}
      </Button>
    ),
    [user?.studentCorUrl, user?.isStudentCorValid, hasValidCor],
  );
  usePageMetadata({
    title: "My Appointments",
    description: "View and manage your counseling appointments",
    badgeText: "Appointments",
    badgeIcon: pageBadgeIcon,
    isLoading: false,
    headerActions: pageHeaderActions,
  });
  const getStatusColor = (statusName?: string) => {
    const key = getStatusColorKey(statusName);

    switch (key) {
      case "warning":
        return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200";
      case "info":
        return "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-200";
      case "success":
        return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200";
      case "danger":
        return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200";
      case "notice":
        return "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-200";
      case "stale":
        return "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-400/30 dark:bg-slate-400/10 dark:text-slate-200";
      default:
        return "border-border bg-muted/40 text-muted-foreground";
    }
  };

  const formatCompactDate = (value?: string) => {
    if (!value) return "—";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderListItem = useCallback(
    (appointment: Appointment, index: number) => (
      <div
        key={appointment.id}
        className={cn(
          "animate-fade-in-up cursor-pointer p-4",
          "max-w-full overflow-hidden transition-colors duration-200 hover:bg-muted/50",
          "sm:p-5",
        )}
        style={{
          animationDelay: `${0.04 * (index + 1)}s`,
          animationFillMode: "both",
        }}
        onClick={() => navigate(`/student/appointments/${appointment.id}`)}
      >
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={cn(
                "hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                "border border-primary/15 bg-primary/10 text-primary shadow-sm",
                "backdrop-blur-md sm:flex",
              )}
            >
              <Calendar className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-white/45 bg-white/40 text-xs",
                    "font-medium backdrop-blur-xl",
                    "dark:border-white/10 dark:bg-white/[0.05]",
                  )}
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {appointment.appointmentCategory.name}
                </Badge>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs hover:opacity-90",
                    getStatusColor(appointment.status?.name),
                  )}
                >
                  {appointment.status?.name}
                </Badge>
              </div>

              <p
                className={cn(
                  "mt-1.5 line-clamp-1 text-sm",
                  "text-muted-foreground/90",
                )}
              >
                {appointment.reason}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "grid min-w-0 grid-cols-1 gap-1.5 text-sm text-muted-foreground",
              "sm:grid-cols-2 xl:ml-auto xl:flex xl:shrink-0 xl:items-center xl:justify-end xl:gap-4",
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">
                Date Requested: {formatCompactDate(appointment.createdAt)}
              </span>
            </div>

            <span
              className={cn("hidden text-muted-foreground/40", "xl:inline")}
            >
              •
            </span>

            <div className="flex min-w-0 items-center gap-2">
              <CalendarClock className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">
                Appointment: {formatDate(appointment.whenDate)}{" "}
                {format12HourTime(appointment.timeSlot.time)}
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    [navigate, getStatusColor, formatCompactDate],
  );

  const emptyState = useMemo(
    () => (
      <div className="px-4 py-10 sm:px-6 sm:py-12">
        <div
          className={cn(
            "mx-auto flex max-w-md flex-col",
            "items-center text-center",
          )}
        >
          <div
            className={cn(
              "mb-4 flex h-20 w-20 items-center",
              "justify-center rounded-full",
              GLASS_INNER,
            )}
          >
            <CalendarX className="h-9 w-9 text-muted-foreground" />
          </div>

          <h3 className="mb-2 text-xl font-semibold text-foreground">
            No appointments found
          </h3>

          <p className="mb-6 text-sm text-muted-foreground">
            {selectedStatus.id === 0
              ? "You haven't scheduled any appointments yet. " +
                "Book your first counseling session now."
              : `No ${selectedStatus.name.toLowerCase()} appointments found.`}
          </p>

          {selectedStatus.id === 0 && (
            <Button
              asChild={hasValidCor}
              disabled={!hasValidCor}
              className="rounded-xl shadow-lg shadow-primary/15"
              title={
                !user?.studentCorUrl
                  ? "Please upload your COR in your profile " +
                    "to book an appointment"
                  : !user?.isStudentCorValid
                    ? "Your COR is invalid or outdated for the " +
                      "current academic term"
                    : ""
              }
              onClick={(e) => {
                if (!hasValidCor) {
                  e.preventDefault();
                }
              }}
            >
              {hasValidCor ? (
                <Link to="/student/appointments/schedule">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Appointment
                </Link>
              ) : (
                <div className="flex items-center">
                  <Plus className="mr-2 h-4 w-4 opacity-50" />
                  Schedule Appointment
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    ),
    [selectedStatus, hasValidCor, user?.studentCorUrl, user?.isStudentCorValid],
  );

  return (
    <div
      className={cn(
        "relative isolate mx-auto flex w-full max-w-full flex-col space-y-6",
        "overflow-x-hidden px-4 sm:px-6 md:px-8"
      )}
    >
      {!user?.studentCorUrl ? (
        <Alert
          variant="destructive"
          className={ACTION_REQUIRED_ALERT}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-base font-medium">
            Action Required: Missing Certificate of Registration
          </AlertTitle>
          <AlertDescription className="text-sm">
            You need to upload your COR before you can book appointments.{" "}
            <Link
              to="/student/cor-management"
              className="font-semibold underline hover:text-rose-700 dark:hover:text-rose-300"
            >
              Go to COR Management
            </Link>
          </AlertDescription>
        </Alert>
      ) : !user?.isStudentCorValid ? (
        <Alert
          variant="destructive"
          className={ACTION_REQUIRED_ALERT}
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-base font-medium">
            Action Required: Invalid or Outdated Certificate of Registration
          </AlertTitle>
          <AlertDescription className="text-sm">
            Your uploaded COR is not valid for the current academic term. Please
            upload your updated COR to proceed.{" "}
            <Link
              to="/student/cor-management"
              className="font-semibold underline hover:text-rose-700 dark:hover:text-rose-300"
            >
              Go to COR Management
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className={cn(GLASS_CARD, "min-w-0 animate-fade-in-up overflow-hidden")}>
        <CardHeader
          className={cn(
            "border-b border-white/30 px-4 py-3.5",
            "dark:border-white/10",
          )}
        >
          <div className="w-full max-w-xs md:hidden">
            {isGlobalLoading ? (
              <Skeleton className="h-10 w-full rounded-xl" />
            ) : (
              <Dropdown
                label="Appointment Status"
                options={dropdownOptions}
                value={selectedStatus.id}
                onChange={(val) => {
                  const selected = filterStatuses.find(
                    (s) => String(s.id) === String(val),
                  );
                  if (selected) {
                    setSelectedStatus(selected);
                    setCurrentPage(1);
                  }
                }}
              />
            )}
          </div>

          <div className="hidden flex-wrap gap-2 md:flex">
            {isGlobalLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton
                  key={idx}
                  className="h-9 w-24 rounded-xl"
                />
              ))
            ) : (
              filterStatuses.map((filter) => {
                const isActive =
                  String(selectedStatus.id) === String(filter.id);
                const count =
                  filter.id === 0
                    ? statusCounts.reduce(
                        (sum, item) => sum + (item.count || 0),
                        0,
                      )
                    : (statusCounts?.find(
                        (s) => s.id === filter.id,
                      )?.count || 0);

                return (
                  <Button
                    key={filter.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedStatus(filter);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "group h-9 rounded-xl px-4 text-xs font-bold transition-all",
                      isActive
                        ? "shadow-md"
                        : cn(
                            "border-glass-border bg-glass-bg",
                            "hover:bg-primary/10 hover:text-primary",
                            "hover:opacity-90"
                          )
                    )}
                  >
                    <span>{filter.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-2 rounded-lg px-1.5 py-0.5 text-[10px]",
                        "font-bold transition-all",
                        isActive
                          ? "bg-primary-foreground text-primary"
                          : "bg-muted/60 text-muted-foreground",
                        "group-hover:bg-primary",
                        "group-hover:text-primary-foreground"
                      )}
                    >
                      {count}
                    </Badge>
                  </Button>
                );
              })
            )}
          </div>
        </CardHeader>

        <CardContent className="bg-glass-bg p-0">
          <Table
            variant="list"
            data={appointments}
            renderListItem={renderListItem}
            isLoading={isAppointmentsLoading}
            emptyState={emptyState}
          />

          <Separator className="bg-white/25 dark:bg-white/10" />

          <Pagination
            currentPage={data?.meta?.page || 1}
            totalPages={data?.meta?.totalPages || 1}
            onPageChange={(page) => setCurrentPage(page)}
            className="mt-0 border-t-0 px-4 py-3"
          />
        </CardContent>
      </Card>
    </div>
  );
}

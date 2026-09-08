import { useMemo } from "react";
import { useUrlState } from "@/hooks";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarX,
  CheckCircle2,
  Clock,
  Plus,
  Tag,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import {
  AppointmentStatus,
  useAppointments,
} from "@/features/appointments";
import { useStatuses } from "@/features/appointments/hooks/useLookups";
import type { StatusCount } from "@/features/appointments/types";
import {
  useAppointmentsStats,
} from "@/features/appointments/hooks/useAppointments";
import { Pagination } from "@/components/shared";
import { Spinner } from "@/components/shared/Spinner";
import { SelectField } from "@/components/ui/select-field";
import { format12HourTime } from "@/utils/dateTime";
import { useAuth, usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";

const ALL_APPOINTMENT_STATUS: AppointmentStatus = {
  id: 0,
  name: "All",
};

type SortOrder = "asc" | "desc";

interface SortOption {
  id: string;
  displayName: string;
  sort: string;
  order: SortOrder;
}

const SORT_OPTIONS: SortOption[] = [
  {
    id: "whenDate-asc",
    displayName: "Appointment: Soonest",
    sort: "whenDate",
    order: "asc",
  },
  {
    id: "whenDate-desc",
    displayName: "Appointment: Latest",
    sort: "whenDate",
    order: "desc",
  },
  {
    id: "createdAt-desc",
    displayName: "Requested: Newest",
    sort: "createdAt",
    order: "desc",
  },
  {
    id: "createdAt-asc",
    displayName: "Requested: Oldest",
    sort: "createdAt",
    order: "asc",
  },
  {
    id: "category-asc",
    displayName: "Category: A–Z",
    sort: "category",
    order: "asc",
  },
  {
    id: "category-desc",
    displayName: "Category: Z–A",
    sort: "category",
    order: "desc",
  },
];

export default function StudentAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: appointmentStatuses = [] } = useStatuses();

  const filterStatuses = useMemo(
    () => [ALL_APPOINTMENT_STATUS, ...appointmentStatuses],
    [appointmentStatuses],
  );

  const [currentPage, setCurrentPage] = useUrlState("page", 1);
  const [selectedStatus, setSelectedStatus] = useUrlState<AppointmentStatus>(
    "status",
    ALL_APPOINTMENT_STATUS,
  );

  const [selectedSort, setSelectedSort] = useUrlState<string>(
    "sort",
    "whenDate",
  );
  const [selectedOrder, setSelectedOrder] = useUrlState<SortOrder>(
    "order",
    "asc",
  );

  const { data, isLoading: isAppointmentsLoading } = useAppointments({
    isMe: true,
    params: {
      page: currentPage,
      pageSize: 10,
      statusId: selectedStatus?.id === 0 ? undefined : selectedStatus?.id,
    },
  });

  const { data: appointmentStats } = useAppointmentsStats({
    params: { scope: "me" },
  });

  const appointments = data?.appointments || [];
  const statusCounts = appointmentStats || ([] as StatusCount[]);

  const totalCount = useMemo(() => {
    return statusCounts.reduce((sum, item) => sum + (item.count || 0), 0);
  }, [statusCounts]);

  const pendingCount = useMemo(() => {
    return (
      statusCounts.find((s) => s.name?.toLowerCase().includes("pending"))
        ?.count || 0
    );
  }, [statusCounts]);

  const scheduledCount = useMemo(() => {
    return (
      statusCounts.find(
        (s) =>
          s.name?.toLowerCase().includes("scheduled") ||
          s.name?.toLowerCase().includes("approved"),
      )?.count || 0
    );
  }, [statusCounts]);

  const completedCount = useMemo(() => {
    return (
      statusCounts.find((s) => s.name?.toLowerCase().includes("completed"))
        ?.count || 0
    );
  }, [statusCounts]);

  // Local sorting
  const sortedAppointments = useMemo(() => {
    const result = [...appointments];
    result.sort((a, b) => {
      if (selectedSort === "category") {
        const catA = (a.appointmentCategory?.name || "").toLowerCase();
        const catB = (b.appointmentCategory?.name || "").toLowerCase();
        const res = catA.localeCompare(catB);
        return selectedOrder === "asc" ? res : -res;
      }
      if (selectedSort === "createdAt") {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return selectedOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (selectedSort === "whenDate") {
        const dateA = new Date(a.whenDate || 0).getTime();
        const dateB = new Date(b.whenDate || 0).getTime();
        return selectedOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
    return result;
  }, [appointments, selectedSort, selectedOrder]);

  const pageBadgeIcon = useMemo(
    () => <Calendar className="h-3.5 w-3.5" />,
    [],
  );

  const hasValidCor = !!user?.studentCorUrl && !!user?.isStudentCorValid;

  const pageHeaderActions = useMemo(
    () => (
      <Button
        asChild={hasValidCor}
        disabled={!hasValidCor}
        className="h-10 gap-2 rounded-xl shadow-lg shadow-primary/15"
        title={
          !user?.studentCorUrl
            ? "Upload your COR in your profile to book an appointment"
            : !user?.isStudentCorValid
              ? "Your COR is invalid or outdated for current term"
              : ""
        }
        onClick={(e) => {
          if (!hasValidCor) e.preventDefault();
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

  usePageMetadata(
    useMemo(
      () => ({
        title: "My Appointments",
        description: "View and manage your counseling appointments",
        badgeText: "Appointments",
        badgeIcon: pageBadgeIcon,
        headerActions: pageHeaderActions,
      }),
      [pageBadgeIcon, pageHeaderActions],
    ),
  );

  const getStatusColor = (statusName?: string) => {
    const key = getStatusColorKey(statusName);
    return (
      STATUS_COLORS[key] || "border-border bg-muted/40 text-muted-foreground"
    );
  };

  const formatCompactDate = (value?: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleMetricCardClick = (targetName: string) => {
    if (targetName === "All") {
      setSelectedStatus(ALL_APPOINTMENT_STATUS);
      setCurrentPage(1);
      return;
    }
    const match = appointmentStatuses.find((s) =>
      s.name.toLowerCase().includes(targetName.toLowerCase()),
    );
    if (match) {
      if (selectedStatus.id === match.id) {
        setSelectedStatus(ALL_APPOINTMENT_STATUS);
      } else {
        setSelectedStatus(match);
      }
      setCurrentPage(1);
    }
  };

  const emptyState = useMemo(() => {
    const isFiltered = selectedStatus.id !== 0;

    return (
      <div className="px-4 py-12 text-center sm:py-16">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div
            className={cn(
              "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl",
              "border border-border/80 bg-muted/30 text-muted-foreground",
            )}
          >
            <CalendarX className="h-8 w-8" />
          </div>

          <h3 className="text-lg font-semibold text-foreground">
            {isFiltered
              ? `No ${selectedStatus.name.toLowerCase()} appointments found`
              : "No counseling appointments yet"}
          </h3>

          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
            {isFiltered
              ? "You do not have any appointments matching this status filter."
              : "Book a one-on-one session with your guidance counselor to " +
                "discuss your academic, personal, or career concerns."}
          </p>

          {isFiltered ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStatus(ALL_APPOINTMENT_STATUS);
                setCurrentPage(1);
              }}
              className="mt-5 rounded-xl text-xs font-semibold"
            >
              Clear Status Filter
            </Button>
          ) : (
            <Button
              asChild={hasValidCor}
              disabled={!hasValidCor}
              className="mt-5 gap-2 rounded-xl shadow-lg shadow-primary/15"
              onClick={(e) => {
                if (!hasValidCor) e.preventDefault();
              }}
            >
              {hasValidCor ? (
                <Link to="/student/appointments/schedule">
                  <Plus className="h-4 w-4" />
                  Schedule First Appointment
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 opacity-50" />
                  Schedule First Appointment
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }, [selectedStatus, hasValidCor, setSelectedStatus, setCurrentPage]);

  return (
    <div
      className={cn(
        "relative isolate mx-auto flex w-full max-w-7xl flex-col",
        "space-y-6 px-4 pb-12 sm:px-6 md:px-8",
      )}
    >
      {/* COR Missing / Invalid Alerts */}
      {!user?.studentCorUrl ? (
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/20 bg-destructive/5"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            Action Required: Missing Certificate of Registration
          </AlertTitle>
          <AlertDescription className="text-xs">
            Upload your valid COR in your profile before booking
            consultations.{" "}
            <Link
              to="/student/cor-management"
              className="font-semibold underline hover:opacity-80"
            >
              Go to COR Management
            </Link>
          </AlertDescription>
        </Alert>
      ) : !user?.isStudentCorValid ? (
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/20 bg-destructive/5"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            Action Required: Invalid Certificate of Registration
          </AlertTitle>
          <AlertDescription className="text-xs">
            Your uploaded COR is not valid for the current academic term.{" "}
            <Link
              to="/student/cor-management"
              className="font-semibold underline hover:opacity-80"
            >
              Upload Updated COR
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Top Metric Bento Row (Recognition over Recall) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card
          onClick={() => handleMetricCardClick("All")}
          className={cn(
            "cursor-pointer rounded-2xl border border-border bg-card p-4",
            "shadow-sm transition-all hover:border-primary/40",
            "hover:bg-accent/40 active:scale-[0.98]",
            selectedStatus.id === 0 && "border-primary/40 bg-primary/5",
          )}
        >
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {totalCount}
              </p>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-primary/10 text-primary",
              )}
            >
              <CalendarDays className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleMetricCardClick("Pending")}
          className={cn(
            "cursor-pointer rounded-2xl border border-border bg-card p-4",
            "shadow-sm transition-all hover:border-amber-500/40",
            "hover:bg-amber-500/5 active:scale-[0.98]",
            selectedStatus.name.toLowerCase().includes("pending") &&
              "border-amber-500/50 bg-amber-500/10",
          )}
        >
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Pending
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {pendingCount}
              </p>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-amber-500/10 text-amber-600",
              )}
            >
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleMetricCardClick("Scheduled")}
          className={cn(
            "cursor-pointer rounded-2xl border border-border bg-card p-4",
            "shadow-sm transition-all hover:border-blue-500/40",
            "hover:bg-blue-500/5 active:scale-[0.98]",
            (selectedStatus.name.toLowerCase().includes("scheduled") ||
              selectedStatus.name.toLowerCase().includes("approved")) &&
              "border-blue-500/50 bg-blue-500/10",
          )}
        >
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Scheduled
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {scheduledCount}
              </p>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-blue-500/10 text-blue-600",
              )}
            >
              <CalendarClock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleMetricCardClick("Completed")}
          className={cn(
            "cursor-pointer rounded-2xl border border-border bg-card p-4",
            "shadow-sm transition-all hover:border-emerald-500/40",
            "hover:bg-emerald-500/5 active:scale-[0.98]",
            selectedStatus.name.toLowerCase().includes("completed") &&
              "border-emerald-500/50 bg-emerald-500/10",
          )}
        >
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Completed
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {completedCount}
              </p>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-emerald-500/10 text-emerald-600",
              )}
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segmented Filter Pills & Compact Sort Bar */}
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center",
          "sm:justify-between border-b border-border/60 pb-3",
        )}
      >
        {/* Horizontal Segmented Status Tabs (1-click filtering) */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {filterStatuses.map((status) => {
            const count =
              status.id === 0
                ? totalCount
                : statusCounts.find((s) => s.id === status.id)?.count || 0;
            const isSelected = selectedStatus.id === status.id;

            return (
              <button
                key={status.id}
                type="button"
                onClick={() => {
                  setSelectedStatus(status);
                  setCurrentPage(1);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs",
                  "font-semibold transition-all select-none",
                  isSelected
                    ? "border border-primary/40 bg-primary/10 " +
                        "text-primary shadow-sm"
                    : "border border-border/70 bg-card " +
                        "text-muted-foreground hover:bg-muted/60 " +
                        "hover:text-foreground",
                )}
              >
                <span>{status.name}</span>
                <Badge
                  variant={isSelected ? "default" : "secondary"}
                  className={cn(
                    "h-4 min-w-4 rounded-full px-1.5 text-[10px]",
                    isSelected && "bg-primary text-primary-foreground",
                  )}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Compact Sort Selector using SelectField */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          />
          <div className="w-[185px] sm:w-[200px]">
            <SelectField
              options={SORT_OPTIONS}
              value={`${selectedSort}-${selectedOrder}`}
              onChange={(val) => {
                const [sort, order] = String(val).split("-") as [
                  string,
                  SortOrder,
                ];
                setSelectedSort(sort);
                setSelectedOrder(order);
                setCurrentPage(1);
              }}
              labelKey="displayName"
              enabled={!isAppointmentsLoading}
              buttonClassName={cn(
                "!h-8 !min-h-0 !py-1 !px-2.5 text-xs font-semibold",
                "rounded-xl border-border/70 bg-card hover:bg-muted/40",
                "shadow-none",
              )}
            />
          </div>
        </div>
      </div>

      {/* Appointment Cards Grid / Loading / Empty State */}
      <div className="w-full">
        {isAppointmentsLoading ? (
          <div className="flex w-full items-center justify-center p-16">
            <Spinner size="lg" />
          </div>
        ) : sortedAppointments.length === 0 ? (
          emptyState
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-4 md:grid-cols-2",
              "xl:grid-cols-3 2xl:grid-cols-4",
            )}
          >
            {sortedAppointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() =>
                  navigate(`/student/appointments/${appointment.id}`)
                }
                className={cn(
                  "group flex flex-col justify-between rounded-2xl border",
                  "border-border bg-card p-5 text-left shadow-sm",
                  "transition-all hover:-translate-y-0.5",
                  "hover:border-primary/40 hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-primary",
                )}
                aria-label={`View appointment: ${
                  appointment.appointmentCategory?.name || "Uncategorized"
                }`}
              >
                <div className="space-y-3">
                  {/* Category & Status Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "max-w-[170px] truncate border-border/80 bg-muted/40",
                        "text-[11px] font-semibold text-foreground",
                      )}
                    >
                      <Tag
                        className={cn(
                          "mr-1.5 h-3 w-3 shrink-0 text-muted-foreground",
                        )}
                      />
                      <span className="truncate">
                        {appointment.appointmentCategory?.name ||
                          "Uncategorized"}
                      </span>
                    </Badge>

                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 px-2.5 py-0.5 text-[11px] font-bold",
                        "uppercase tracking-wider",
                        getStatusColor(appointment.status?.name),
                      )}
                    >
                      {appointment.status?.name || "Unknown"}
                    </Badge>
                  </div>

                  {/* Reason Text (Clamped for grid consistency) */}
                  <p
                    className={cn(
                      "line-clamp-2 text-xs font-medium leading-relaxed",
                      "text-foreground/85",
                    )}
                    title={appointment.reason}
                  >
                    {appointment.reason}
                  </p>
                </div>

                {/* Footer Dates */}
                <div
                  className={cn(
                    "mt-4 flex flex-col gap-2 border-t border-border/60",
                    "pt-3 text-xs sm:flex-row sm:items-center",
                    "sm:justify-between",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-[11px]",
                      "text-muted-foreground",
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    {formatCompactDate(appointment.createdAt)}
                  </span>

                  <span
                    className={cn(
                      "flex items-center gap-1.5 font-mono text-[11px]",
                      "font-semibold text-primary",
                    )}
                  >
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                    {formatCompactDate(appointment.whenDate)} •{" "}
                    {format12HourTime(appointment.timeSlot?.time || "")}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <Pagination
          currentPage={data?.meta?.page || 1}
          totalPages={data?.meta?.totalPages || 1}
          onPageChange={(page) => setCurrentPage(page)}
          className="mt-6"
        />
      </div>
    </div>
  );
}

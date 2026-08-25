import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CalendarClock,
  CalendarX,
  Plus,
  Tag,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LAYOUT_STYLES, getStatusColorKey } from "@/config/constants";
import {
  Appointment,
  AppointmentStatus,
  useAppointments,
} from "@/features/appointments";
import { useStatuses } from "@/features/appointments/hooks/useLookups";
import type { StatusCount } from "@/features/appointments/types";
import { useAppointmentsStats } from "@/features/appointments/hooks/useAppointments";
import { Pagination, Table, Column } from "@/components/shared";
import { SelectField } from "@/components/ui/select-field";
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

type SortOrder = "asc" | "desc";

export default function StudentAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: appointmentStatuses = [] } = useStatuses();

  const filterStatuses = useMemo(
    () => [ALL_APPOINTMENT_STATUS, ...appointmentStatuses],
    [appointmentStatuses],
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus>(
    ALL_APPOINTMENT_STATUS,
  );
  
  // Sorting states for table headers
  const [selectedSort, setSelectedSort] = useState<string>("whenDate");
  const [selectedOrder, setSelectedOrder] = useState<SortOrder>("asc");

  const { data, isLoading: isAppointmentsLoading } = useAppointments({
    isMe: true,
    params: {
      page: currentPage,
      pageSize: 10,
      statusId: selectedStatus?.id === 0 ? undefined : selectedStatus?.id,
    },
  });

  const { data: appointmentStats } = useAppointmentsStats({});

  const appointments = data?.appointments || [];
  const statusCounts = appointmentStats || ([] as StatusCount[]);

  // Local sorting calculation supporting category, date requested, and appointment date
  const sortedAppointments = useMemo(() => {
    let result = [...appointments];
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
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const mobileSortOptions = [
    { id: "whenDate-asc", displayName: "Appointment: soonest" },
    { id: "whenDate-desc", displayName: "Appointment: latest" },
    { id: "createdAt-desc", displayName: "Requested: newest" },
    { id: "createdAt-asc", displayName: "Requested: oldest" },
    { id: "category-asc", displayName: "Category: A–Z" },
    { id: "category-desc", displayName: "Category: Z–A" },
  ];

  const renderSortableHeader = (label: string, sortKey: string) => {
    const isActive = selectedSort === sortKey;
    const Icon = isActive ? (selectedOrder === "desc" ? ArrowDown : ArrowUp) : ArrowUp;

    return (
      <button
        type="button"
        onClick={() => {
          setSelectedSort(sortKey);
          setSelectedOrder(isActive && selectedOrder === "asc" ? "desc" : "asc");
          setCurrentPage(1);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-2 py-1 whitespace-nowrap outline-none",
          "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
          isActive ? "text-[#800000] dark:text-red-400" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        <Icon 
          className={cn("h-3.5 w-3.5 shrink-0", isActive ? "opacity-100" : "opacity-40")} 
          strokeWidth={isActive ? 2.5 : 2} 
        />
      </button>
    );
  };

  const appointmentColumns = useMemo<Column<Appointment>[]>(
    () => [
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-start">
            {renderSortableHeader("Category & Reason", "category")}
          </div>
        ),
        className: "w-[35%] p-0",
        render: (appointment: Appointment) => (
          <div className="px-4 py-3 flex flex-col gap-1 text-left">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "border-white/45 bg-white/40 text-[11px]",
                  "font-medium backdrop-blur-xl",
                  "dark:border-white/10 dark:bg-white/[0.05]",
                )}
              >
                <Tag className="mr-1 h-3 w-3" />
                {appointment.appointmentCategory.name}
              </Badge>
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-1 mt-0.5">
              {appointment.reason}
            </p>
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-start">
            {renderSortableHeader("Date Requested", "createdAt")}
          </div>
        ),
        className: "w-[20%] p-0",
        render: (appointment: Appointment) => (
          <div className="px-3 py-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={14} className="shrink-0" />
            <span className="whitespace-nowrap">{formatCompactDate(appointment.createdAt)}</span>
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-start">
            {renderSortableHeader("Appointment Date", "whenDate")}
          </div>
        ),
        className: "w-[25%] p-0",
        render: (appointment: Appointment) => (
          <div className="px-3 py-3 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock size={14} className="shrink-0" />
            <span className="whitespace-nowrap font-medium text-foreground">
              {formatDate(appointment.whenDate)} • {format12HourTime(appointment.timeSlot.time)}
            </span>
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full">
            <SelectField
              label=""
              options={filterStatuses.map((s) => {
                const count =
                  s.id === 0
                    ? statusCounts.reduce((sum, item) => sum + (item.count || 0), 0)
                    : statusCounts?.find((sc) => sc.id === s.id)?.count || 0;

                return {
                  id: s.id,
                  displayName: s.id === 0 ? "All Statuses" : `${s.name} (${count})`,
                  disabled: s.id !== 0 && count === 0,
                };
              })}
              value={selectedStatus.id}
              onChange={(val) => {
                const found = filterStatuses.find((s) => String(s.id) === String(val));
                if (found) {
                  setSelectedStatus(found);
                  setCurrentPage(1);
                }
              }}
              labelKey="displayName"
              enabled={!isAppointmentsLoading}
              buttonClassName={cn(
                "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
                "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
                selectedStatus.id === 0 ? "text-muted-foreground hover:text-foreground" : "text-[#800000] dark:text-red-400"
              )}
            />
          </div>
        ),
        className: "w-[20%] p-0",
        render: (appointment: Appointment) => (
          <div className="px-3 py-3 flex items-center">
            <Badge
              variant="outline"
              className={cn(
                "text-xs hover:opacity-95 font-semibold px-2.5 py-0.5",
                getStatusColor(appointment.status?.name),
              )}
            >
              {appointment.status?.name}
            </Badge>
          </div>
        ),
      },
    ],
    [selectedSort, selectedOrder, filterStatuses, selectedStatus, statusCounts, isAppointmentsLoading]
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
        <CardHeader className="border-b border-white/30 px-4 py-3.5 dark:border-white/10 xl:hidden">
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <SelectField
              label="Appointment status"
              options={filterStatuses.map((status) => {
                const count =
                  status.id === 0
                    ? statusCounts.reduce((sum, item) => sum + (item.count || 0), 0)
                    : statusCounts.find((item) => item.id === status.id)?.count || 0;

                return {
                  id: status.id,
                  displayName: status.id === 0 ? "All Statuses" : `${status.name} (${count})`,
                  disabled: status.id !== 0 && count === 0,
                };
              })}
              value={selectedStatus.id}
              onChange={(value) => {
                const status = filterStatuses.find((item) => String(item.id) === String(value));
                if (status) {
                  setSelectedStatus(status);
                  setCurrentPage(1);
                }
              }}
              labelKey="displayName"
              enabled={!isAppointmentsLoading}
            />
            <SelectField
              label="Sort appointments"
              options={mobileSortOptions}
              value={`${selectedSort}-${selectedOrder}`}
              onChange={(value) => {
                const [sort, order] = String(value).split("-") as [string, SortOrder];
                setSelectedSort(sort);
                setSelectedOrder(order);
                setCurrentPage(1);
              }}
              labelKey="displayName"
              enabled={!isAppointmentsLoading}
            />
          </div>
        </CardHeader>
        <CardContent className="bg-glass-bg p-0">
          <Table
            data={sortedAppointments}
            columns={appointmentColumns}
            isLoading={isAppointmentsLoading}
            emptyState={emptyState}
            onRowClick={(appointment) => navigate(`/student/appointments/${appointment.id}`)}
            renderMobileItem={(appointment) => (
              <button
                type="button"
                onClick={() => navigate(`/student/appointments/${appointment.id}`)}
                className={cn(
                  "w-full rounded-xl border border-border/70 bg-background/70 p-4 text-left",
                  "transition-colors hover:bg-muted/50 focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "dark:border-white/10 dark:bg-white/[0.025] dark:hover:bg-white/[0.06]",
                )}
                aria-label={`View appointment: ${appointment.appointmentCategory?.name || "Uncategorized"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge
                    variant="outline"
                    className="max-w-[60%] whitespace-normal break-words border-white/45 bg-white/40 text-[11px] font-medium backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]"
                  >
                    <Tag className="mr-1 h-3 w-3 shrink-0" />
                    {appointment.appointmentCategory?.name || "Uncategorized"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "max-w-[40%] whitespace-normal break-words px-2.5 py-0.5 text-center text-xs font-semibold",
                      getStatusColor(appointment.status?.name),
                    )}
                  >
                    {appointment.status?.name || "Unknown"}
                  </Badge>
                </div>
                <p className="mt-3 break-words text-sm font-medium text-foreground">
                  {appointment.reason}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground dark:border-white/10">
                  <div className="min-w-0">
                    <span className="block font-semibold uppercase tracking-wide">Requested</span>
                    <span className="mt-1 flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {formatCompactDate(appointment.createdAt)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block font-semibold uppercase tracking-wide">Appointment</span>
                    <span className="mt-1 flex items-center gap-1.5 whitespace-nowrap">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                      {formatCompactDate(appointment.whenDate)}
                    </span>
                    <span className="mt-1 block pl-5 text-[11px]">
                      {format12HourTime(appointment.timeSlot?.time || "")}
                    </span>
                  </div>
                </div>
              </button>
            )}
            tableClassName="w-full table-fixed"
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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pagination, Table, Column } from "@/components/shared";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { Appointment, AppointmentStatus, StatusCount } from "../types";
import {
  CalendarX,
  Eye,
  Tag,
  User,
  CalendarDays,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useMemo } from "react";
import { SearchInput } from "@/components/form";
import { format12HourTime, formatDate } from "@/utils/dateTime";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dropdown } from "@/components/form";
import { Skeleton } from "@/components/ui/skeleton";

function getUrgencyValue(apt: Appointment) {
  const raw = apt.urgencyLevel ?? apt.urgency;
  if (!raw) return null;

  if (typeof raw === "string") {
    return { label: raw, key: raw.toLowerCase() };
  }

  return {
    label: raw.name || "Urgency",
    key: raw.colorKey || raw.name?.toLowerCase() || "default",
  };
}

function UrgencyCapsule({ appointment }: { appointment: Appointment }) {
  const urgency = getUrgencyValue(appointment);
  if (!urgency?.label) return null;

  const level = urgency.key.toLowerCase();
  const tone =
    level.includes("high") || level.includes("urgent")
      ? "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-300"
      : level.includes("medium") || level.includes("moderate")
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : level.includes("low")
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-primary/20 bg-primary/10 text-primary";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border",
        "px-2.5 py-1 text-[10px] uppercase",
        tone,
      )}
      title={`Urgency level: ${urgency.label}`}
    >
      <AlertTriangle className="h-3 w-3" />
      {urgency.label}
    </span>
  );
}

interface AppointmentListProps {
  title?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statuses: AppointmentStatus[];
  selectedStatus: AppointmentStatus;
  statusCounts: StatusCount[];
  onStatusChange: (status: AppointmentStatus) => void;
  appointments: Appointment[];
  isLoading?: boolean;
  onViewClick: (apt: Appointment) => void;
  currentPage: number;
  onPageChange: (p: number) => void;
  totalPages: number;
  className?: string;
}

export default function AppointmentList({
  title,
  searchTerm,
  onSearchChange,
  statuses,
  selectedStatus,
  statusCounts,
  onStatusChange,
  appointments,
  isLoading,
  onViewClick,
  currentPage,
  onPageChange,
  totalPages,
  className,
}: AppointmentListProps) {
  const statMap = useMemo(() => {
    const map: Record<number, StatusCount> = {};
    statusCounts.forEach((sc) => {
      map[sc.id] = sc;
    });
    return map;
  }, [statusCounts]);

  const dropdownOptions = useMemo(() => {
    return statuses.map((s) => ({
      ...s,
      displayName:
        s.id === 0
          ? "All Statuses"
          : `${s.name} (${statMap[s.id]?.count || 0})`,
    }));
  }, [statuses, statMap]);

  const columns = useMemo<Column<Appointment>[]>(
    () => [
      {
        header: "Date",
        className: "pl-6 pr-2 py-4 text-left",
        render: (apt) => (
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 flex-col items-center",
              "justify-center rounded-xl border border-white/55",
              "bg-white/45 shadow-sm backdrop-blur-xl",
              "dark:border-white/10 dark:bg-white/[0.055]",
            )}
          >
            <span
              className={cn(
                "text-[9px] font-bold uppercase",
                "tracking-wider text-primary",
              )}
            >
              {new Date(apt.whenDate).toLocaleDateString("en-US", {
                month: "short",
              })}
            </span>
            <span className="text-base font-extrabold text-foreground">
              {new Date(apt.whenDate).getDate()}
            </span>
          </div>
        ),
      },
      {
        header: "Student Name",
        className: "px-4 py-6 text-sm font-bold text-foreground text-left",
        render: (apt) => (
          <>
            {apt.user?.firstName}{" "}
            {apt.user?.middleName?.[0] ? `${apt.user?.middleName?.[0]}. ` : ""}
            {apt.user?.lastName}
          </>
        ),
      },
      {
        header: "Time",
        className:
          "whitespace-nowrap px-6 py-6 text-xs font-bold " +
          "text-foreground/80 text-left",
        render: (apt) => format12HourTime(apt.timeSlot?.time || ""),
      },
      {
        header: "Category",
        className: "px-4 py-4 text-foreground text-left",
        render: (apt) => (
          <div
            className={cn(
              "flex w-fit items-center gap-2 rounded-full border",
              "border-border bg-muted/20 px-2.5 py-1",
            )}
          >
            <Tag className="h-3 w-3 text-muted-foreground" />
            <span className="max-w-[140px] text-nowrap">
              {apt.appointmentCategory?.name}
            </span>
          </div>
        ),
      },
      {
        header: "Status",
        className: "px-4 py-4 text-left",
        render: (apt) => (
          <span
            className={cn(
              "inline-flex min-w-max whitespace-nowrap rounded-full " +
                "border px-3 py-1 text-[11px] font-semibold" +
                "tracking-wide",
              STATUS_COLORS[getStatusColorKey(apt.status?.name)],
            )}
          >
            {apt.status?.name}
          </span>
        ),
      },
      {
        header: "Urgency",
        className: "px-4 py-4 text-left",
        render: (apt) => <UrgencyCapsule appointment={apt} />,
      },
    ],
    [],
  );

  const renderMobileItem = (apt: Appointment) => (
    <div
      key={apt.id}
      className={cn(
        "bg-glass-bg/20 border-glass-border/20 space-y-4 rounded-3xl",
        "border p-6 shadow-sm backdrop-blur-md transition-all",
        "duration-300 active:scale-[0.98]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex items-center gap-3 text-sm font-bold",
            "text-foreground",
          )}
        >
          <div
            className={cn(
              "rounded-xl border border-primary/20",
              "bg-primary/10 p-2",
            )}
          >
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="tracking-tight">
            {apt.user?.firstName} {apt.user?.lastName}
          </span>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge
            variant="outline"
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1 " +
                "text-[9px] font-bold tracking-wide shadow-sm",
              STATUS_COLORS[getStatusColorKey(apt.status?.name)],
            )}
          >
            {apt.status?.name}
          </Badge>
          <UrgencyCapsule appointment={apt} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-[10px] font-bold">
        <div
          className={cn(
            "border-glass-border/10 flex items-center gap-2 rounded-xl",
            "border bg-muted/20 px-3 py-2 text-muted-foreground/80",
          )}
        >
          <CalendarDays className="h-3.5 w-3.5 text-primary/60" />
          <span>{formatDate(apt.whenDate || "")}</span>
        </div>

        <div
          className={cn(
            "border-glass-border/10 flex items-center gap-2 rounded-xl",
            "border bg-muted/20 px-3 py-2 text-muted-foreground/80",
          )}
        >
          <Clock className="h-3.5 w-3.5 text-primary/60" />
          <span>{format12HourTime(apt.timeSlot?.time || "")}</span>
        </div>
      </div>

      <div
        className={cn(
          "border-glass-border/10 flex items-center gap-3 rounded-2xl",
          "border bg-muted/20 px-4 py-3",
        )}
      >
        <Tag className="h-4 w-4 text-primary/60" />
        <span
          className={cn(
            "text-[10px] font-bold tracking-wide",
            "text-foreground/70",
          )}
        >
          {apt.appointmentCategory?.name}
        </span>
      </div>

      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewClick(apt)}
          className={cn(
            "h-11 w-full gap-2 rounded-2xl border-primary/20 bg-primary/5",
            "text-[10px] font-bold tracking-wide text-primary",
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          Access Interface
        </Button>
      </div>
    </div>
  );

  const emptyState = (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-6",
        "px-6 py-24 text-center",
      )}
    >
      <div
        className={cn(
          "border-glass-border/40 animate-pulse rounded-full border",
          "border-dashed bg-muted/20 p-6",
        )}
      >
        <CalendarX className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl tracking-tight text-foreground/80">
          Inbox Empty
        </h3>
        <p
          className={cn(
            "text-xs font-semibold leading-relaxed tracking-wide",
            "text-muted-foreground opacity-70",
          )}
        >
          No active records match the current telemetry filters.
        </p>
      </div>
    </div>
  );

  const renderDesktopSkeleton = () => (
    <table
      className={cn(
        "w-full border-separate border-spacing-y-3 text-sm",
        "px-3 py-3",
      )}
    >
      <thead
        className={cn(
          "text-[10px] font-bold text-muted-foreground",
          "opacity-60",
        )}
      >
        <tr>
          <th className="py-4 pl-6 pr-2 text-left">Date</th>
          <th className="px-4 py-4 text-left">Student Name</th>
          <th className="px-6 py-4 text-left">Time</th>
          <th className="px-4 py-4 text-left">Category</th>
          <th className="px-4 py-4 text-left">Status</th>
          <th className="px-4 py-4 text-left">Urgency</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, idx) => (
          <tr
            key={idx}
            className="animate-pulse"
          >
            <td className="rounded-l-[20px] py-4 pl-6 pr-2">
              <Skeleton className="h-12 w-12 rounded-xl" />
            </td>
            <td className="px-4 py-6">
              <Skeleton className="h-4 w-32 rounded" />
            </td>
            <td className="px-6 py-6">
              <Skeleton className="h-4 w-16 rounded" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="h-6 w-24 rounded-full" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="h-6 w-20 rounded-full" />
            </td>
            <td className="rounded-r-[20px] px-4 py-4">
              <Skeleton className="h-6 w-24 rounded-full" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderMobileSkeleton = () => (
    <>
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "bg-glass-bg/20 border-glass-border/20 space-y-4",
            "animate-pulse rounded-3xl border p-6 shadow-sm",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <Skeleton className="h-5 w-28 rounded" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-8 w-full rounded-xl" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
      ))}
    </>
  );

  return (
    <Card
      className={`bg-glass-bg/40 hover:bg-glass-bg/50 dark:bg-glass-bg/20 flex flex-col overflow-hidden border-glass-border shadow-md backdrop-blur-2xl transition-all duration-500 lg:col-span-3 ${className || ""}`}
    >
      <CardHeader className="border-glass-border/30 space-y-6 border-b bg-muted/10 px-8 py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5 text-left">
            <h2 className="text-xl font-bold text-foreground/90">{title}</h2>
          </div>

          {!isLoading && appointments.length > 0 && (
            <div
              className={cn(
                "self-start rounded-full border border-primary/20",
                "bg-primary/10 px-4 py-1.5 text-[10px] font-bold tracking-wide",
                "text-primary shadow-sm",
              )}
            >
              {appointments.length} Total Record
              {appointments.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row">
          <SearchInput
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            placeholder="Search student identity..."
            className="border-glass-border/40 focus:bg-glass-bg/60 w-full rounded-2xl"
            hasHeader={false}
          />

          <div className="w-full sm:w-64">
            <Dropdown
              options={dropdownOptions}
              value={selectedStatus?.id}
              onChange={(val) => {
                const status = statuses.find((s) => s.id === val);
                if (status) onStatusChange(status);
              }}
              labelKey="displayName"
              enabled={!isLoading}
              formStyle={false}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Table
          data={appointments}
          columns={columns}
          renderMobileItem={renderMobileItem}
          isLoading={isLoading}
          emptyState={emptyState}
          renderDesktopSkeleton={renderDesktopSkeleton}
          renderMobileSkeleton={renderMobileSkeleton}
          containerClassName="px-3 py-3"
          onRowClick={onViewClick}
        />
      </CardContent>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </Card>
  );
}

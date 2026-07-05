import { MouseEvent, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarX,
  Eye,
  EyeOff,
  RotateCcw,
  User,
} from "lucide-react";

import { Pagination, Table, Column } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { cn } from "@/lib/utils";
import { format12HourTime } from "@/utils/dateTime";
import { Dropdown, SearchInput } from "@/components/form";

import { Appointment, AppointmentStatus, StatusCount } from "../types";

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

function formatCompactDate(value?: string) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getAppointmentStudentName(apt: Appointment) {
  return [
    apt.user?.firstName,
    apt.user?.middleName?.[0] ? `${apt.user.middleName[0]}.` : "",
    apt.user?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function UrgencyCapsule({ appointment }: { appointment: Appointment }) {
  const urgency = getUrgencyValue(appointment);
  if (!urgency?.label) return <span className="text-muted-foreground">—</span>;

  const level = urgency.key.toLowerCase();
  const tone = level.includes("critical")
    ? "border-red-700/25 bg-red-700/10 text-red-700 dark:text-red-300"
    : level.includes("high") || level.includes("urgent")
      ? "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-300"
      : level.includes("medium") || level.includes("moderate")
        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
        : level.includes("low")
          ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-primary/20 bg-primary/10 text-primary";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-xl border",
        "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        tone,
      )}
      title={`Urgency level: ${urgency.label}`}
    >
      {urgency.label}
    </span>
  );
}

type SortOrder = "asc" | "desc";

type SortOption = {
  id: string;
  name: string;
};

type OrderOption = {
  id: SortOrder;
  name: string;
};

interface AppointmentListProps {
  title?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statuses: AppointmentStatus[];
  selectedStatus: AppointmentStatus;
  statusCounts: StatusCount[];
  onStatusChange: (status: AppointmentStatus) => void;
  sortOptions?: SortOption[];
  selectedSort?: string;
  onSortChange?: (sortValue: string) => void;
  orderOptions?: OrderOption[];
  selectedOrder?: SortOrder;
  onOrderChange?: (orderValue: SortOrder) => void;
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
  searchTerm = "",
  onSearchChange,
  statuses,
  selectedStatus,
  statusCounts,
  onStatusChange,
  sortOptions = [],
  selectedSort,
  onSortChange,
  orderOptions = [],
  selectedOrder,
  onOrderChange,
  appointments,
  isLoading,
  onViewClick,
  currentPage,
  onPageChange,
  totalPages,
  className,
}: AppointmentListProps) {

  const [hiddenAppointmentIds, setHiddenAppointmentIds] = useState<Set<string>>(() => new Set());
  
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");

  const sortKeyName = useMemo(() => sortOptions?.find(o => /name|student/i.test(o.id) || /name|student/i.test(o.name))?.id || "studentName", [sortOptions]);
  const sortKeyRequested = useMemo(() => sortOptions?.find(o => /created|request/i.test(o.id) || /created|request/i.test(o.name))?.id || "createdAt", [sortOptions]);
  const sortKeyAppointment = useMemo(() => sortOptions?.find(o => /nearest|when|appoint/i.test(o.id) || /nearest|when|appoint/i.test(o.name))?.id || "nearestAppointment", [sortOptions]);

  const statMap = useMemo(() => {
    const map: Record<number, StatusCount> = {};
    statusCounts.forEach((status) => {
      map[status.id] = status;
    });
    return map;
  }, [statusCounts]);

  const dropdownOptions = useMemo(() => {
    return statuses.map((status) => ({
      ...status,
      displayName:
        status.id === 0
          ? "All Statuses"
          : `${status.name} (${statMap[status.id]?.count || 0})`,
    }));
  }, [statuses, statMap]);

  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    appointments.forEach((a) => {
      if (a.appointmentCategory?.name) cats.add(a.appointmentCategory.name);
    });
    return [
      { id: "all", displayName: "All Categories" },
      ...Array.from(cats).sort().map((c) => ({ id: c, displayName: c })),
    ];
  }, [appointments]);

  const urgencyOptions = useMemo(() => {
    const urgs = new Set<string>();
    appointments.forEach((a) => {
      const u = getUrgencyValue(a)?.label;
      if (u) urgs.add(u);
    });
    return [
      { id: "all", displayName: "All Urgencies" },
      ...Array.from(urgs).sort().map((u) => ({ id: u, displayName: u })),
    ];
  }, [appointments]);

  const visibleAppointments = useMemo(() => {
    let filtered = appointments.filter((appointment) => {
      if (hiddenAppointmentIds.has(String(appointment.id))) return false;

      const matchesCat = selectedCategory === "all" || appointment.appointmentCategory?.name === selectedCategory;
      const matchesUrg = selectedUrgency === "all" || getUrgencyValue(appointment)?.label === selectedUrgency;

      return matchesCat && matchesUrg;
    });

    filtered.sort((a, b) => {
      if (selectedSort === sortKeyName) {
        const left = getAppointmentStudentName(a).toLowerCase();
        const right = getAppointmentStudentName(b).toLowerCase();
        const res = left.localeCompare(right);
        return selectedOrder === "asc" ? res : -res;
      } else if (selectedSort === sortKeyRequested) {
        const left = new Date(a.createdAt || 0).getTime();
        const right = new Date(b.createdAt || 0).getTime();
        return selectedOrder === "asc" ? left - right : right - left;
      } else if (selectedSort === sortKeyAppointment) {
        const left = new Date(a.whenDate || 0).getTime();
        const right = new Date(b.whenDate || 0).getTime();
        return selectedOrder === "asc" ? left - right : right - left;
      }
      return 0;
    });

    return filtered;
  }, [appointments, hiddenAppointmentIds, selectedCategory, selectedUrgency, selectedSort, selectedOrder, sortKeyName, sortKeyRequested, sortKeyAppointment]);

  const hiddenCount = appointments.length - visibleAppointments.length;

  const handleSearchChange = (value: string) => {
    onSearchChange?.(value);
    onPageChange(1);
  };

  const hideAppointment = (appointment: Appointment, event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    setHiddenAppointmentIds((previous) => {
      const next = new Set(previous);
      next.add(String(appointment.id));
      return next;
    });
  };

  const restoreHiddenAppointments = () => {
    setHiddenAppointmentIds(new Set());
  };

  const handleViewClick = (appointment: Appointment, event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    onViewClick(appointment);
  };

const renderSortableHeader = (label: string, sortKey: string) => {
  const isActive = selectedSort === sortKey;
  const Icon =
    isActive && selectedOrder === "desc" ? ArrowDown : ArrowUp;

  return (
    <button
      type="button"
      onClick={() => {
        onSortChange?.(sortKey);
        onOrderChange?.(
          isActive && selectedOrder === "asc" ? "desc" : "asc"
        );
        onPageChange(1);
      }}
      className={cn(
        "inline-flex items-center gap-2",
        "text-left",
        "text-[11px] font-bold uppercase tracking-[0.14em]",
        "transition-colors",
        isActive
          ? "text-[#800000]"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span>{label}</span>

      <Icon
        className={cn(
          "h-3.5 w-3.5 flex-shrink-0",
          isActive ? "opacity-100" : "opacity-40"
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />
    </button>
  );
};

  const columns = useMemo<Column<Appointment>[]>(
    () => [
          {
        header: (
          <div className="flex items-center px-3 py-3">
             {renderSortableHeader("Student Name", sortKeyName)}
          </div>
        ),
        className: "min-w-[220px] p-0", // p-0 is critical here
        render: (apt) => (
          <div className="px-3 py-3 space-y-0.5">
            <p className="font-semibold text-foreground">
              {getAppointmentStudentName(apt) || "Unnamed Student"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {apt.studentNumber || apt.user?.email || "Student record"}
            </p>
          </div>
        ),
      },
      {
        header: (
          <div className="flex items-center px-3 py-3">
            {renderSortableHeader("Date Requested", sortKeyRequested)}
          </div>
        ),
        className: "min-w-[155px] p-0",
        render: (apt) => (
          <div className="px-3 py-3 space-y-0.5">
            <p className="whitespace-nowrap text-sm font-semibold text-foreground">
              {formatCompactDate(apt.createdAt)}
            </p>
            <p className="text-[11px] text-muted-foreground">Request submitted</p>
          </div>
        ),
      },
      {
        header: (
          <div className="flex items-center px-3 py-3">
            {renderSortableHeader("Appointment Date", sortKeyAppointment)}
          </div>
        ),
        className: "min-w-[165px] p-0",
        render: (apt) => (
          <div className="px-3 py-3 space-y-0.5">
            <p className="whitespace-nowrap text-sm font-semibold text-foreground">
              {formatCompactDate(apt.whenDate)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {format12HourTime(apt.timeSlot?.time || "") || "No time"}
            </p>
          </div>
        ),
      },
      {
        header: (
          <Dropdown
            label=""
            options={categoryOptions}
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val ? String(val) : "all")} 
            labelKey="displayName"
            buttonClassName={cn(
              "h-auto w-full justify-between border-0 bg-transparent px-0 py-0 shadow-none outline-none hover:bg-transparent focus:border-0 focus:ring-0",
              "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
              selectedCategory === "all" ? "text-muted-foreground hover:text-foreground" : "text-[#800000]"
            )}
          />
        ),
        className: "min-w-[160px]",
        render: (apt) => (
          <span
            className={cn(
              "inline-flex max-w-[170px] items-center rounded-xl border",
              "border-border/70 bg-muted/30 px-2.5 py-1 text-xs font-medium",
              "text-foreground backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]",
            )}
          >
            <span className="truncate">{apt.appointmentCategory?.name}</span>
          </span>
        ),
      },
      {
        header: (
          <Dropdown
            label=""
            options={dropdownOptions}
            value={selectedStatus?.id}
            onChange={(val) => {
              if (!val || String(val) === "all" || String(val) === "0") {
                // Fixed double-click bug for status prop
                const allStatus = statuses.find((s) => s.id === 0) || { id: 0, name: "All Statuses" } as AppointmentStatus;
                onStatusChange(allStatus);
                onPageChange(1);
                return;
              }
              const status = statuses.find((s) => String(s.id) === String(val));
              if (status) {
                onStatusChange(status);
                onPageChange(1);
              }
            }}
            labelKey="displayName"
            buttonClassName={cn(
              "h-auto w-full justify-between border-0 bg-transparent px-0 py-0 shadow-none outline-none hover:bg-transparent focus:border-0 focus:ring-0",
              "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
              selectedStatus?.id === 0 ? "text-muted-foreground hover:text-foreground" : "text-[#800000]"
            )}
          />
        ),
        className: "min-w-[130px]",
        render: (apt) => (
          <span
            className={cn(
              "inline-flex min-w-max whitespace-nowrap rounded-xl border",
              "px-2.5 py-1 text-[11px] font-semibold tracking-wide",
              STATUS_COLORS[getStatusColorKey(apt.status?.name)],
            )}
          >
            {apt.status?.name}
          </span>
        ),
      },
      {
        header: (
          <Dropdown
            label=""
            options={urgencyOptions}
            value={selectedUrgency}
            onChange={(val) => setSelectedUrgency(val ? String(val) : "all")} 
            labelKey="displayName"
            buttonClassName={cn(
              "h-auto w-full justify-between border-0 bg-transparent px-0 py-0 shadow-none outline-none hover:bg-transparent focus:border-0 focus:ring-0",
              "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
              selectedUrgency === "all" ? "text-muted-foreground hover:text-foreground" : "text-[#800000]"
            )}
          />
        ),
        className: "min-w-[110px]",
        render: (apt) => <UrgencyCapsule appointment={apt} />,
      },
    ],
    [
      selectedSort,
      selectedOrder,
      selectedStatus,
      selectedCategory,
      selectedUrgency,
      dropdownOptions,
      categoryOptions,
      urgencyOptions,
      statuses,
      sortKeyName,
      sortKeyRequested,
      sortKeyAppointment,
      onSortChange,
      onOrderChange,
      onPageChange,
      onStatusChange,
    ],
  );

  const renderMobileItem = (apt: Appointment) => (
    <div
      key={apt.id}
      className={cn(
        "space-y-3 rounded-xl border border-border/70 bg-card p-4",
        "shadow-md backdrop-blur-xl transition-all duration-200 active:scale-[0.98]",
        "dark:border-white/10 dark:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4 text-primary" />
            <span className="truncate">
              {getAppointmentStudentName(apt) || "Unnamed Student"}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {apt.appointmentCategory?.name}
          </p>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "shrink-0 whitespace-nowrap rounded-xl border px-2.5 py-1",
            "text-[10px] font-bold tracking-wide shadow-md",
            STATUS_COLORS[getStatusColorKey(apt.status?.name)],
          )}
        >
          {apt.status?.name}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 dark:border-white/10 dark:bg-white/[0.035]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Date Requested
          </p>
          <p className="mt-0.5 font-semibold text-foreground">
            {formatCompactDate(apt.createdAt)}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 dark:border-white/10 dark:bg-white/[0.035]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Appointment Date
          </p>
          <p className="mt-0.5 font-semibold text-foreground">
            {formatCompactDate(apt.whenDate)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {format12HourTime(apt.timeSlot?.time || "") || "No time"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <UrgencyCapsule appointment={apt} />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(event) => hideAppointment(apt, event)}
            className="h-8 gap-1.5 rounded-xl px-3 text-[11px] font-semibold text-muted-foreground"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Hide
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => handleViewClick(apt, event)}
            className={cn(
              "h-8 gap-1.5 rounded-xl border-primary/20 bg-primary/5",
              "px-3 text-[11px] font-semibold text-primary",
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
        </div>
      </div>
    </div>
  );

  const emptyState = (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-5",
        "px-6 py-16 text-center",
      )}
    >
      <div
        className={cn(
          "rounded-xl border border-dashed border-border/70",
          "bg-muted/40 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]",
        )}
      >
        <CalendarX className="h-9 w-9 text-muted-foreground/50" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight text-foreground/80">
          No appointments found
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {hiddenCount > 0
            ? "All rows on this page are hidden. Restore hidden rows to show them again."
            : "No active records match the current filters."}
        </p>

        {(selectedCategory !== "all" || selectedStatus?.id !== 0 || selectedUrgency !== "all") && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedUrgency("all");
                const allStatus = statuses.find((s) => s.id === 0) || { id: 0, name: "All Statuses" } as AppointmentStatus;
                onStatusChange(allStatus);
                onPageChange(1);
              }}
              className="rounded-xl shadow-md"
            >
              Show all records
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderDesktopSkeleton = () => (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border/70 text-muted-foreground dark:border-white/10">
          {columns.map((column, index) => (
            <th
              key={index}
              className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em]"
            >
              {typeof column.header === 'string' ? column.header : <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <tr
            key={rowIndex}
            className="animate-pulse border-b border-border/60 dark:border-white/10"
          >
            {columns.map((_, columnIndex) => (
              <td key={columnIndex} className="px-4 py-3">
                <Skeleton className="h-4 w-24 rounded" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderMobileSkeleton = () => (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "animate-pulse rounded-xl border border-border/70",
            "bg-card p-4 shadow-md backdrop-blur-xl",
            "dark:border-white/10 dark:bg-white/[0.035]",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-6 w-16 rounded-xl" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className={cn("flex flex-col space-y-6", className)}>
      <div className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-950/40">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 text-left">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Student details, date requested, and appointment date are shown in one compact table.
            </p>
          </div>

          {!isLoading && appointments.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <div
                className={cn(
                  "self-start rounded-xl border border-primary/20",
                  "bg-primary/10 px-3 py-1 text-[11px] font-semibold",
                  "text-primary shadow-md",
                )}
              >
                {visibleAppointments.length} visible / {appointments.length} total
              </div>

              {hiddenCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={restoreHiddenAppointments}
                  className="h-8 rounded-xl px-3 text-[11px] font-semibold shadow-md"
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Restore {hiddenCount}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-1 flex-col gap-1.5 w-full md:max-w-[240px] lg:max-w-sm">
            <label
              className={cn(
                "text-sm font-medium",
                "text-neutral-700 dark:text-neutral-300",
              )}
            >
              Search
            </label>
            <SearchInput
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              placeholder="Search by name, email, or student number..."
              hasHeader={false}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950/40">
        <Table
          data={visibleAppointments}
          columns={columns}
          renderMobileItem={renderMobileItem}
          isLoading={isLoading}
          emptyState={emptyState}
          renderDesktopSkeleton={renderDesktopSkeleton}
          renderMobileSkeleton={renderMobileSkeleton}
          containerClassName="px-3 py-3"
          onRowClick={onViewClick}
        />
        <div className="border-t border-border/50 bg-slate-50/50 dark:bg-transparent">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
}
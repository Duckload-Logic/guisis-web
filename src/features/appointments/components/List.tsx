import { MouseEvent, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarX,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  User,
  X,
} from "lucide-react";

import { Pagination, Table, Column } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { cn } from "@/lib/utils";
import { format12HourTime } from "@/utils/dateTime";
import { Dropdown } from "@/components/form";
import { Input } from "@/components/ui/input";

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
  const [hiddenAppointmentIds, setHiddenAppointmentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const visibleAppointments = useMemo(
    () => appointments.filter((appointment) => !hiddenAppointmentIds.has(String(appointment.id))),
    [appointments, hiddenAppointmentIds],
  );

  const hiddenCount = appointments.length - visibleAppointments.length;
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

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSortingByStudentName = selectedSort === "studentName";
  const nextNameSortOrder: SortOrder =
    isSortingByStudentName && selectedOrder === "asc" ? "desc" : "asc";
  const SortArrow = nextNameSortOrder === "asc" ? ArrowUp : ArrowDown;

  const handleSearchChange = (value: string) => {
    onSearchChange?.(value);
    onPageChange(1);
  };

  const handleClearSearch = () => {
    handleSearchChange("");
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const handleStatusChange = (status: AppointmentStatus) => {
    onStatusChange(status);
    onPageChange(1);
  };

  const handleRequiredSortChange = (value: unknown) => {
    const nextValue = String(value ?? "").trim();

    if (!nextValue) {
      return;
    }

    const isValidSortOption = sortOptions.some(
      (option) => String(option.id) === nextValue,
    );

    if (!isValidSortOption) {
      return;
    }

    onSortChange?.(nextValue);
    onPageChange(1);
  };

  const handleRequiredOrderChange = (value: unknown) => {
    if (value !== "asc" && value !== "desc") {
      return;
    }

    const isValidOrderOption = orderOptions.some(
      (option) => option.id === value,
    );

    if (!isValidOrderOption) {
      return;
    }

    onOrderChange?.(value);
    onPageChange(1);
  };

  const handleNameHeaderSort = () => {
    onSortChange?.("studentName");
    onOrderChange?.(nextNameSortOrder);
    onPageChange(1);
  };

  const hideAppointment = (
    appointment: Appointment,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
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

  const handleViewClick = (
    appointment: Appointment,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();
    onViewClick(appointment);
  };

  const columns = useMemo<Column<Appointment>[]>(
    () => [
      {
        header: (
          <button
            type="button"
            onClick={handleNameHeaderSort}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-2 py-1",
              "text-[11px] font-bold uppercase tracking-[0.14em]",
              "transition hover:bg-muted/70 hover:text-foreground",
              isSortingByStudentName ? "text-primary" : "text-muted-foreground",
            )}
            title={`Sort student name ${nextNameSortOrder === "asc" ? "ascending" : "descending"}`}
          >
            Student Name
            <SortArrow className="h-3.5 w-3.5" />
          </button>
        ),
        className: "min-w-[220px]",
        render: (apt) => (
          <div className="space-y-0.5">
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
        header: "Date Requested",
        className: "min-w-[155px]",
        render: (apt) => (
          <div className="space-y-0.5">
            <p className="whitespace-nowrap text-sm font-semibold text-foreground">
              {formatCompactDate(apt.createdAt)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Request submitted
            </p>
          </div>
        ),
      },
      {
        header: "Appointment Date",
        className: "min-w-[165px]",
        render: (apt) => (
          <div className="space-y-0.5">
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
        header: "Category",
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
        header: "Status",
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
        header: "Urgency",
        className: "min-w-[110px]",
        render: (apt) => <UrgencyCapsule appointment={apt} />,
      },
      {
        header: "Actions",
        className: "min-w-[160px]",
        render: (apt) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => handleViewClick(apt, event)}
              className="h-8 rounded-xl border-primary/20 bg-primary/5 px-3 text-[11px] font-semibold text-primary"
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              View
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(event) => hideAppointment(apt, event)}
              className="h-8 rounded-xl px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <EyeOff className="mr-1 h-3.5 w-3.5" />
              Hide
            </Button>
          </div>
        ),
      },
    ],
    [isSortingByStudentName, nextNameSortOrder, onViewClick],
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
            : "No active records are available for this page."}
        </p>
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
              {column.header}
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
              <td
                key={columnIndex}
                className="px-4 py-3"
              >
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
          
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                ref={searchInputRef}
                type="text"
                value={searchTerm ?? ""}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder="Search by name, email, or student number..."
                spellCheck={false}
                autoComplete="off"
                className={cn(
                  "h-10 w-full rounded-xl bg-slate-100 pl-10 pr-10 text-sm text-foreground",
                  "border-0 shadow-none transition-colors placeholder:text-neutral-400 ",
                  "focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20",
                  "dark:bg-white/5 dark:focus-visible:bg-white/10",
                )}
              >
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm ?? ""}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Search by name, email, or student number..."
                  spellCheck={false}
                  autoComplete="off"
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm font-medium text-foreground shadow-none outline-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
                />
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onClick={handleClearSearch}
                    className={cn(
                      "h-7 min-h-7 w-7 shrink-0 rounded-xl shadow-none",
                      "text-muted-foreground hover:bg-background hover:text-foreground",
                    )}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={handleClearSearch}
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex w-full flex-col gap-1.5 sm:w-[150px]">
              <Dropdown
                label="Status"
                options={dropdownOptions}
                value={selectedStatus?.id}
                onChange={(val) => {
                  const status = statuses.find(
                    (s) => String(s.id) === String(val),
                  );
                  if (status) onStatusChange(status);
                }}
                labelKey="displayName"
                enabled={!isLoading}
                formStyle={true}
              />
            </div>

            {sortOptions.length > 0 && onSortChange && (
              <div className="flex w-full flex-col gap-1.5 sm:w-[190px]">
                <Dropdown
                  label="Sort By"
                  options={sortOptions}
                  value={selectedSort}
                  onChange={handleRequiredSortChange}
                  enabled={!isLoading}
                  formStyle={true}
                />
              </div>
            )}

            {orderOptions.length > 0 && onOrderChange && (
              <div className="flex w-full flex-col gap-1.5 sm:w-[130px]">
                <Dropdown
                  label="Order"
                  options={orderOptions}
                  value={selectedOrder}
                  onChange={handleRequiredOrderChange}
                  enabled={!isLoading}
                  formStyle={true}
                />
              </div>
            )}
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


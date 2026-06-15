import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pagination, Table, Column } from "@/components/shared";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { Appointment, AppointmentStatus, StatusCount } from "../types";
import { CalendarX, Eye, User } from "lucide-react";
import { useMemo } from "react";
import { SearchInput } from "@/components/form";
import { format12HourTime } from "@/utils/dateTime";
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

function UrgencyCapsule({ appointment }: { appointment: Appointment }) {
  const urgency = getUrgencyValue(appointment);
  if (!urgency?.label) return <span className="text-muted-foreground">—</span>;

  const level = urgency.key.toLowerCase();
  const tone =
    level.includes("critical")
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
        "inline-flex w-fit items-center rounded-full border",
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
  searchTerm,
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
  };

  const columns = useMemo<Column<Appointment>[]>(
    () => [
      {
        header: "Student Name",
        className: "min-w-[220px]",
        render: (apt) => (
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">
              {apt.user?.firstName}{" "}
              {apt.user?.middleName?.[0]
                ? `${apt.user?.middleName?.[0]}. `
                : ""}
              {apt.user?.lastName}
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
              "inline-flex max-w-[170px] items-center rounded-full border",
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
              "inline-flex min-w-max whitespace-nowrap rounded-full border",
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
    ],
    [],
  );

  const renderMobileItem = (apt: Appointment) => (
    <div
      key={apt.id}
      className={cn(
        "space-y-3 rounded-2xl border border-border/70 bg-card p-4",
        "shadow-sm backdrop-blur-xl transition-all duration-200 active:scale-[0.98]",
        "dark:border-white/10 dark:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4 text-primary" />
            <span className="truncate">
              {apt.user?.firstName} {apt.user?.lastName}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {apt.appointmentCategory?.name}
          </p>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1",
            "text-[10px] font-bold tracking-wide shadow-sm",
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

      <div className="flex items-center justify-between gap-3 pt-1">
        <UrgencyCapsule appointment={apt} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewClick(apt)}
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
          "rounded-full border border-dashed border-border/70",
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
          No active records match the current filters.
        </p>
      </div>
    </div>
  );

  const renderDesktopSkeleton = () => (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-border/70 text-muted-foreground dark:border-white/10">
          {columns.map((column) => (
            <th
              key={column.header}
              className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em]"
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, idx) => (
          <tr
            key={idx}
            className="animate-pulse border-b border-border/60 dark:border-white/10"
          >
            {columns.map((column) => (
              <td
                key={column.header}
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
      {Array.from({ length: 3 }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "animate-pulse rounded-2xl border border-border/70",
            "bg-card p-4 shadow-sm backdrop-blur-xl",
            "dark:border-white/10 dark:bg-white/[0.035]",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-6 w-16 rounded-full" />
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
    <Card
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/70",
        "bg-card shadow-md backdrop-blur-2xl transition-all duration-300",
        "dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
    >
      <CardHeader className="space-y-4 border-b border-border/70 bg-muted/20 px-5 py-4 dark:border-white/10 dark:bg-white/[0.025]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 text-left">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-xs text-muted-foreground">
              Student details, date requested, and appointment date are shown in
              one compact table.
            </p>
          </div>

          {!isLoading && appointments.length > 0 && (
            <div
              className={cn(
                "self-start rounded-full border border-primary/20",
                "bg-primary/10 px-3 py-1 text-[11px] font-semibold",
                "text-primary shadow-sm",
              )}
            >
              {appointments.length} record{appointments.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_210px_170px]">
          <SearchInput
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            placeholder="Search student..."
            className="w-full rounded-xl border-border/70 bg-background/70 backdrop-blur-xl focus-within:border-primary/50 dark:border-white/10 dark:bg-white/[0.04]"
            hasHeader={false}
          />

          <Dropdown
            label="Status"
            options={dropdownOptions}
            value={selectedStatus?.id}
            onChange={(val) => {
              const status = statuses.find((s) => String(s.id) === String(val));
              if (status) onStatusChange(status);
            }}
            labelKey="displayName"
            enabled={!isLoading}
            formStyle={false}
          />

          {sortOptions.length > 0 && onSortChange && (
            <Dropdown
              label="Sort By"
              options={sortOptions}
              value={selectedSort}
              onChange={handleRequiredSortChange}
              enabled={!isLoading}
              formStyle={false}
            />
          )}

          {orderOptions.length > 0 && onOrderChange && (
            <Dropdown
              label="Order"
              options={orderOptions}
              value={selectedOrder}
              onChange={handleRequiredOrderChange}
              enabled={!isLoading}
              formStyle={false}
            />
          )}
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

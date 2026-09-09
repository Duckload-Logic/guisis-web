import { MouseEvent, useMemo, useState, useCallback } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarX,
  Download,
  Eye,
} from "lucide-react";

import { Pagination, Table, Column } from "@/components/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { cn } from "@/lib/utils";
import { getProfilePictureUrl } from "@/lib/profilePicture";
import { format12HourTime } from "@/utils/dateTime";
import { SearchInput } from "@/components/form";
import { SelectField } from "@/components/ui/select-field";

import { Appointment, AppointmentStatus, StatusCount } from "../types";

import { exportToCSV } from "@/lib/csvExport";
import { appointmentExportColumns } from "./appointmentExportColumns";

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
    ? "border-destructive/30 bg-destructive/15 text-destructive font-bold"
    : level.includes("high") || level.includes("urgent")
      ? "border-destructive/20 bg-destructive/10 text-destructive"
      : level.includes("medium") || level.includes("moderate")
        ? STATUS_COLORS.warning
        : level.includes("low")
          ? STATUS_COLORS.success
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
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: { id: number | string; name?: string }[];
  selectedUrgency?: string;
  onUrgencyChange?: (urgency: string) => void;
  urgencies?: { id: string; name?: string }[];
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
  selectedCategory: selectedCategoryProp,
  onCategoryChange: onCategoryChangeProp,
  categories: categoriesProp,
  selectedUrgency: selectedUrgencyProp,
  onUrgencyChange: onUrgencyChangeProp,
  urgencies: urgenciesProp,
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
  const [localCategory, setLocalCategory] = useState<string>("all");
  const [localUrgency, setLocalUrgency] = useState<string>("all");

  const isServerFiltered = selectedCategoryProp !== undefined;

  const currentCategory = isServerFiltered
    ? selectedCategoryProp
    : localCategory;
  const currentUrgency = isServerFiltered ? selectedUrgencyProp : localUrgency;

  const handleCategoryChange = (val: string) => {
    if (isServerFiltered) {
      onCategoryChangeProp?.(val);
    } else {
      setLocalCategory(val);
    }
  };

  const handleUrgencyChange = (val: string) => {
    if (isServerFiltered) {
      onUrgencyChangeProp?.(val);
    } else {
      setLocalUrgency(val);
    }
  };

  const sortKeyName = useMemo(
    () =>
      sortOptions?.find(
        (o) => /name|student/i.test(o.id) || /name|student/i.test(o.name),
      )?.id || "studentName",
    [sortOptions],
  );
  const sortKeyRequested = useMemo(
    () =>
      sortOptions?.find(
        (o) => /created|request/i.test(o.id) || /created|request/i.test(o.name),
      )?.id || "createdAt",
    [sortOptions],
  );
  const sortKeyAppointment = useMemo(
    () =>
      sortOptions?.find(
        (o) =>
          /nearest|when|appoint/i.test(o.id) ||
          /nearest|when|appoint/i.test(o.name),
      )?.id || "nearestAppointment",
    [sortOptions],
  );

  const categoryOptions = useMemo(() => {
    if (isServerFiltered && categoriesProp) {
      return [
        { id: "all", displayName: "All Categories" },
        ...categoriesProp.map((c) => ({
          id: String(c.id),
          displayName: c.name || "",
        })),
      ];
    }
    const cats = new Set<string>();
    appointments.forEach((a) => {
      if (a.appointmentCategory?.name) cats.add(a.appointmentCategory.name);
    });
    return [
      { id: "all", displayName: "All Categories" },
      ...Array.from(cats)
        .sort()
        .map((c) => ({ id: c, displayName: c })),
    ];
  }, [appointments, categoriesProp, isServerFiltered]);

  const urgencyOptions = useMemo(() => {
    if (isServerFiltered && urgenciesProp) {
      return [
        { id: "all", displayName: "All Urgencies" },
        ...urgenciesProp.map((u) => ({
          id: u.id,
          displayName: u.name || "",
        })),
      ];
    }
    const urgs = new Set<string>();
    appointments.forEach((a) => {
      const u = getUrgencyValue(a)?.label;
      if (u) urgs.add(u);
    });
    return [
      { id: "all", displayName: "All Urgencies" },
      ...Array.from(urgs)
        .sort()
        .map((u) => ({ id: u, displayName: u })),
    ];
  }, [appointments, urgenciesProp, isServerFiltered]);

  const baseFilteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      if (isServerFiltered) return true;

      const matchesCat =
        currentCategory === "all" ||
        appointment.appointmentCategory?.name === currentCategory;
      const matchesUrg =
        currentUrgency === "all" ||
        getUrgencyValue(appointment)?.label === currentUrgency;

      return matchesCat && matchesUrg;
    });
  }, [
    appointments,
    currentCategory,
    currentUrgency,
    isServerFiltered,
  ]);

  const dynamicStatMap = useMemo(() => {
    const map: Record<number, number> = {};

    statuses.forEach((status) => {
      if (status.id !== 0) map[status.id] = 0;
    });

    baseFilteredAppointments.forEach((apt) => {
      if (apt.status?.id) {
        map[apt.status.id] = (map[apt.status.id] || 0) + 1;
      }
    });

    return map;
  }, [baseFilteredAppointments, statuses]);

  const dropdownOptions = useMemo(() => {
    return statuses.map((status) => {
      const serverCountObj = statusCounts?.find((sc) => sc.id === status.id);
      const count = serverCountObj
        ? serverCountObj.count
        : dynamicStatMap[status.id] || 0;
      return {
        ...status,
        displayName:
          status.id === 0 ? "All Statuses" : `${status.name} (${count})`,
      };
    });
  }, [statuses, statusCounts, dynamicStatMap]);

  const visibleAppointments = useMemo(() => {
    let filtered = baseFilteredAppointments.filter((appointment) => {
      if (!selectedStatus || selectedStatus.id === 0) return true;
      return appointment.status?.id === selectedStatus.id;
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
  }, [
    baseFilteredAppointments,
    selectedStatus,
    selectedSort,
    selectedOrder,
    sortKeyName,
    sortKeyRequested,
    sortKeyAppointment,
  ]);

  const handleSearchChange = (value: string) => {
    onSearchChange?.(value);
    onPageChange(1);
  };

  const handleViewClick = (
    appointment: Appointment,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();
    onViewClick(appointment);
  };

  const renderSortableHeader = useCallback(
    (label: string, sortKey: string) => {
      const isActive = selectedSort === sortKey;

      return (
        <button
          type="button"
          onClick={() => {
            onSortChange?.(sortKey);
            onOrderChange?.(
              isActive && selectedOrder === "asc" ? "desc" : "asc",
            );
            onPageChange(1);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap outline-none",
            "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
            isActive
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span>{label}</span>
          {isActive &&
            (selectedOrder === "desc" ? (
              <ArrowDown
                className="h-3 w-3 shrink-0"
                strokeWidth={2.5}
              />
            ) : (
              <ArrowUp
                className="h-3 w-3 shrink-0"
                strokeWidth={2.5}
              />
            ))}
        </button>
      );
    },
    [selectedSort, selectedOrder, onSortChange, onOrderChange, onPageChange],
  );

  const columns = useMemo<Column<Appointment>[]>(
    () => [
      {
        header: (
          <div className="flex items-center px-3 py-3">
            {renderSortableHeader("Student Name", sortKeyName)}
          </div>
        ),
        className: "min-w-[220px] p-0",
        render: (apt) => {
          const studentName =
            getAppointmentStudentName(apt) || "Unnamed Student";
          const initials =
            `${apt.user?.firstName?.[0] || ""}${apt.user?.lastName?.[0] || ""}`.toUpperCase() ||
            "ST";
          const picUrl = getProfilePictureUrl(apt.user?.profilePicture);

          return (
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar className="h-9 w-9 shrink-0 rounded-xl border border-primary/20">
                {picUrl ? (
                  <AvatarImage
                    src={picUrl}
                    alt={studentName}
                    className="object-cover"
                  />
                ) : null}
                <AvatarFallback
                  className={cn(
                    "rounded-xl bg-primary/10 text-xs font-bold",
                    "text-primary",
                  )}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-0.5">
                <p className="truncate font-semibold text-foreground">
                  {studentName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {apt.studentNumber || apt.user?.email || "Student record"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        header: (
          <div className="flex items-center px-3 py-3">
            {renderSortableHeader("Date Requested", sortKeyRequested)}
          </div>
        ),
        className: "min-w-[155px] p-0",
        render: (apt) => (
          <div className="space-y-0.5 px-3 py-3">
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
        header: (
          <div className="flex items-center px-3 py-3">
            {renderSortableHeader("Appointment Date", sortKeyAppointment)}
          </div>
        ),
        className: "min-w-[165px] p-0",
        render: (apt) => (
          <div className="space-y-0.5 px-3 py-3">
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
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.14em]",
              "text-muted-foreground",
            )}
          >
            Category
          </span>
        ),
        className: "min-w-[160px] px-3 py-3",
        render: (apt) => (
          <span
            className={cn(
              "inline-flex max-w-[170px] items-center rounded-xl border",
              "border-border/70 bg-muted/30 px-2.5 py-1 text-xs font-medium",
              "text-foreground backdrop-blur-md",
            )}
          >
            <span className="truncate">{apt.appointmentCategory?.name}</span>
          </span>
        ),
      },
      {
        header: (
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.14em]",
              "text-muted-foreground",
            )}
          >
            Status
          </span>
        ),
        className: "min-w-[130px] px-3 py-3",
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
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.14em]",
              "text-muted-foreground",
            )}
          >
            Urgency
          </span>
        ),
        className: "min-w-[110px] px-3 py-3",
        render: (apt) => <UrgencyCapsule appointment={apt} />,
      },
      {
        header: (
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.14em]",
              "text-muted-foreground",
            )}
          >
            Action
          </span>
        ),
        className: "min-w-[100px] px-3 py-3 text-right",
        render: (apt) => (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => handleViewClick(apt, event)}
              className={cn(
                "h-8 min-h-[32px] gap-1.5 rounded-xl border-primary/20",
                "bg-primary/10 px-3 text-[11px] font-bold uppercase",
                "text-primary shadow-xs transition-all",
                "hover:bg-primary hover:text-white active:scale-95",
              )}
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Button>
          </div>
        ),
      },
    ],
    [
      selectedSort,
      selectedOrder,
      selectedStatus,
      currentCategory,
      currentUrgency,
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
      handleCategoryChange,
      handleUrgencyChange,
      isLoading,
      renderSortableHeader,
      onStatusChange,
    ],
  );

  const renderMobileItem = (apt: Appointment) => (
    <div
      key={apt.id}
      className={cn(
        "space-y-3 rounded-xl border border-border bg-card p-4",
        "shadow-md backdrop-blur-xl transition-all duration-200",
        "active:scale-[0.98]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="h-9 w-9 shrink-0 rounded-xl border border-primary/20">
            {getProfilePictureUrl(apt.user?.profilePicture) ? (
              <AvatarImage
                src={getProfilePictureUrl(apt.user?.profilePicture)}
                alt={getAppointmentStudentName(apt) || "Student"}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback
              className={cn(
                "rounded-xl bg-primary/10 text-xs font-bold text-primary",
              )}
            >
              {`${apt.user?.firstName?.[0] || ""}${
                apt.user?.lastName?.[0] || ""
              }`.toUpperCase() || "ST"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {getAppointmentStudentName(apt) || "Unnamed Student"}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {apt.appointmentCategory?.name}
            </p>
          </div>
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
        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Date Requested
          </p>
          <p className="mt-0.5 font-semibold text-foreground">
            {formatCompactDate(apt.createdAt)}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
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
          "rounded-xl border border-dashed border-border",
          "bg-muted/40 p-5 backdrop-blur-xl",
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

        {(currentCategory !== "all" ||
          selectedStatus?.id !== 0 ||
          currentUrgency !== "all") && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleCategoryChange("all");
                handleUrgencyChange("all");
                const allStatus =
                  statuses.find((s) => s.id === 0) ||
                  ({ id: 0, name: "All Statuses" } as AppointmentStatus);
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
        <tr className="border-b border-border/70 text-muted-foreground">
          {columns.map((column, index) => (
            <th
              key={index}
              className={cn(
                "px-3 py-3 text-left text-[11px] font-bold uppercase",
                "tracking-[0.14em]",
                column.className,
              )}
            >
              {typeof column.header === "string" ? (
                column.header
              ) : (
                <div className="h-4 w-20 animate-pulse rounded bg-muted/50" />
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }).map((_, rowIndex) => (
          <tr
            key={rowIndex}
            className="animate-pulse border-b border-border/60"
          >
            {/* Student Name */}
            <td className="min-w-[220px] px-3 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
            </td>
            {/* Date Requested */}
            <td className="min-w-[155px] px-3 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            </td>
            {/* Appointment Date */}
            <td className="min-w-[165px] px-3 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </td>
            {/* Category */}
            <td className="min-w-[160px] px-3 py-3">
              <Skeleton className="h-6 w-28 rounded-xl" />
            </td>
            {/* Status */}
            <td className="min-w-[130px] px-3 py-3">
              <Skeleton className="h-6 w-20 rounded-xl" />
            </td>
            {/* Urgency */}
            <td className="min-w-[110px] px-3 py-3">
              <Skeleton className="h-6 w-16 rounded-xl" />
            </td>
            {/* Action */}
            <td className="min-w-[100px] px-3 py-3 text-right">
              <div className="flex justify-end">
                <Skeleton className="h-7 w-16 rounded-xl" />
              </div>
            </td>
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
            "animate-pulse rounded-xl border border-border",
            "bg-card p-4 shadow-md backdrop-blur-xl",
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
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 text-left">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Student details, date requested, and appointment date are shown in
              one compact table.
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
                {visibleAppointments.length} / {appointments.length} total
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {/* Top Row: Search + Export CSV */}
          <div
            className={cn(
              "flex flex-col gap-2.5 sm:flex-row sm:items-center",
              "sm:justify-between",
            )}
          >
            <div className="w-full sm:max-w-md">
              <SearchInput
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
                placeholder="Search name, email, or student number..."
                hasHeader={false}
              />
            </div>

            {!isLoading && appointments.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  exportToCSV(
                    visibleAppointments,
                    appointmentExportColumns,
                    "appointments",
                  )
                }
                disabled={visibleAppointments.length === 0}
                className={cn(
                  "h-9 gap-1.5 rounded-xl border-border/70 bg-card px-3",
                  "text-xs font-semibold shadow-xs transition-all",
                  "hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Bottom Row: Quick Status Pills + Selectors + Clear */}
          <div
            className={cn(
              "flex flex-col gap-2.5 border-t border-border/50 pt-3",
              "lg:flex-row lg:items-center lg:justify-between",
            )}
          >
            {/* Status Pills */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-1.5 overflow-x-auto",
                "py-0.5",
              )}
            >
              {isLoading && dropdownOptions.length === 0
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-8 w-24 rounded-xl"
                    />
                  ))
                : dropdownOptions.map((status) => {
                const isSelected = selectedStatus?.id === status.id;
                const serverCountObj = statusCounts?.find(
                  (sc) => sc.id === status.id,
                );
                const count = serverCountObj
                  ? serverCountObj.count
                  : dynamicStatMap[status.id] || 0;

                return (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => {
                      if (status.id === 0) {
                        const allStatus = statuses.find((s) => s.id === 0) || {
                          id: 0,
                          name: "All Statuses",
                        };
                        onStatusChange(allStatus as AppointmentStatus);
                      } else {
                        onStatusChange(status);
                      }
                      onPageChange(1);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5",
                      "select-none text-xs font-semibold transition-all",
                      isSelected
                        ? "border border-primary/40 bg-primary/10 " +
                            "text-primary shadow-sm"
                        : "border border-border/70 bg-card " +
                            "text-muted-foreground hover:bg-muted/60" +
                            "hover:text-foreground",
                    )}
                  >
                    <span>{status.name}</span>
                    {status.id !== 0 && (
                      <Badge
                        variant={isSelected ? "default" : "secondary"}
                        className={cn(
                          "h-4 min-w-4 rounded-full px-1 text-[10px]",
                          isSelected && "bg-primary text-primary-foreground",
                        )}
                      >
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Secondary Selectors (Category, Urgency) + Clear */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-[145px]">
                <SelectField
                  label=""
                  options={categoryOptions}
                  value={currentCategory}
                  onChange={(val) =>
                    handleCategoryChange(val ? String(val) : "all")
                  }
                  labelKey="displayName"
                  enabled={!isLoading}
                  buttonClassName={cn(
                    "!h-8 !min-h-0 !py-1 !px-2.5 text-xs font-semibold",
                    "rounded-xl border-border/70 bg-card hover:bg-muted/40",
                    "shadow-none",
                    currentCategory !== "all" && "border-primary text-primary",
                  )}
                />
              </div>

              <div className="w-[130px]">
                <SelectField
                  label=""
                  options={urgencyOptions}
                  value={currentUrgency}
                  onChange={(val) =>
                    handleUrgencyChange(val ? String(val) : "all")
                  }
                  labelKey="displayName"
                  enabled={!isLoading}
                  buttonClassName={cn(
                    "!h-8 !min-h-0 !py-1 !px-2.5 text-xs font-semibold",
                    "rounded-xl border-border/70 bg-card hover:bg-muted/40",
                    "shadow-none",
                    currentUrgency !== "all" && "border-primary text-primary",
                  )}
                />
              </div>

              {(currentCategory !== "all" ||
                selectedStatus?.id !== 0 ||
                currentUrgency !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleCategoryChange("all");
                    const allStatus = statuses.find((s) => s.id === 0) || {
                      id: 0,
                      name: "All Statuses",
                    };
                    onStatusChange(allStatus as AppointmentStatus);
                    handleUrgencyChange("all");
                    onPageChange(1);
                  }}
                  className={cn(
                    "h-8 rounded-xl px-2 text-xs font-semibold text-muted-foreground",
                    "hover:text-foreground",
                  )}
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
        <div className="border-t border-border/50 bg-muted/20">
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

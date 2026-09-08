import { MouseEvent, useMemo, useState, useCallback } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  EyeOff,
  Inbox,
  RotateCcw,
  Tag,
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
import { formatDate } from "@/utils/dateTime";
import { SearchInput } from "@/components/form";
import { SelectField } from "@/components/ui/select-field";

import type { Slip } from "../types";
import { SlipStatus, SlipStats } from "../types";

import { exportToCSV } from "@/lib/csvExport";
import { slipExportColumns } from "./slipExportColumns";

type SortOrder = "asc" | "desc";

type SortOption = {
  id: string;
  name: string;
};

type OrderOption = {
  id: SortOrder;
  name: string;
};

interface SlipListProps {
  title?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statuses: SlipStatus[];
  selectedStatus: SlipStatus;
  statusCounts: SlipStats[];
  onStatusChange: (status: SlipStatus) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: { id: number | string; name?: string }[];
  sortOptions?: SortOption[];
  selectedSort?: string;
  onSortChange?: (sortValue: string) => void;
  orderOptions?: OrderOption[];
  selectedOrder?: SortOrder;
  onOrderChange?: (orderValue: SortOrder) => void;
  slips: Slip[];
  isLoading?: boolean;
  onViewClick: (slip: Slip) => void;
  currentPage: number;
  onPageChange: (p: number) => void;
  totalPages?: number;
  className?: string;
}

function formatCompactSlipDate(value?: string) {
  if (!value) return "—";
  return formatDate(value) || "—";
}

function getSlipStudentName(slip: Slip) {
  return [slip.user?.firstName, slip.user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function getSlipKey(slip: Slip, index: number) {
  return String(
    slip.id ||
      `${slip.studentNumber || slip.user?.studentNumber || "student"}-${slip.dateOfAbsence}-${index}`,
  );
}

export function SlipList({
  title = "Admission Slip List",
  searchTerm = "",
  onSearchChange,
  statuses,
  selectedStatus,
  statusCounts,
  onStatusChange,
  selectedCategory: selectedCategoryProp,
  onCategoryChange: onCategoryChangeProp,
  categories: categoriesProp,
  sortOptions = [],
  selectedSort,
  onSortChange,
  orderOptions = [],
  selectedOrder,
  onOrderChange,
  slips,
  isLoading = false,
  onViewClick,
  currentPage,
  onPageChange,
  totalPages = 1,
  className,
}: SlipListProps) {
  const [hiddenSlipKeys, setHiddenSlipKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [localCategory, setLocalCategory] = useState<string>("all");

  const isServerFiltered = selectedCategoryProp !== undefined;

  const currentCategory = isServerFiltered
    ? selectedCategoryProp
    : localCategory;

  const handleCategoryChange = (val: string) => {
    if (isServerFiltered) {
      onCategoryChangeProp?.(val);
    } else {
      setLocalCategory(val);
    }
  };

  const sortKeyName = useMemo(
    () =>
      sortOptions?.find(
        (o) => /name|student/i.test(o.id) || /name|student/i.test(o.name),
      )?.id || "studentName",
    [sortOptions],
  );
  const sortKeyAbsence = useMemo(
    () =>
      sortOptions?.find((o) => /absence/i.test(o.id) || /absence/i.test(o.name))
        ?.id || "dateOfAbsence",
    [sortOptions],
  );
  const sortKeyNeeded = useMemo(
    () =>
      sortOptions?.find((o) => /needed/i.test(o.id) || /needed/i.test(o.name))
        ?.id || "dateNeeded",
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
    slips.forEach((slip) => {
      if (slip.category?.name) cats.add(slip.category.name);
    });
    return [
      { id: "all", displayName: "All Categories" },
      ...Array.from(cats)
        .sort()
        .map((c) => ({ id: c, displayName: c })),
    ];
  }, [slips, categoriesProp, isServerFiltered]);

  const baseFilteredSlips = useMemo(() => {
    return slips.filter((slip, index) => {
      if (hiddenSlipKeys.has(getSlipKey(slip, index))) return false;

      if (isServerFiltered) return true;

      const matchesCat =
        currentCategory === "all" || slip.category?.name === currentCategory;

      return matchesCat;
    });
  }, [slips, hiddenSlipKeys, currentCategory, isServerFiltered]);

  const dynamicStatMap = useMemo(() => {
    const map: Record<string, number> = {};

    (statuses || []).forEach((status) => {
      if (String(status.id) !== "0") {
        map[String(status.id)] = 0;
      }
    });

    baseFilteredSlips.forEach((slip) => {
      if (slip.status?.id) {
        map[String(slip.status.id)] = (map[String(slip.status.id)] || 0) + 1;
      }
    });

    return map;
  }, [baseFilteredSlips, statuses]);

  const dropdownOptions = useMemo(() => {
    return (statuses || []).map((status) => {
      const serverCountObj = statusCounts?.find(
        (sc) => String(sc.id) === String(status.id),
      );
      const count = serverCountObj
        ? serverCountObj.count
        : dynamicStatMap[String(status.id)] || 0;
      return {
        ...status,
        displayName:
          String(status.id) === "0"
            ? "All Statuses"
            : `${status.name} (${count})`,
      };
    });
  }, [statuses, statusCounts, dynamicStatMap]);

  const visibleSlips = useMemo(() => {
    let filtered = baseFilteredSlips.filter((slip) => {
      if (!selectedStatus || String(selectedStatus.id) === "0") return true;
      return String(slip.status?.id) === String(selectedStatus.id);
    });

    filtered.sort((a, b) => {
      if (selectedSort === sortKeyName) {
        const left = getSlipStudentName(a).toLowerCase();
        const right = getSlipStudentName(b).toLowerCase();
        const res = left.localeCompare(right);
        return selectedOrder === "asc" ? res : -res;
      } else if (selectedSort === sortKeyAbsence) {
        const left = new Date(a.dateOfAbsence || 0).getTime();
        const right = new Date(b.dateOfAbsence || 0).getTime();
        return selectedOrder === "asc" ? left - right : right - left;
      } else if (selectedSort === sortKeyNeeded) {
        const left = new Date(a.dateNeeded || 0).getTime();
        const right = new Date(b.dateNeeded || 0).getTime();
        return selectedOrder === "asc" ? left - right : right - left;
      }
      return 0;
    });

    return filtered;
  }, [
    baseFilteredSlips,
    selectedStatus,
    selectedSort,
    selectedOrder,
    sortKeyName,
    sortKeyAbsence,
    sortKeyNeeded,
  ]);

  const hiddenCount = slips.length - visibleSlips.length;

  const handleSearchChange = (value: string) => {
    onSearchChange?.(value);
    onPageChange(1);
  };

  const hideSlip = (slip: Slip, event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    setHiddenSlipKeys((previous) => {
      const next = new Set(previous);
      next.add(getSlipKey(slip, slips.indexOf(slip)));
      return next;
    });
  };

  const restoreHiddenSlips = () => {
    setHiddenSlipKeys(new Set());
  };

  const handleViewClick = (
    slip: Slip,
    event?: MouseEvent<HTMLButtonElement>,
  ) => {
    event?.stopPropagation();
    onViewClick(slip);
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

  const columns = useMemo<Column<Slip>[]>(
    () => [
      {
        header: renderSortableHeader("Student Name", sortKeyName),
        className: "w-[28%] px-3 py-3",
        render: (slip) => {
          const studentName = getSlipStudentName(slip) || "Unnamed Student";
          const initials =
            `${slip.user?.firstName?.[0] || ""}${slip.user?.lastName?.[0] || ""}`.toUpperCase() ||
            "ST";
          const picUrl = getProfilePictureUrl(slip.user?.profilePicture);

          return (
            <div className="flex items-center gap-3">
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
                <p className="truncate text-sm font-bold text-foreground">
                  {studentName}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {slip.studentNumber ||
                    slip.user?.studentNumber ||
                    "Student record"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        header: renderSortableHeader("Absence Date", sortKeyAbsence),
        className: "w-[18%] px-3 py-3",
        render: (slip) => (
          <div className="space-y-0.5">
            <p className="whitespace-nowrap text-sm font-semibold text-foreground">
              {formatCompactSlipDate(slip.dateOfAbsence)}
            </p>
            <p className="text-[11px] text-muted-foreground">Date of absence</p>
          </div>
        ),
      },
      {
        header: renderSortableHeader("Date Needed", sortKeyNeeded),
        className: "w-[18%] px-3 py-3",
        render: (slip) => (
          <div className="space-y-0.5">
            <p className="whitespace-nowrap text-sm font-semibold text-foreground">
              {formatCompactSlipDate(slip.dateNeeded)}
            </p>
            <p className="text-[11px] text-muted-foreground">Needed date</p>
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
        className: "w-[18%] px-3 py-3",
        render: (slip) => (
          <span className="text-sm font-semibold text-primary">
            {slip.category?.name || "-"}
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
        className: "w-[16%] min-w-[120px] px-3 py-3",
        render: (slip) => (
          <span
            className={cn(
              "inline-block rounded-xl border px-2.5 py-0.5",
              "text-[10px] font-bold uppercase shadow-md",
              STATUS_COLORS[getStatusColorKey(slip.status?.name)] ||
                "border-gray-300 bg-gray-200 text-gray-700",
            )}
          >
            {slip.status?.name || "-"}
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
            Action
          </span>
        ),
        className: "w-[12%] min-w-[90px] px-3 py-3 text-right",
        render: (slip) => (
          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => handleViewClick(slip, event)}
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
      sortKeyName,
      sortKeyAbsence,
      sortKeyNeeded,
      categoryOptions,
      currentCategory,
      dropdownOptions,
      selectedStatus,
      statuses,
      onSortChange,
      onOrderChange,
      onPageChange,
      onStatusChange,
      handleCategoryChange,
      renderSortableHeader,
    ],
  );

  const renderMobileItem = (slip: Slip) => (
    <div
      key={slip.id || `${slip.studentNumber}-${slip.dateOfAbsence}`}
      className={cn(
        "space-y-3 rounded-xl border border-border bg-card p-4",
        "shadow-md backdrop-blur-xl transition-all duration-200",
        "active:scale-[0.98]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar className="h-9 w-9 shrink-0 rounded-xl border border-primary/20">
            {getProfilePictureUrl(slip.user?.profilePicture) ? (
              <AvatarImage
                src={getProfilePictureUrl(slip.user?.profilePicture)}
                alt={getSlipStudentName(slip) || "Student"}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback
              className={cn(
                "rounded-xl bg-primary/10 text-xs font-bold text-primary",
              )}
            >
              {`${slip.user?.firstName?.[0] || ""}${
                slip.user?.lastName?.[0] || ""
              }`.toUpperCase() || "ST"}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {getSlipStudentName(slip) || "Unnamed Student"}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {slip.studentNumber ||
                slip.user?.studentNumber ||
                "Student record"}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "inline-flex min-h-6 shrink-0 items-center whitespace-nowrap rounded-xl border",
            "px-3 py-1 text-xs font-semibold leading-none shadow-md",
            "[overflow-wrap:normal] [word-break:normal]",
            STATUS_COLORS[getStatusColorKey(slip.status?.name)],
          )}
        >
          {slip.status?.name || "-"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Absence Date
          </p>
          <p className="mt-0.5 font-semibold text-foreground">
            {formatCompactSlipDate(slip.dateOfAbsence)}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Date Needed
          </p>
          <p className="mt-0.5 font-semibold text-foreground">
            {formatCompactSlipDate(slip.dateNeeded)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span
          className={cn(
            "inline-flex max-w-[160px] items-center gap-1.5 rounded-xl border",
            "border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] font-medium",
          )}
        >
          <Tag className="h-3 w-3 text-muted-foreground" />
          <span className="truncate">{slip.category?.name || "-"}</span>
        </span>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(event) => hideSlip(slip, event)}
            className="h-8 gap-1.5 rounded-xl px-3 text-[11px] font-semibold text-muted-foreground"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Hide
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(event) => handleViewClick(slip, event)}
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
        "flex min-h-[340px] flex-col items-center justify-center",
        "px-6 text-center",
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-14 w-14 items-center justify-center",
          "rounded-xl border border-dashed border-border/70 bg-muted/40",
        )}
      >
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">
        No admission slips found
      </h3>

      <div className="mt-2 space-y-3">
        <p className="max-w-md text-sm text-muted-foreground">
          {hiddenCount > 0
            ? "All rows on this page are hidden. Restore hidden rows to show them again."
            : "No active records match the current filters."}
        </p>

        {(currentCategory !== "all" || String(selectedStatus?.id) !== "0") && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleCategoryChange("all");
                const allStatus =
                  statuses.find((s) => String(s.id) === "0") ||
                  ({
                    id: 0,
                    name: "All Statuses",
                  } as unknown as SlipStatus);
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
            <td className="w-[28%] px-3 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
                <div className="min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
            </td>
            {/* Absence Date */}
            <td className="w-[18%] px-3 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </td>
            {/* Date Needed */}
            <td className="w-[18%] px-3 py-3">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
            </td>
            {/* Category */}
            <td className="w-[18%] px-3 py-3">
              <Skeleton className="h-5 w-24 rounded-md" />
            </td>
            {/* Status */}
            <td className="w-[16%] min-w-[120px] px-3 py-3">
              <Skeleton className="h-6 w-20 rounded-xl" />
            </td>
            {/* Action */}
            <td className="w-[12%] min-w-[90px] px-3 py-3 text-right">
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
              Student details, absence date, and date needed are shown in one
              compact table.
            </p>
          </div>

          {!isLoading && slips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <div
                className={cn(
                  "self-start rounded-xl border border-primary/20",
                  "bg-primary/10 px-3 py-1 text-[11px] font-semibold",
                  "text-primary shadow-md",
                )}
              >
                {visibleSlips.length} visible / {slips.length} total
              </div>

              {hiddenCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={restoreHiddenSlips}
                  className="h-8 rounded-xl px-3 text-[11px] font-semibold shadow-md"
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Restore {hiddenCount}
                </Button>
              )}
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

            {!isLoading && slips.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  exportToCSV(
                    visibleSlips,
                    slipExportColumns,
                    "admission-slips",
                  )
                }
                disabled={visibleSlips.length === 0}
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

          {/* Bottom Row: Quick Status Pills + Category Selector + Clear */}
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
                const isSelected =
                  String(selectedStatus?.id) === String(status.id);
                const serverCountObj = statusCounts?.find(
                  (sc) => String(sc.id) === String(status.id),
                );
                const count = serverCountObj
                  ? serverCountObj.count
                  : dynamicStatMap[String(status.id)] || 0;

                return (
                  <button
                    key={String(status.id)}
                    type="button"
                    onClick={() => {
                      if (String(status.id) === "0") {
                        const allStatus = statuses.find(
                          (s) => String(s.id) === "0",
                        ) || {
                          id: 0,
                          name: "All Statuses",
                        };
                        onStatusChange(allStatus as unknown as SlipStatus);
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
                    {String(status.id) !== "0" && (
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

            {/* Secondary Selector (Category) + Reset */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-[160px]">
                <SelectField
                  label=""
                  options={categoryOptions}
                  value={currentCategory}
                  onChange={(val) => {
                    const v = String(val);
                    handleCategoryChange(
                      !val || v === "" || v === "undefined" ? "all" : v,
                    );
                  }}
                  labelKey="displayName"
                  buttonClassName={cn(
                    "!h-8 !min-h-0 !py-1 !px-2.5 text-xs font-semibold",
                    "rounded-xl border-border/70 bg-card hover:bg-muted/40",
                    "shadow-none",
                    currentCategory !== "all" && "border-primary text-primary",
                  )}
                />
              </div>

              {(currentCategory !== "all" ||
                String(selectedStatus?.id) !== "0") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleCategoryChange("all");
                    const allStatus =
                      statuses.find((s) => String(s.id) === "0") ||
                      ({
                        id: 0,
                        name: "All Statuses",
                      } as unknown as SlipStatus);
                    onStatusChange(allStatus);
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
          data={visibleSlips}
          columns={columns}
          renderMobileItem={renderMobileItem}
          isLoading={isLoading}
          emptyState={emptyState}
          renderDesktopSkeleton={renderDesktopSkeleton}
          renderMobileSkeleton={renderMobileSkeleton}
          containerClassName="px-0 py-0"
          tableClassName="w-full table-fixed"
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

import { MouseEvent, useMemo, useState, useCallback } from "react";
import {
  ArrowDown,
  ArrowUp,
  EyeOff,
  Inbox,
  RotateCcw,
  Tag,
  User,
  Eye,
} from "lucide-react";

import { Pagination, Table, Column } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/dateTime";
import { Dropdown, SearchInput } from "@/components/form";

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
        (o) =>
          /name|student/i.test(o.id) || /name|student/i.test(o.name),
      )?.id || "studentName",
    [sortOptions],
  );
  const sortKeyAbsence = useMemo(
    () =>
      sortOptions?.find(
        (o) => /absence/i.test(o.id) || /absence/i.test(o.name),
      )?.id || "dateOfAbsence",
    [sortOptions],
  );
  const sortKeyNeeded = useMemo(
    () =>
      sortOptions?.find(
        (o) => /needed/i.test(o.id) || /needed/i.test(o.name),
      )?.id || "dateNeeded",
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
        currentCategory === "all" ||
        slip.category?.name === currentCategory;

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
        map[String(slip.status.id)] =
          (map[String(slip.status.id)] || 0) + 1;
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
    sortKeyNeeded
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

  const handleViewClick = (slip: Slip, event?: MouseEvent<HTMLButtonElement>) => {
    event?.stopPropagation();
    onViewClick(slip);
  };

  const renderSortableHeader = useCallback(
    (label: string, sortKey: string) => {
      const isActive = selectedSort === sortKey;
      const Icon = isActive
        ? selectedOrder === "desc"
          ? ArrowDown
          : ArrowUp
        : ArrowUp;

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
            "inline-flex items-center gap-1.5 rounded-xl px-2 py-1",
            "whitespace-nowrap outline-none",
            "text-[11px] font-bold uppercase tracking-[0.14em]",
            "transition-colors",
            isActive
              ? "text-[#800000]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
          <Icon
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              isActive ? "opacity-100" : "opacity-40"
            )}
            strokeWidth={isActive ? 2.5 : 2}
          />
        </button>
      );
    },
    [
      selectedSort,
      selectedOrder,
      onSortChange,
      onOrderChange,
      onPageChange,
    ]
  );

  const columns = useMemo<Column<Slip>[]>(
    () => [
      {
        header: renderSortableHeader("Student Name", sortKeyName),
        className: "w-[28%] px-3 py-3", 
        render: (slip) => (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "relative flex h-10 w-10 shrink-0 items-center justify-center",
                "overflow-hidden rounded-xl border border-primary/20 bg-glass-bg/50",
              )}
            >
              <User className="h-4/5 w-4/5 text-primary/80" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-sm font-bold text-foreground">
                {getSlipStudentName(slip) || "Unnamed Student"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {slip.studentNumber || slip.user?.studentNumber || "Student record"}
              </p>
            </div>
          </div>
        ),
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
          <Dropdown
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
              "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
              "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
              currentCategory === "all"
                ? "text-muted-foreground hover:text-foreground"
                : "text-[#800000]",
            )}
          />
        ),
        className: "w-[18%] px-3 py-3",
        render: (slip) => (
          <span className="text-sm font-semibold text-[#800000]">
            {slip.category?.name || "-"}
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
              const v = String(val);
              if (
                !val ||
                v === "" ||
                v === "undefined" ||
                v === "0" ||
                v === "all"
              ) {
                const allStatus = statuses.find(
                  (s) => String(s.id) === "0",
                ) || ({ id: 0, name: "All Statuses" } as unknown as SlipStatus);
                onStatusChange(allStatus);
                onPageChange(1);
                return;
              }
              const status = statuses.find((s) => String(s.id) === v);
              if (status) {
                onStatusChange(status);
                onPageChange(1);
              }
            }}
            labelKey="displayName"
            buttonClassName={cn(
              "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
              "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
              String(selectedStatus?.id) === "0"
                ? "text-muted-foreground hover:text-foreground"
                : "text-[#800000]",
            )}
          />
        ),
        className: "w-[18%] px-3 py-3",
        render: (slip) => (
          <span
            className={cn(
              "inline-block rounded-xl border px-2.5 py-0.5",
              "text-[10px] font-bold uppercase shadow-md",
              STATUS_COLORS[getStatusColorKey(slip.status?.name)] ||
                "bg-gray-200 text-gray-700 border-gray-300",
            )}
          >
            {slip.status?.name || "-"}
          </span>
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
              {getSlipStudentName(slip) || "Unnamed Student"}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {slip.studentNumber || slip.user?.studentNumber || "Student record"}
          </p>
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
        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 dark:border-white/10 dark:bg-white/[0.035]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Absence Date
          </p>
          <p className="mt-0.5 font-semibold text-foreground">
            {formatCompactSlipDate(slip.dateOfAbsence)}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 dark:border-white/10 dark:bg-white/[0.035]">
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

        {(currentCategory !== "all" ||
          String(selectedStatus?.id) !== "0") && (
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleCategoryChange("all");
                const allStatus = statuses.find(
                  (s) => String(s.id) === "0"
                ) || ({
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
        <tr className="border-b border-border/70 text-muted-foreground dark:border-white/10">
          {columns.map((column, index) => (
            <th
              key={index}
              className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em]"
            >
              {typeof column.header === "string" ? column.header : <div className="h-4 w-20 bg-muted/50 rounded animate-pulse" />}
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
            Student details, absence date, and date needed are shown in one compact table.
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

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-1 flex-col gap-1.5 w-full md:max-w-[240px] lg:max-w-sm">
            <label className={cn("text-sm font-medium", "text-neutral-700 dark:text-neutral-300")}>
              Search
            </label>
            <SearchInput
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              placeholder="Search by name, email, or student number..."
              hasHeader={false}
            />
          </div>

          {!isLoading && slips.length > 0 && (
            <button
              onClick={() => exportToCSV(visibleSlips, slipExportColumns, "admission-slips")}
              disabled={visibleSlips.length === 0}
              className="flex h-8 items-center self-start rounded-lg border border-red-800/30 bg-white/50 px-3 text-[11px] font-semibold text-red-800 shadow-sm transition-colors hover:bg-red-800/10 disabled:cursor-not-allowed disabled:opacity-50 xl:self-auto"
            >
              <svg className="mr-1.5 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950/40">
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

import { MouseEvent, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Inbox,
  RotateCcw,
  Search,
  Tag,
  User,
  X,
} from "lucide-react";

import { Pagination, Table, Column } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/dateTime";
import { Dropdown } from "@/components/form";
import { Input } from "@/components/ui/input";

import type { Slip } from "../types";
import { SlipStatus, SlipStats } from "../types";

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
  const visibleSlips = useMemo(
    () => slips.filter((slip, index) => !hiddenSlipKeys.has(getSlipKey(slip, index))),
    [hiddenSlipKeys, slips],
  );

  const hiddenCount = slips.length - visibleSlips.length;
  const statMap = useMemo(() => {
    const map: Record<string | number, SlipStats> = {};
    (statusCounts || []).forEach((status) => {
      map[status.id] = status;
    });
    return map;
  }, [statusCounts]);

  const dropdownOptions = useMemo(() => {
    return (statuses || []).map((status) => ({
      ...status,
      displayName:
        String(status.id) === "0"
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

  const handleStatusChange = (status: SlipStatus) => {
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

  const columns = useMemo<Column<Slip>[]>(
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
        render: (slip) => (
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">
              {getSlipStudentName(slip) || "Unnamed Student"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {slip.studentNumber || slip.user?.studentNumber || "Student record"}
            </p>
          </div>
        ),
      },
      {
        header: "Absence Date",
        className: "min-w-[155px]",
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
        header: "Date Needed",
        className: "min-w-[155px]",
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
        header: "Category",
        className: "min-w-[150px]",
        render: (slip) => (
          <span
            className={cn(
              "inline-flex max-w-[170px] items-center rounded-xl border",
              "border-border/70 bg-muted/30 px-2.5 py-1 text-xs font-medium",
              "text-foreground backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]",
            )}
          >
            <span className="truncate">{slip.category?.name || "-"}</span>
          </span>
        ),
      },
      {
        header: "Status",
        className: "min-w-[130px]",
        render: (slip) => (
          <span
            className={cn(
              "inline-flex min-h-6 min-w-max whitespace-nowrap rounded-xl border",
              "px-3 py-1 text-xs font-semibold leading-none shadow-md",
              "[overflow-wrap:normal] [word-break:normal]",
              STATUS_COLORS[getStatusColorKey(slip.status?.name)],
            )}
          >
            {slip.status?.name || "-"}
          </span>
        ),
      },
      {
        header: "Actions",
        className: "min-w-[160px]",
        render: (slip) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(event) => handleViewClick(slip, event)}
              className="h-8 rounded-xl border-primary/20 bg-primary/5 px-3 text-[11px] font-semibold text-primary"
            >
              <Eye className="mr-1 h-3.5 w-3.5" />
              View
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(event) => hideSlip(slip, event)}
              className="h-8 rounded-xl px-3 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <EyeOff className="mr-1 h-3.5 w-3.5" />
              Hide
            </Button>
          </div>
        ),
      },
    ],
    [isSortingByStudentName, nextNameSortOrder, onViewClick, slips],
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
            size="sm"
            variant="outline"
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

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {hiddenCount > 0
          ? "All rows on this page are hidden. Restore hidden rows to show them again."
          : "There are no admission slip records available for this page."}
      </p>
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
    <Card
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border/70",
        "bg-card shadow-md backdrop-blur-2xl transition-all duration-300",
        "dark:border-white/10 dark:bg-white/[0.04]",
        className,
      )}
    >
      <CardHeader
        className={cn(
          "space-y-4 border-b border-border/70 px-5 py-5",
          "bg-gradient-to-br from-muted/30 via-background/70 to-background",
          "dark:border-white/10 dark:from-white/[0.04] dark:via-white/[0.025] dark:to-transparent",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 text-left">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
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

        <div
          className={cn(
            "rounded-xl border border-border/60 bg-background/70 p-3 shadow-md",
            "backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035]",
          )}
        >
          <div className="grid w-full grid-cols-1 items-end gap-3 lg:grid-cols-[minmax(0,1fr)_220px_210px_170px]">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Search
              </label>
              <div
                className={cn(
                  "flex h-11 items-center gap-2 rounded-xl border border-border/70",
                  "bg-muted/50 px-3 shadow-md transition-all duration-200",
                  "focus-within:border-border focus-within:bg-background focus-within:ring-2 focus-within:ring-muted/70",
                  "dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]",
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
              </div>
            </div>

            <Dropdown
              label="Status"
              options={dropdownOptions}
              value={selectedStatus?.id}
              onChange={(value) => {
                const status = statuses.find(
                  (item) => String(item.id) === String(value),
                );
                if (status) handleStatusChange(status);
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
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <Table
          data={visibleSlips}
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


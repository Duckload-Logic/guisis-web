import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dropdown } from "@/components/form";
import { useMemo, useRef } from "react";
import { Pagination, Table, Column } from "@/components/shared";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { Eye, Calendar, Tag, Inbox, Search, User, X } from "lucide-react";
import type { Slip } from "../types";
import { formatDate } from "@/utils/dateTime";
import { SlipStatus, SlipStats } from "../types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

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
  const statMap = useMemo(() => {
    const map: Record<string | number, SlipStats> = {};
    (statusCounts || []).forEach((sc) => {
      map[sc.id] = sc;
    });
    return map;
  }, [statusCounts]);

  const dropdownOptions = useMemo(() => {
    return (statuses || []).map((s) => ({
      ...s,
      displayName:
        String(s.id) === "0"
          ? "All Statuses"
          : `${s.name} (${statMap[s.id]?.count || 0})`,
    }));
  }, [statuses, statMap]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClearSearch = () => {
    onSearchChange?.("");
    requestAnimationFrame(() => searchInputRef.current?.focus());
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

  const columns = useMemo<Column<Slip>[]>(
    () => [
      {
        header: "Student Name",
        className: "min-w-[220px]",
        render: (slip) => (
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">
              {slip.user?.firstName} {slip.user?.lastName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {slip.studentNumber ||
                slip.user?.studentNumber ||
                "Student record"}
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
    ],
    [],
  );

  const renderMobileItem = (slip: Slip) => (
    <div
      key={slip.id}
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
              {slip.user?.firstName} {slip.user?.lastName}
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

      <div className="flex items-center justify-between gap-3 pt-1">
        <span
          className={cn(
            "inline-flex max-w-[160px] items-center gap-1.5 rounded-xl border",
            "border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] font-medium",
          )}
        >
          <Tag className="h-3 w-3 text-muted-foreground" />
          <span className="truncate">{slip.category?.name || "-"}</span>
        </span>

        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewClick(slip)}
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
        There are no submissions for the current filters yet. Try changing the
        time range or search term.
      </p>
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
      
      {/* 1. COMBINED HEADER & FILTER CARD */}
      <div className="flex flex-col gap-6 rounded-2xl border border-border/70 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-950/40">
        
        {/* Top Section: Title & Badge */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1 text-left">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Student details, absence date, and date needed are shown in one compact table.
            </p>
          </div>

          {!isLoading && slips.length > 0 && (
            <div
              className={cn(
                "self-start rounded-xl border border-primary/20",
                "bg-primary/5 px-4 py-1.5 text-xs font-semibold",
                "text-primary shadow-sm",
              )}
            >
              {slips.length} record{slips.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Bottom Section: Search & Filters */}
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
                  "border-0 shadow-none transition-colors placeholder:text-neutral-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20",
                  "dark:bg-white/5 dark:focus-visible:bg-white/10",
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

      {/* 2. TABLE CARD */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950/40">
        <Table
          data={slips}
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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dropdown } from "@/components/form";
import { useMemo } from "react";
import { Pagination, Table, Column } from "@/components/shared";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { Eye, Calendar, Tag, Inbox, Search, User, X } from "lucide-react";
import type { Slip } from "../types";
import { formatDate } from "@/utils/dateTime";
import { SlipStatus, SlipStats } from "../types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
              "inline-flex max-w-[170px] items-center rounded-full border",
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
              "inline-flex min-w-max whitespace-nowrap rounded-full border",
              "px-2.5 py-1 text-[11px] font-semibold tracking-wide",
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
              {slip.user?.firstName} {slip.user?.lastName}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {slip.studentNumber || slip.user?.studentNumber || "Student record"}
          </p>
        </div>

        <span
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1",
            "text-[10px] font-bold tracking-wide shadow-sm",
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
            "inline-flex max-w-[160px] items-center gap-1.5 rounded-full border",
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
          "rounded-full border border-dashed border-border/70 bg-muted/40",
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
              Student details, absence date, and date needed are shown in one
              compact table.
            </p>
          </div>

          {!isLoading && slips.length > 0 && (
            <div
              className={cn(
                "self-start rounded-full border border-primary/20",
                "bg-primary/10 px-3 py-1 text-[11px] font-semibold",
                "text-primary shadow-sm",
              )}
            >
              {slips.length} record{slips.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div
          className={cn(
            "rounded-2xl border border-border/60 bg-background/70 p-3 shadow-sm",
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
                  "bg-muted/50 px-3 shadow-sm transition-all duration-200",
                  "focus-within:border-border focus-within:bg-background focus-within:ring-2 focus-within:ring-muted/70",
                  "dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]",
                )}
              >
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm ?? ""}
                  onChange={(event) => onSearchChange?.(event.target.value)}
                  placeholder="Search by student name, number, or reason..."
                  spellCheck={false}
                  autoComplete="off"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => onSearchChange?.("")}
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                      "text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
                    )}
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

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
      </CardContent>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </Card>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SearchInput, Dropdown } from "@/components/form";
import { useMemo } from "react";
import { Pagination, Table, Column } from "@/components/shared";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { Eye, Calendar, Tag, Inbox, User } from "lucide-react";
import type { Slip } from "../types";
import { formatDate } from "@/utils/dateTime";
import { SlipStatus, SlipStats } from "../types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SlipListProps {
  title?: string;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  statuses: SlipStatus[];
  selectedStatus: SlipStatus;
  statusCounts: SlipStats[];
  onStatusChange: (status: SlipStatus) => void;
  slips: Slip[];
  isLoading?: boolean;
  onViewClick: (slip: Slip) => void;
  currentPage: number;
  onPageChange: (p: number) => void;
  totalPages?: number;
  className?: string;
}

export function SlipList({
  title = "Submitted Admission Slips",
  searchTerm = "",
  onSearchChange,
  statuses,
  selectedStatus,
  statusCounts,
  onStatusChange,
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

  const columns = useMemo<Column<Slip>[]>(
    () => [
      {
        header: "Student Name",
        className: "px-6 py-4 text-left",
        render: (slip) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {slip.user?.firstName} {slip.user?.lastName}
            </p>
            <p className="truncate text-[10px] text-muted-foreground opacity-70">
              {slip.user?.email || "-"}
            </p>
          </div>
        ),
      },
      {
        header: "Absence Date",
        className: "px-6 py-4 text-left",
        render: (slip) => (
          <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
            <Calendar className="h-3.5 w-3.5 text-primary/60" />
            {formatDate(slip.dateOfAbsence)}
          </div>
        ),
      },
      {
        header: "Date Needed",
        className: "px-6 py-4 text-left",
        render: (slip) => (
          <div className="flex items-center gap-2 text-xs font-bold text-foreground/80">
            <Calendar className="h-3.5 w-3.5 text-primary/60" />
            {formatDate(slip.dateNeeded)}
          </div>
        ),
      },
      {
        header: "Category",
        className: "px-4 py-4 text-left",
        render: (slip) => (
          <div
            className={cn(
              "border-glass-border/20 flex w-fit items-center gap-2",
              "rounded-full border bg-muted/20 px-2.5 py-1 text-xs font-bold",
              "tracking-tight text-foreground",
            )}
          >
            <Tag className="h-3 w-3 text-muted-foreground/60" />
            <span className="max-w-[140px] truncate">
              {slip.category?.name || "-"}
            </span>
          </div>
        ),
      },
      {
        header: "Status",
        className: "px-4 py-4 text-left",
        render: (slip) => (
          <span
            className={cn(
              "inline-block rounded-full border px-2.5 py-1 text-xs font-medium",
              STATUS_COLORS[getStatusColorKey(slip.status?.name)],
            )}
          >
            {slip.status?.name || "-"}
          </span>
        ),
      },
    ],
    [onViewClick],
  );

  const renderMobileItem = (slip: Slip) => (
    <div
      key={slip.id}
      className={cn(
        "bg-glass-bg/20 border-glass-border/20 space-y-4 rounded-3xl",
        "border p-6 shadow-sm backdrop-blur-md transition-all",
        "duration-300",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 text-sm font-bold text-foreground">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-2">
            <User className="h-4 w-4 text-primary" />
          </div>
          <span className="tracking-tight">
            {slip.user?.firstName} {slip.user?.lastName}
          </span>
        </div>

        <span
          className={cn(
            "inline-block rounded-full border px-2.5 py-1 text-[10px] font-bold",
            STATUS_COLORS[getStatusColorKey(slip.status?.name)],
          )}
        >
          {slip.status?.name || "-"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-[10px] font-bold">
        <div
          className={cn(
            "border-glass-border/10 flex items-center gap-2 rounded-xl",
            "border bg-muted/20 px-3 py-2 text-muted-foreground/80",
          )}
        >
          <Calendar className="h-3.5 w-3.5 text-primary/60" />
          <span>{formatDate(slip.dateOfAbsence)}</span>
        </div>

        <div
          className={cn(
            "border-glass-border/10 flex items-center gap-2 rounded-xl",
            "border bg-muted/20 px-3 py-2 text-muted-foreground/80",
          )}
        >
          <Tag className="h-3.5 w-3.5 text-primary/60" />
          <span>{slip.category?.name || "-"}</span>
        </div>
      </div>

      <div className="pt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onViewClick(slip)}
          className={cn(
            "h-11 w-full gap-2 rounded-2xl border-primary/20 bg-primary/5",
            "text-[10px] font-bold text-primary",
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
        "flex min-h-[340px] flex-col items-center justify-center",
        "px-6 text-center",
      )}
    >
      <div
        className={cn(
          "mb-4 flex h-14 w-14 items-center justify-center",
          "rounded-full bg-muted",
        )}
      >
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold text-foreground">
        No excuse slips found
      </h3>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        There are no submissions for the current filters yet. Try changing the
        time range or search term.
      </p>
    </div>
  );

  const renderDesktopSkeleton = () => (
    <table className="w-full border-separate border-spacing-y-2 text-sm">
      <thead className="text-[10px] font-bold text-muted-foreground opacity-60">
        <tr>
          <th className="px-6 py-4 text-left">Student Name</th>
          <th className="px-6 py-4 text-left">Absence Date</th>
          <th className="px-6 py-4 text-left">Date Needed</th>
          <th className="px-4 py-4 text-left">Category</th>
          <th className="px-4 py-4 text-left">Status</th>
          <th className="px-6 py-4 pr-10 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 5 }).map((_, idx) => (
          <tr
            key={idx}
            className="animate-pulse"
          >
            <td className="rounded-l-[20px] px-6 py-6 text-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
              </div>
            </td>
            <td className="px-6 py-6">
              <Skeleton className="h-4 w-20 rounded" />
            </td>
            <td className="px-6 py-6">
              <Skeleton className="h-4 w-20 rounded" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="h-6 w-24 rounded-full" />
            </td>
            <td className="px-4 py-4">
              <Skeleton className="h-6 w-20 rounded-full" />
            </td>
            <td className="rounded-r-[20px] px-6 py-4">
              <Skeleton className="h-8 w-16 rounded-full" />
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
              <Skeleton className="h-5 w-24 rounded" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
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
      className={`bg-glass-bg/40 hover:bg-glass-bg/50 flex flex-col overflow-hidden border-glass-border shadow-md backdrop-blur-2xl transition-all duration-500 ${className || ""}`}
    >
      <CardHeader className="border-glass-border/30 space-y-6 border-b bg-muted/10 px-8 py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5 text-left">
            <h2 className="text-xl font-bold tracking-tight text-foreground/90">
              {title}
            </h2>
          </div>

          {!isLoading && slips.length > 0 && (
            <div
              className={cn(
                "self-start rounded-full border border-primary/20",
                "bg-primary/10 px-4 py-1.5 text-[10px] font-bold",
                "text-primary shadow-sm",
              )}
            >
              {slips.length} Record{slips.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row">
          <SearchInput
            placeholder="Search by student name or reason..."
            searchTerm={searchTerm}
            onSearchChange={onSearchChange!}
            className="border-glass-border/40 focus:bg-glass-bg/60 w-full rounded-2xl"
            hasHeader={false}
          />

          <div className="w-full sm:w-64">
            <Dropdown
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

      <div className="border-t border-border p-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </Card>
  );
}
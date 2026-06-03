import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: string;
  className?: string;
  render: (item: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns?: Column<T>[];
  renderMobileItem?: (item: T, index: number) => React.ReactNode;
  renderListItem?: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  loadingRows?: number;
  emptyState?: React.ReactNode;
  rowClassName?: string | ((item: T, index: number) => string);
  tableClassName?: string;
  containerClassName?: string;
  variant?: "table" | "list";
  renderMobileSkeleton?: () => React.ReactNode;
  renderDesktopSkeleton?: () => React.ReactNode;
  onRowClick?: (item: T, index: number) => void;
  isRowClickable?: (item: T, index: number) => boolean;
}

export function Table<T>({
  data,
  columns = [],
  renderMobileItem,
  renderListItem,
  isLoading = false,
  loadingRows = 5,
  emptyState,
  rowClassName,
  tableClassName,
  containerClassName,
  variant = "table",
  renderMobileSkeleton,
  renderDesktopSkeleton,
  onRowClick,
  isRowClickable,
}: TableProps<T>) {
  if (isLoading) {
    if (variant === "list" && renderListItem) {
      return (
        <div className="divide-y divide-border">
          {Array.from({ length: loadingRows }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5"
            >
              <div className="flex animate-pulse items-start gap-4">
                <div
                  className={cn(
                    "hidden h-20 w-20 shrink-0 rounded-[18px]",
                    "bg-slate-200/50 dark:bg-slate-700/50 sm:block",
                  )}
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <div
                    className={cn(
                      "flex flex-col gap-2.5 sm:flex-row",
                      "sm:items-center sm:justify-between",
                    )}
                  >
                    <div className="flex gap-2">
                      <div
                        className={cn(
                          "h-6 w-24 rounded-full",
                          "bg-slate-200/50 dark:bg-slate-700/50",
                        )}
                      />
                      <div
                        className={cn(
                          "h-6 w-16 rounded-full",
                          "bg-slate-200/50 dark:bg-slate-700/50",
                        )}
                      />
                    </div>
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "h-4 w-28 rounded",
                          "bg-slate-200/50 dark:bg-slate-700/50",
                        )}
                      />
                      <div
                        className={cn(
                          "h-4 w-20 rounded",
                          "bg-slate-200/50 dark:bg-slate-700/50",
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <>
        {/* Desktop Loading Skeleton */}
        {columns.length > 0 && (
          <div
            className={cn(
              "hidden overflow-x-auto md:block",
              containerClassName,
            )}
          >
            {renderDesktopSkeleton ? (
              renderDesktopSkeleton()
            ) : (
              <table
                className={cn("w-full border-collapse text-sm", tableClassName)}
              >
                <thead>
                  <tr className="text-muted-foreground opacity-60">
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        className={cn(
                          "border-glass-border/20 border-b",
                          "px-6 py-4 text-left text-[10px] font-bold",
                          col.className,
                        )}
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: loadingRows }).map((_, rIdx) => (
                    <tr
                      key={rIdx}
                      className="animate-pulse"
                    >
                      {columns.map((_, cIdx) => (
                        <td
                          key={cIdx}
                          className={cn(
                            "border-glass-border/20 border-b",
                            "px-6 py-4",
                          )}
                        >
                          <Skeleton className="h-4 w-20 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Mobile Loading Skeleton */}
        {renderMobileItem && (
          <div className="block space-y-4 px-4 pb-6 md:hidden">
            {renderMobileSkeleton
              ? renderMobileSkeleton()
              : Array.from({ length: 3 }).map((_, idx) => (
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
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-8 w-full rounded-xl" />
                      <Skeleton className="h-8 w-full rounded-xl" />
                    </div>
                  </div>
                ))}
          </div>
        )}
      </>
    );
  }

  if (data.length === 0) {
    return <>{emptyState}</>;
  }

  if (variant === "list" && renderListItem) {
    return (
      <div className="divide-y divide-border border-y border-border">
        {data.map((item, idx) => renderListItem(item, idx))}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      {columns.length > 0 && (
        <div
          className={cn(
            "hidden overflow-x-auto px-6 pb-6 pt-4 md:block",
            containerClassName,
          )}
        >
          <table
            className={cn("w-full border-collapse text-sm", tableClassName)}
          >
            <thead
              className={cn(
                "text-sm font-bold",
                "text-muted-foreground opacity-60",
              )}
            >
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={cn(
                      "border-glass-border/20 border-b px-6 py-4 text-left",
                      col.className,
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((item, idx) => {
                const clickable =
                  !!onRowClick &&
                  (!isRowClickable || isRowClickable(item, idx));

                return (
                  <tr
                    key={idx}
                    className={cn(
                      "bg-glass-bg/20",
                      "group transition-all duration-300",
                      clickable && "cursor-pointer hover:bg-muted/60",
                      typeof rowClassName === "function"
                        ? rowClassName(item, idx)
                        : rowClassName,
                    )}
                    onClick={
                      clickable ? () => onRowClick?.(item, idx) : undefined
                    }
                  >
                    {columns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className={cn(
                          "border-glass-border/20 border-b px-6 py-4",
                        )}
                      >
                        {col.render(item, idx)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card View */}
      {renderMobileItem && (
        <div className="block space-y-4 px-4 pb-6 md:hidden">
          {data.map((item, idx) => renderMobileItem(item, idx))}
        </div>
      )}
    </>
  );
}

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface Column<T> {
  header: React.ReactNode;
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
        <div className="divide-y divide-border/60 dark:divide-white/10">
          {Array.from({ length: loadingRows }).map((_, idx) => (
            <div
              key={idx}
              className="px-4 py-3 sm:px-5"
            >
              <div className="flex animate-pulse items-center gap-4">
                <Skeleton className="hidden h-10 w-10 shrink-0 rounded-xl sm:block" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-36 rounded" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-52 max-w-full rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <>
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
                className={cn(
                  "w-full border-collapse text-sm",
                  tableClassName,
                )}
              >
                <thead>
                  <tr className="border-b border-border/70 text-muted-foreground dark:border-white/10">
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        className={cn(
                          "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em]",
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
                      className="animate-pulse border-b border-border/60 dark:border-white/10"
                    >
                      {columns.map((_, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-4 py-3"
                        >
                          <Skeleton className="h-4 w-24 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {renderMobileItem && (
          <div className="block space-y-3 px-4 pb-5 md:hidden">
            {renderMobileSkeleton
              ? renderMobileSkeleton()
              : Array.from({ length: 3 }).map((_, idx) => (
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
      <div className="divide-y divide-border/60 border-y border-border/60 dark:divide-white/10 dark:border-white/10">
        {data.map((item, idx) => renderListItem(item, idx))}
      </div>
    );
  }

  return (
    <>
      {columns.length > 0 && (
        <div
          className={cn(
            "hidden overflow-x-auto px-3 py-3 md:block",
            containerClassName,
          )}
        >
          <table
            className={cn("w-full border-collapse text-sm", tableClassName)}
          >
            <thead>
              <tr className="border-b border-border/70 text-muted-foreground dark:border-white/10">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={cn(
                      "px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em]",
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
                      "border-b border-border/60 bg-background/70 last:border-0",
                      "transition-colors duration-200 dark:border-white/10 dark:bg-white/[0.025]",
                      clickable &&
                        "cursor-pointer hover:bg-muted/50 dark:hover:bg-white/[0.06]",
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
                        className="px-4 py-3 align-middle"
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

      {renderMobileItem && (
        <div className="block space-y-3 px-4 pb-5 md:hidden">
          {data.map((item, idx) => renderMobileItem(item, idx))}
        </div>
      )}
    </>
  );
}

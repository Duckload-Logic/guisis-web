import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  siblingCount?: number;
  isLoading?: boolean;
  className?: string;
}

/**
 * Calculate which page numbers to display in the pagination.
 * Shows siblings around current page and always shows first/last pages.
 */
const calculatePaginationRange = (
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1,
): (number | string)[] => {
  const totalPaginationItems = siblingCount * 2 + 3;

  if (totalPages <= totalPaginationItems) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const range: (number | string)[] = [];

  range.push(1);

  if (showLeftEllipsis) {
    range.push("left-ellipsis");
  }

  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== totalPages) {
      range.push(i);
    }
  }

  if (showRightEllipsis) {
    range.push("right-ellipsis");
  }

  range.push(totalPages);

  return range;
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageInfo = true,
  siblingCount = 1,
  isLoading = false,
  className,
}) => {
  if (totalPages < 1) return null;

  if (currentPage < 1 || currentPage > totalPages) {
    console.warn("Invalid currentPage provided to Pagination component");
  }

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const paginationRange = useMemo(
    () => calculatePaginationRange(safeCurrentPage, totalPages, siblingCount),
    [safeCurrentPage, totalPages, siblingCount],
  );

  const handlePageChange = (page: number) => {
    if (
      !isLoading &&
      page !== safeCurrentPage &&
      page >= 1 &&
      page <= totalPages
    ) {
      onPageChange(page);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    page: number,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePageChange(page);
    }
  };

  return (
    <nav
      className={cn(
        "flex w-full flex-col-reverse gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6",
        className,
      )}
      aria-label="Pagination navigation"
      role="navigation"
    >
      {showPageInfo && (
        <div className="flex min-w-0 shrink-0 items-center justify-center gap-1 sm:justify-start">
          <span className="text-xs text-muted-foreground sm:text-sm">
            Page{" "}
            <span className="font-semibold text-foreground">
              {safeCurrentPage}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </span>
        </div>
      )}

      <div className="flex min-w-0 items-center justify-center gap-2 sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(safeCurrentPage - 1)}
          onKeyDown={(e) => handleKeyDown(e, safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1 || isLoading}
          aria-label="Previous page"
          title="Previous page"
          className="hidden h-11 shrink-0 px-4 sm:inline-flex md:min-w-[7.5rem]"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden md:inline">Previous</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(safeCurrentPage - 1)}
          onKeyDown={(e) => handleKeyDown(e, safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1 || isLoading}
          aria-label="Previous page"
          title="Previous page"
          className="h-11 w-11 shrink-0 p-0 sm:hidden"
        >
          <ChevronLeft
            className="h-5 w-5 text-current"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </Button>

        <div className="flex shrink-0 items-center justify-center gap-2">
          <div className="flex items-center gap-1.5">
            {paginationRange.map((item, idx) => {
              const isEllipsis = typeof item === "string";

              if (isEllipsis) {
                return (
                  <div
                    key={`ellipsis-${idx}`}
                    className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground md:flex"
                    aria-hidden="true"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                );
              }

              const isActive = item === safeCurrentPage;

              return (
                <Button
                  key={item}
                  variant={isActive ? "default" : "outline"}
                  size="icon"
                  onClick={() => handlePageChange(Number(item))}
                  onKeyDown={(e) => handleKeyDown(e, Number(item))}
                  disabled={isLoading}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`Page ${item}`}
                  title={`Go to page ${item}`}
                  className={cn(
                    "h-11 w-11 shrink-0 px-0 text-sm font-semibold",
                    !isActive && "hidden md:inline-flex",
                  )}
                >
                  {item}
                </Button>
              );
            })}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(safeCurrentPage + 1)}
          onKeyDown={(e) => handleKeyDown(e, safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages || isLoading}
          aria-label="Next page"
          title="Next page"
          className="hidden h-11 shrink-0 px-4 sm:inline-flex md:min-w-[6.5rem]"
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(safeCurrentPage + 1)}
          onKeyDown={(e) => handleKeyDown(e, safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages || isLoading}
          aria-label="Next page"
          title="Next page"
          className="h-11 w-11 shrink-0 p-0 sm:hidden"
        >
          <ChevronRight
            className="h-5 w-5 text-current"
            strokeWidth={2.5}
            aria-hidden="true"
          />
        </Button>
      </div>
    </nav>
  );
};

export default Pagination;

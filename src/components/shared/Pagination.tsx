import React, { useMemo, useRef } from "react";
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
 * Calculate which page numbers to display in the pagination
 * Shows siblings around current page and always shows first/last pages
 */
const calculatePaginationRange = (
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1,
): (number | string)[] => {
  const totalPaginationItems = siblingCount * 2 + 3; // siblings + current + first + last

  if (totalPages <= totalPaginationItems) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const range: (number | string)[] = [];

  // Always show first page
  range.push(1);

  // Show left ellipsis and siblings
  if (showLeftEllipsis) {
    range.push("left-ellipsis");
  }

  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== totalPages) {
      range.push(i);
    }
  }

  // Show right ellipsis and last page
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
  const navRef = useRef<HTMLElement>(null);

  // Validate inputs
  if (totalPages < 1) return null;
  if (currentPage < 1 || currentPage > totalPages) {
    console.warn("Invalid currentPage provided to Pagination component");
  }

  const paginationRange = useMemo(
    () => calculatePaginationRange(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount],
  );

  const handlePageChange = (page: number) => {
    if (!isLoading && page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
      if (navRef.current?.parentElement) {
        navRef.current.parentElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
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
      ref={navRef}
      className={cn(
        "flex flex-col-reverse gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className,
      )}
      aria-label="Pagination navigation"
      role="navigation"
    >
      {/* Page Info - Mobile first, then pushed to left on desktop */}
      {showPageInfo && (
        <div className="flex items-center justify-center gap-1 sm:justify-start">
          <span className="text-xs text-muted-foreground sm:text-sm">
            Page{" "}
            <span className="font-semibold text-foreground">{currentPage}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </span>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-center gap-1">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          onKeyDown={(e) => handleKeyDown(e, currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          aria-label="Previous page"
          title="Previous page"
          className="hidden sm:inline-flex"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden md:inline">Previous</span>
        </Button>

        {/* Mobile Previous Button (Icon only) */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          onKeyDown={(e) => handleKeyDown(e, currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          aria-label="Previous page"
          title="Previous page"
          className="sm:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="hidden items-center gap-1 md:flex">
          {paginationRange.map((item, idx) => {
            const isEllipsis = typeof item === "string";

            if (isEllipsis) {
              return (
                <div
                  key={`ellipsis-${idx}`}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              );
            }

            const isActive = item === currentPage;

            return (
              <Button
                key={item}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(Number(item))}
                onKeyDown={(e) => handleKeyDown(e, Number(item))}
                disabled={isLoading}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Page ${item}`}
                title={`Go to page ${item}`}
                className="h-9 min-w-9 p-0"
              >
                {item}
              </Button>
            );
          })}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          onKeyDown={(e) => handleKeyDown(e, currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          aria-label="Next page"
          title="Next page"
          className="hidden sm:inline-flex"
        >
          <span className="hidden md:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Mobile Next Button (Icon only) */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          onKeyDown={(e) => handleKeyDown(e, currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          aria-label="Next page"
          title="Next page"
          className="sm:hidden"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
};

export default Pagination;

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type GridColumns = "two" | "three" | "six" | "none";

const columnClasses: Record<GridColumns, string> = {
  two: "md:grid-cols-2",
  three: "md:grid-cols-2 lg:grid-cols-3",
  six: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  none: "",
};

interface FormFieldGridProps {
  children: ReactNode;
  columns?: GridColumns;
  className?: string;
}

export function FormFieldGrid({
  children,
  columns = "two",
  className,
}: FormFieldGridProps) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-1 gap-6",
        columnClasses[columns],
        className,
      )}
    >
      {children}
    </div>
  );
}

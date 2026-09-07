import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FormSectionShellProps {
  children: ReactNode;
  className?: string;
}

export function FormSectionShell({
  children,
  className,
}: FormSectionShellProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-glass-border",
        "bg-glass-bg p-6 shadow-md backdrop-blur-glass transition-all",
        "hover:bg-glass-bg/80 duration-500 sm:p-8",
        className,
      )}
    >
      <div
        className={cn(
          "absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full",
          "bg-primary/5 blur-[80px] transition-colors duration-500",
          "group-hover:bg-primary/10",
        )}
      />

      {children}
    </div>
  );
}

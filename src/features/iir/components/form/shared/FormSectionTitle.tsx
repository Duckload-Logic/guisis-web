import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FormSectionTitleProps {
  children: ReactNode;
  className?: string;
}

export function FormSectionTitle({ children, className }: FormSectionTitleProps) {
  return (
    <h4
      className={cn(
        "flex items-center gap-2 text-sm font-bold text-foreground/80",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </h4>
  );
}

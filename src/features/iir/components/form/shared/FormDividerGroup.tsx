import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { FormSectionTitle } from "./FormSectionTitle";

interface FormDividerGroupProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function FormDividerGroup({
  title,
  action,
  children,
  className,
  contentClassName,
}: FormDividerGroupProps) {
  return (
    <div className={cn("border-t border-glass-border pt-8", className)}>
      {(title || action) && (
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          {title && <FormSectionTitle>{title}</FormSectionTitle>}
          {action}
        </div>
      )}

      <div className={contentClassName}>{children}</div>
    </div>
  );
}

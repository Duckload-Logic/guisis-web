import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface FormSectionHeaderProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function FormSectionHeader({
  title,
  description,
  icon: Icon,
}: FormSectionHeaderProps) {
  if (!title) return null;

  return (
    <div
      className={cn(
        "relative mb-6 flex items-center gap-3",
        "sm:mb-8 sm:gap-4",
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border",
            "border-primary/20 bg-primary/10 text-primary shadow-md",
            "transition-transform duration-500 group-hover:scale-105",
            "sm:h-12 sm:w-12",
          )}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} />
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <h3
          className={cn(
            "text-lg font-bold leading-tight tracking-tight",
            "text-neutral-900 dark:text-white sm:text-2xl",
          )}
        >
          {title}
        </h3>

        {description && (
          <p
            className={cn(
              "mt-0.5 text-[10px] font-semibold uppercase tracking-tight",
              "text-neutral-500/80 dark:text-neutral-400/80 sm:text-sm",
            )}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

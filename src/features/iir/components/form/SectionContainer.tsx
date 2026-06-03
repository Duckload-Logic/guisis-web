import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionContainerProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function SectionContainer({
  title,
  description,
  icon: Icon,
  children,
}: SectionContainerProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 group mb-6 w-full",
        "duration-700 sm:mb-8",
      )}
    >
      <div
        className={cn(
          "border-glass-border bg-glass-bg p-5 hover:bg-glass-bg",
          "dark:hover:bg-glass-bg/50 relative overflow-hidden",
          "rounded-xl shadow-md backdrop-blur-glass",
          "transition-all duration-500 sm:p-8",
        )}
      >
        {/* Subtle Gradient Accent */}
        <div
          className={cn(
            "absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full",
            "bg-primary/5 blur-[80px] transition-colors duration-500",
            "group-hover:bg-primary/10",
          )}
        />

        {title && (
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
                  "border-primary/20 bg-primary/10 text-primary shadow-inner",
                  "transition-transform duration-500 group-hover:scale-105",
                  "sm:h-12 sm:w-12 sm:rounded-2xl",
                )}
              >
                <Icon
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  strokeWidth={2.5}
                />
              </div>
            )}
            <div className="flex flex-col">
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
        )}

        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

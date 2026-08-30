import React from "react";
import Breadcrumbs from "./Breadcrumbs";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/dateTime";

interface SubHeaderProps {
  title: string;
  description?: string;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  headerActions?: React.ReactNode;
  headerStats?: React.ReactNode;
  showDate?: boolean;
}

export default function SubHeader({
  title,
  description,
  badgeText,
  badgeIcon,
  headerActions,
  headerStats,
  showDate = false,
}: SubHeaderProps) {
  const today = new Date();

  return (
    <section className="relative mb-8 min-w-0 max-w-full space-y-4 border-b border-border/60 pb-6">
      <Breadcrumbs />

      <div
        className={cn(
          "relative flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end",
          "lg:justify-between border-l-[4px] border-primary pl-4 sm:pl-5",
        )}
      >
        <div className="min-w-0 space-y-3">
          {badgeText && (
            <div
              className={cn(
                "inline-flex h-7 items-center gap-2 rounded-full border",
                "border-border/70 bg-muted/40 px-3 text-[11px] font-semibold",
                "leading-none text-muted-foreground shadow-sm backdrop-blur-md",
                "dark:border-white/10 dark:bg-white/[0.05]",
              )}
            >
              {badgeIcon}
              {badgeText}
            </div>
          )}

          <div className="min-w-0 space-y-2">
            <h1 className="break-words text-2xl font-bold leading-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="max-w-3xl break-words text-sm text-muted-foreground sm:text-base">
                {description}
              </p>
            )}
          </div>

          {showDate && (
            <p className="text-sm font-medium text-muted-foreground">
              {formatDate(today)}
            </p>
          )}
        </div>

        {(headerActions || headerStats) && (
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:justify-end">
            {headerStats}
            {headerActions}
          </div>
        )}
      </div>
    </section>
  );
}

import React from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
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
  const location = useLocation();

  return (
    <motion.section
      key={`${location.pathname}-${title}`}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "relative mb-8 min-w-0 max-w-full space-y-4 border-b",
        "border-border/60 pb-6",
      )}
    >
      <Breadcrumbs />

      <div
        className={cn(
          "relative flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end",
          "border-l-[4px] border-primary pl-4 sm:pl-5 lg:justify-between",
        )}
      >
        <div className="min-w-0 space-y-3">
          {badgeText && (
            <div
              className={cn(
                "inline-flex h-7 items-center gap-2 rounded-full border",
                "border-border/70 bg-muted/40 px-3 text-[11px]",
                "font-semibold leading-none text-muted-foreground",
                "shadow-sm backdrop-blur-md",
              )}
            >
              {badgeIcon}
              {badgeText}
            </div>
          )}

          <div className="min-w-0 space-y-2">
            <h1
              className={cn(
                "break-words text-2xl font-bold leading-tight",
                "text-foreground sm:text-3xl",
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  "max-w-3xl break-words text-sm text-muted-foreground",
                  "sm:text-base",
                )}
              >
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
          <div
            className={cn(
              "flex min-w-0 flex-wrap items-center gap-3 sm:justify-end",
            )}
          >
            {headerStats}
            {headerActions}
          </div>
        )}
      </div>
    </motion.section>
  );
}

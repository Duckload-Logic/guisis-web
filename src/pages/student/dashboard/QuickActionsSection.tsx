import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

import type { StudentDashboardAction } from "./types";

interface QuickActionsSectionProps {
  actions: StudentDashboardAction[];
}

export function QuickActionsSection({ actions }: QuickActionsSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <p
          className={cn(
            "text-xs font-semibold uppercase",
            "tracking-[0.18em] text-muted-foreground",
          )}
        >
          Self-Services
        </p>

        <h2
          className={cn(
            "mt-1 text-xl font-semibold tracking-tight",
            "text-foreground",
          )}
        >
          Guidance Quick Actions
        </h2>
      </div>

      <div className={cn("grid grid-cols-1 gap-3", "sm:grid-cols-2 sm:gap-4")}>
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.href}
            className="group"
          >
            <div
              className={cn(
                "border-glass relative hidden overflow-hidden rounded-xl sm:flex",
                "bg-glass border border-glass-border p-4",
                "shadow-[0_8px_22px_rgba(15,23,42,0.06)] backdrop-blur-xl",
                "transition-all duration-200 hover:-translate-y-0.5",
                "hover:border-primary/25 hover:bg-white/55",
                "flex-col dark:border-white/10 dark:bg-white/[0.04]",
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 top-0 h-20",
                  "bg-gradient-to-br opacity-90",
                  action.accent,
                )}
              />

              <div
                className={cn(
                  "relative flex min-h-[120px] flex-col",
                  "justify-between",
                )}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center",
                      "rounded-xl border bg-white/70 backdrop-blur-md",
                      "dark:bg-white/[0.06]",
                      action.accent,
                    )}
                  >
                    <action.icon className="h-5 w-5" />
                  </div>

                  <ArrowUpRight
                    className={cn(
                      "h-5 w-5 text-muted-foreground transition-all",
                      "duration-200 group-hover:text-foreground",
                    )}
                  />
                </div>

                <div className="pt-4">
                  <h3 className="text-base font-semibold text-foreground">
                    {action.title}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center justify-between p-4 sm:hidden",
                "rounded-2xl border border-white/20 bg-white/45",
                "shadow-[0_4px_12px_rgba(15,23,42,0.04)] backdrop-blur-xl",
                "dark:border-white/10 dark:bg-white/[0.04]",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center",
                    "rounded-xl border bg-white/70 backdrop-blur-md",
                    "dark:bg-white/[0.06]",
                    action.accent,
                  )}
                >
                  <action.icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 text-left">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {action.title}
                  </h3>

                  <p
                    className={cn(
                      "text-[11px] text-muted-foreground",
                      "line-clamp-1",
                    )}
                  >
                    {action.description}
                  </p>
                </div>
              </div>

              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

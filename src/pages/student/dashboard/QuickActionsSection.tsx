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
                "relative hidden flex-col overflow-hidden rounded-xl sm:flex",
                "border border-border bg-card p-4 shadow-sm",
                "transition-colors hover:border-primary/40",
              )}
            >
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
                      "rounded-xl border border-border/50 bg-background/80",
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
                "rounded-xl border border-border bg-card",
                "shadow-sm transition-colors hover:border-primary/40",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center",
                    "rounded-xl border border-border/50 bg-background/80",
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

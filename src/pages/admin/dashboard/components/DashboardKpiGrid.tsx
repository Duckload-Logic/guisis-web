import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface KpiItem {
  title: string;
  value: number;
  trend?: number;
  icon: LucideIcon;
  iconStyle: string;
}

interface DashboardKpiGridProps {
  isLoading: boolean;
  kpis: KpiItem[];
}

export function DashboardKpiGrid({ isLoading, kpis }: DashboardKpiGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {isLoading
        ? Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={index}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-7 w-16 rounded-md" />
                <Skeleton className="h-3 w-28 rounded-md" />
              </div>
            </Card>
          ))
        : kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            const hasTrend = typeof kpi.trend === "number";

            return (
              <Card
                key={index}
                className={cn(
                  "relative overflow-hidden rounded-xl border border-border",
                  "bg-card p-5 shadow-sm transition-colors",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {kpi.title}
                  </span>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      "border border-border/60",
                      kpi.iconStyle,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-3">
                  <h3
                    className={cn(
                      "text-2xl font-bold tracking-tight text-foreground",
                    )}
                  >
                    {kpi.value.toLocaleString()}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5 text-xs">
                    {hasTrend ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-md",
                          "px-1.5 py-0.5 text-[10px] font-bold",
                          kpi.trend! >= 0
                            ? "bg-emerald-500/10 text-emerald-600 " +
                                "dark:text-emerald-400"
                            : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {kpi.trend! >= 0 ? (
                          <TrendingUp className="h-2.5 w-2.5" />
                        ) : (
                          <TrendingDown className="h-2.5 w-2.5" />
                        )}
                        {kpi.trend! >= 0 ? `+${kpi.trend}` : kpi.trend}
                      </span>
                    ) : null}
                    <span className="text-[11px] text-muted-foreground">
                      Recorded total
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
    </div>
  );
}

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: string;
  period?: string;
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  trend,
  period = "Last 30 days",
  icon: Icon,
  iconColor = "text-primary",
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "rounded-xl bg-white/50 p-2 shadow-inner dark:bg-black/30",
                  iconColor,
                )}
              >
                <Icon size={20} />
              </div>
              <span className="text-sm font-medium capitalize text-slate-500 dark:text-slate-400">
                {title}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {value}
              </h3>
              <div className="flex items-center gap-2">
                {trend && (
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold text-emerald-500">
                    {trend}
                  </span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {period}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardMetrics({ metrics }: { metrics: MetricCardProps[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          {...metric}
        />
      ))}
    </div>
  );
}

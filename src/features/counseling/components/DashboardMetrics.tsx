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
  style?: React.CSSProperties;
}

export function MetricCard({
  title,
  value,
  trend,
  period = "Last 30 days",
  icon: Icon,
  iconColor = "text-primary",
  className,
  style,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "min-w-0 overflow-hidden shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
        "hover:-translate-y-0.5 hover:shadow-lg",
        className,
      )}
      style={style}
    >
      <CardContent className="p-6">
        <div className="flex min-w-0 items-start justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={cn(
                  "shrink-0 rounded-xl bg-white/50 p-2 shadow-inner dark:bg-black/30",
                  iconColor,
                )}
              >
                <Icon size={20} />
              </div>
              <span className="min-w-0 whitespace-normal break-words text-sm font-medium capitalize leading-snug text-slate-500 dark:text-slate-400">
                {title}
              </span>
            </div>

            <div className="min-w-0 space-y-1">
              <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {value}
              </h3>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {trend && (
                  <span className="shrink-0 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold text-emerald-500">
                    {trend}
                  </span>
                )}
                <span className="min-w-0 text-xs text-slate-400 dark:text-slate-500">
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
    <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-6">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          {...metric}
          className={cn(metric.className, "animate-fade-in-up")}
          style={{
            animationDelay: `${0.05 * (index + 1)}s`,
            animationFillMode: "both",
          }}
        />
      ))}
    </div>
  );
}

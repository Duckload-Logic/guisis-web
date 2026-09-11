import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";

const DEFAULT_CHART_CONFIG = {
  visitors: {
    label: "Visitors",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

interface ActivityDataPoint {
  name: string;
  visitors: number;
}

interface MonthlyActivityChartProps {
  isLoading: boolean;
  data: ActivityDataPoint[];
  gradientId: string;
  config?: ChartConfig;
}

export function MonthlyActivityChart({
  isLoading,
  data,
  gradientId,
  config = DEFAULT_CHART_CONFIG,
}: MonthlyActivityChartProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-glass-border",
        "shadow-xs bg-card/60 backdrop-blur-xl",
      )}
    >
      <CardHeader
        className={cn("border-b border-glass-border bg-muted/20 px-5 py-3.5")}
      >
        <CardTitle className="text-sm font-bold text-foreground">
          Monthly Activity Trend
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Consultations and verified slips across recent months
        </CardDescription>
      </CardHeader>

      <CardContent className="p-5">
        <div className="h-44 w-full">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : data.length > 0 ? (
            <ChartContainer
              config={config}
              className="aspect-auto h-full w-full"
            >
              <AreaChart
                data={data}
                margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-visitors)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-visitors)"
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.4}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                  dy={6}
                />
                <YAxis hide={true} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="var(--color-visitors)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#${gradientId})`}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div
              className={cn(
                "flex h-full flex-col items-center justify-center",
                "text-center text-xs text-muted-foreground",
              )}
            >
              No touchpoint records available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

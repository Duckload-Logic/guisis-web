import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAppointments,
  useAppointmentsStats,
} from "@/features/appointments/hooks";
import { Calendar, AppointmentList } from "@/features/appointments/components";
import { Appointment, AppointmentStatus } from "@/features/appointments/types";
import { useStatuses } from "@/features/appointments/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { toISODateString } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { usePageMetadata } from "@/context";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { CalendarPlus, Archive } from "lucide-react";
import { formatDate } from "@/utils";
import { cn } from "@/lib/utils";

const chartConfig = {
  pending: {
    label: "Pending",
    color: "#E7C66A",
  },
  scheduled: {
    label: "Scheduled",
    color: "#6FA8DC",
  },
  completed: {
    label: "Completed",
    color: "#74C69D",
  },
  cancelled: {
    label: "Cancelled",
    color: "#F4A261",
  },
  rejected: {
    label: "Rejected",
    color: "#E57373",
  },
  rescheduled: {
    label: "Rescheduled",
    color: "#B388EB",
  },
  noShow: {
    label: "No-show",
    color: "#94A3B8",
  },
} satisfies ChartConfig;

function getChartColorKey(statusName: string): keyof typeof chartConfig {
  const name = statusName.toLowerCase().trim();
  if (name === "pending") return "pending";
  if (name === "scheduled") return "scheduled";
  if (name === "completed" || name === "approved") return "completed";
  if (name === "cancelled") return "cancelled";
  if (name === "rejected") return "rejected";
  if (name === "rescheduled" || name === "for revision") {
    return "rescheduled";
  }
  return "noShow";
}

export default function AppointmentsManagement() {
  const navigate = useNavigate();
  const { data: appointmentStatuses, isLoading: isStatusesLoading } =
    useStatuses();

  const statusWithAll = useMemo(() => {
    if (!appointmentStatuses) return [];
    return [{ id: 0, name: "All", colorKey: "stale" }, ...appointmentStatuses];
  }, [appointmentStatuses]);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const defaultStatus: AppointmentStatus = {
    id: 0,
    name: "All",
  };

  const [selectedStatus, setSelectedStatus] =
    useState<AppointmentStatus>(defaultStatus);

  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return toISODateString(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    // Day 0 of next month resolves to the last day of current month
    return toISODateString(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  });

  // No pre-selected date — show the full month overview by default
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const getLocalDateString = (date?: Date, fallback?: string) => {
    if (!date) return fallback || "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const { data: statusCounts, isLoading: isStatsLoading } =
    useAppointmentsStats({
      params: {
        startDate: getLocalDateString(selectedDate, startDate),
        endDate: getLocalDateString(selectedDate, endDate),
      },
    });

  const { data, isLoading } = useAppointments({
    isMe: false,
    params: {
      page: currentPage,
      pageSize: 10,
      search: debouncedSearch,
      statusId: selectedStatus?.id === 0 ? undefined : selectedStatus?.id,
      startDate: getLocalDateString(selectedDate, startDate),
      endDate: getLocalDateString(selectedDate, endDate),
    },
  });

  const appointments = data?.appointments || [];
  const totalPages = data?.meta?.totalPages || 1;

  const bookedDates = new Set(
    appointments.map((apt) => {
      const date = new Date(apt.whenDate);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(date.getDate()).padStart(2, "0")}`;
    }),
  );

  const handleViewAppointment = (apt: Appointment) => {
    navigate(`${apt.id}`);
  };

  const chartData = (statusCounts || []).map((stat) => {
    return {
      status: stat.name,
      count: stat.count || 0,
      fill: chartConfig[getChartColorKey(stat.name)].color,
    };
  });

  const isPageLoading = isStatusesLoading || isStatsLoading;

  const pageBadgeIcon = useMemo(() => <CalendarPlus className="h-4 w-4" />, []);

  const pageHeaderActions = useMemo(
    () => (
      <Button
        variant="outline"
        onClick={() => navigate("/admin/appointments/logs")}
        className="h-10 gap-2 rounded-xl px-4 shadow-sm"
      >
        <Archive className="h-4 w-4" />
        View All Logs
      </Button>
    ),
    [navigate],
  );

  usePageMetadata({
    title: "Appointments Management",
    description: "View and manage all counseling appointments",
    badgeText: "Admin Management",
    badgeIcon: pageBadgeIcon,
    isLoading: isPageLoading,
    headerActions: pageHeaderActions,
  });

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 py-2 duration-300">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-6">
          <div className="h-full lg:col-span-2">
            <Calendar
              title="Calendar"
              className="h-full"
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onMonthChange={(date) => {
                setCurrentMonth(date);
                const year = date.getFullYear();
                const month = date.getMonth();
                const start = new Date(year, month, 1);
                const end = new Date(year, month + 1, 0);
                setStartDate(toISODateString(start));
                setEndDate(toISODateString(end));
                setSelectedDate(undefined);
              }}
              onDateSelect={(date) => {
                if (!date) return;

                const dateStr = toISODateString(date);

                setSelectedDate(date);
                setStartDate(dateStr);
                setEndDate(dateStr);
                setCurrentPage(1);
              }}
              bookedDates={bookedDates}
              legends={appointmentStatuses
                ?.filter(
                  (status) =>
                    status.name.includes("Pending") ||
                    status.name.includes("Scheduled") ||
                    status.name.includes("Rescheduled"),
                )
                .map((status) => ({
                  color: STATUS_COLORS[getStatusColorKey(status.name)],
                  label: status.name,
                }))}
              hasHeader
              isAdmin
            />
          </div>

          <Card
            className={cn(
              "hover:bg-glass-bg/50 overflow-hidden shadow-md",
              "backdrop-blur-2xl transition-all duration-500 lg:col-span-4",
            )}
          >
            <div
              className={cn(
                "border-glass-border/40 flex items-center justify-between",
                "border-b bg-muted/20 px-8 py-4",
              )}
            >
              <h2 className="flex items-center gap-3 text-xl font-semibold text-foreground/90">
                Overview
              </h2>
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(undefined);
                    const y = currentMonth.getFullYear();
                    const m = currentMonth.getMonth();
                    const start = new Date(y, m, 1);
                    const end = new Date(y, m + 1, 0);
                    setStartDate(toISODateString(start));
                    setEndDate(toISODateString(end));
                  }}
                  className="h-8 rounded-lg px-3 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  View Monthly View
                </Button>
              )}
            </div>

            <CardContent className="flex min-h-[300px] flex-col p-8">
              <p className="mb-6 text-sm font-medium italic text-muted-foreground opacity-70">
                Visual distribution for{" "}
                {selectedDate
                  ? formatDate(startDate)
                  : currentMonth.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
              </p>

              <div
                className={cn(
                  "border-glass-border/30 bg-glass-bg/20 rounded-3xl border",
                  "px-4 py-8 shadow-inner backdrop-blur-md sm:px-6",
                )}
              >
                <div className="relative h-[280px]">
                  {chartData.length > 0 &&
                  chartData.some((d) => d.count > 0) ? (
                    <ChartContainer
                      config={chartConfig}
                      className="h-[280px] w-full drop-shadow-sm"
                    >
                      <BarChart
                        layout="vertical"
                        accessibilityLayer
                        data={chartData}
                        margin={{ top: 4, right: 8, left: 0, bottom: 2 }}
                        barCategoryGap="16%"
                      >
                        <CartesianGrid
                          horizontal
                          vertical={false}
                          strokeDasharray="3 3"
                          stroke="rgba(148,163,184,0.10)"
                        />

                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fontSize: 10,
                            fill: "hsl(var(--muted-foreground))",
                          }}
                          allowDecimals={false}
                        />

                        <YAxis
                          type="category"
                          dataKey="status"
                          tickLine={false}
                          axisLine={false}
                          width={88}
                          interval={0}
                          tickMargin={6}
                          tick={{
                            fontSize: 11,
                            fill: "hsl(var(--muted-foreground))",
                            fontWeight: 500,
                          }}
                        />

                        <ChartTooltip content={<ChartTooltipContent />} />

                        <Bar
                          dataKey="count"
                          radius={[999, 999, 999, 999]}
                          maxBarSize={18}
                        >
                          {chartData.map((item) => (
                            <Cell
                              key={item.status}
                              fill={item.fill}
                            />
                          ))}

                          <LabelList
                            dataKey="count"
                            position="right"
                            offset={8}
                            className="fill-foreground font-semibold"
                            fontSize={11}
                          />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div
                      className={cn(
                        "animate-in fade-in zoom-in flex h-full flex-col items-center",
                        "justify-center text-center duration-700",
                      )}
                    >
                      <div className="mb-4 rounded-full bg-primary/5 p-6">
                        <Archive className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground/60">
                        No activity recorded for this period
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground/40">
                        Appointments Stats
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {chartData.map((item) => (
                    <div
                      key={item.status}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full border",
                        "border-border bg-background px-3 py-1",
                      )}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span
                        className="text-[11px] font-semibold"
                        style={{ color: item.fill }}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-6">
            <AppointmentList
              title={`Appointment List - ${
                selectedDate ? selectedDate.toDateString() : "All Dates"
              }`}
              searchTerm={searchTerm}
              onSearchChange={(value: string) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              statuses={statusWithAll || []}
              selectedStatus={selectedStatus}
              statusCounts={statusCounts || []}
              onStatusChange={setSelectedStatus}
              appointments={appointments}
              onViewClick={handleViewAppointment}
              onPageChange={setCurrentPage}
              currentPage={currentPage}
              totalPages={totalPages}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </>
  );
}

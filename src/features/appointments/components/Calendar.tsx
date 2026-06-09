import { useCallback, useEffect, useMemo, useRef } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalendarStats } from "../hooks/useCalendar";
import { DailyStatusCount } from "../types/calendar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Legend {
  color: string;
  label: string;
}

interface CalendarProps {
  /** Current month being displayed */
  currentMonth: Date;
  /** Currently selected date */
  selectedDate?: Date;
  /** Callback when month changes */
  onMonthChange: (date: Date) => void;
  /** Callback when a date is selected */
  onDateSelect: (date: Date) => void;
  /** Set of booked dates in "YYYY-MM-DD" format */
  bookedDates?: Set<string>;
  /** Custom legends to display */
  legends?: Legend[];
  /** Color class for occupied/booked days */
  occupiedDayColor?: string;
  /** Title shown in card header */
  title?: string;
  /** Allow selecting past dates */
  allowPastDates?: boolean;
  /** Allow selecting current date */
  allowCurrentDate?: boolean;
  /** Allow selecting weekends */
  allowWeekends?: boolean;
  /** Maximum date allowed for selection */
  maxDate?: Date;
  /** Show header with month navigation */
  hasHeader?: boolean;
  /** Additional CSS classes for the card container */
  className?: string;
  /** If admin, add badges */
  isAdmin?: boolean;
}

export default function Calendar({
  currentMonth,
  selectedDate,
  onMonthChange,
  onDateSelect,
  bookedDates = new Set(),
  legends,
  occupiedDayColor = "bg-primary",
  title = "Select Date",
  allowPastDates = true,
  allowCurrentDate = true,
  allowWeekends = false,
  maxDate,
  hasHeader = false,
  className,
  isAdmin = false,
}: CalendarProps) {
  const today = new Date();
  const todayDate = today.getDate();
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  const { data: daysMeta, isLoading: isLoadingDaysMeta } = useCalendarStats({
    isAdmin: isAdmin,
    params: {
      startDate: `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-01`,
    },
  });

  const statsMap = useMemo(() => {
    if (!daysMeta) return {};

    return daysMeta.reduce((acc: any, curr: DailyStatusCount) => {
      const rawDate = curr.date;
      if (rawDate) {
        const key = rawDate.split("T")[0];
        acc[key] = curr;
      }
      return acc;
    }, {});
  }, [daysMeta]);

  const isCurrentMonth =
    today.getFullYear() === currentYear &&
    today.getMonth() === currentMonthIndex;

  const handlePrevMonth = () => {
    onMonthChange(new Date(currentYear, currentMonthIndex - 1));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(currentYear, currentMonthIndex + 1));
  };

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const firstDay = getFirstDayOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const isDateDisabled = useCallback(
    (day: number): boolean => {
      const date = new Date(currentYear, currentMonthIndex, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isPast = isCurrentMonth ? day < todayDate : currentMonth < today;
      const isToday = isCurrentMonth && day === todayDate;

      if (!allowWeekends && isWeekend) return true;
      if (!allowPastDates && isPast) return true;
      if (!allowCurrentDate && isToday) return true;
      if (maxDate && date > maxDate) return true;
      return false;
    },
    [
      currentYear,
      currentMonthIndex,
      isCurrentMonth,
      todayDate,
      currentMonth,
      today,
      allowWeekends,
      allowPastDates,
      allowCurrentDate,
      maxDate,
    ],
  );

  const formatDateKey = useCallback(
    (day: number): string => {
      return `${currentYear}-${String(currentMonthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    },
    [currentYear, currentMonthIndex],
  );

  const handleDateClick = (day: number) => {
    if (!isDateDisabled(day)) {
      onDateSelect(new Date(currentYear, currentMonthIndex, day));
    }
  };

  const defaultLegends: Legend[] = [
    { color: "bg-primary", label: "Selected" },
    { color: "bg-muted border border-border", label: "Available" },
    { color: "bg-muted/50 opacity-50", label: "Unavailable" },
  ];

  const displayLegends = legends || defaultLegends;

  const hasInitialCalendarChecked = useRef(false);

  useEffect(() => {
    if (hasInitialCalendarChecked.current) return;

    const checkAndSkip = () => {
      const allDaysDisabled = Array.from(
        { length: daysInMonth },
        (_, i) => i + 1,
      ).every((day) => isDateDisabled(day));

      if (allDaysDisabled) {
        const nextMonth = new Date(currentYear, currentMonthIndex + 1, 1);
        onMonthChange(nextMonth);
      } else {
        hasInitialCalendarChecked.current = true;
      }
    };

    checkAndSkip();
  }, [currentMonth, isDateDisabled, onMonthChange]);

  return (
    <>
      {/* Mobile View: Inline Card */}
      <div className="w-full sm:hidden">
        <Card
          className={cn(
            "bg-glass-bg/40 hover:bg-glass-bg/50 h-fit border-glass-border",
            "shadow-md backdrop-blur-2xl transition-all duration-500",
            className,
          )}
        >
          {hasHeader && (
            <CardHeader
              className={cn(
                "border-glass-border/30 border-b bg-muted/10",
                "px-3 py-3.5",
              )}
            >
              <CardTitle
                className={cn(
                  "text-lg font-bold tracking-tight",
                  "text-foreground/90",
                )}
              >
                {title}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className="px-2.5 pb-4 pt-4">
            <CalendarContent
              monthName={monthName}
              handlePrevMonth={handlePrevMonth}
              handleNextMonth={handleNextMonth}
              emptyDays={emptyDays}
              days={days}
              formatDateKey={formatDateKey}
              isCurrentMonth={isCurrentMonth}
              todayDate={todayDate}
              selectedDate={selectedDate}
              currentMonthIndex={currentMonthIndex}
              currentYear={currentYear}
              isDateDisabled={isDateDisabled}
              handleDateClick={handleDateClick}
              isAdmin={isAdmin}
              statsMap={statsMap}
              displayLegends={displayLegends}
            />
          </CardContent>
        </Card>
      </div>

      {/* Desktop View: Inline Card */}
      <div className="hidden sm:block">
        <Card
          className={cn(
            "bg-glass-bg/40 hover:bg-glass-bg/50 h-fit border-glass-border",
            "shadow-md backdrop-blur-2xl transition-all duration-500",
            className,
          )}
        >
          {hasHeader && (
            <CardHeader
              className={cn(
                "border-glass-border/30 rounded-t-3xl border-b bg-muted/10",
                "px-6 py-5",
              )}
            >
              <CardTitle
                className={cn(
                  "text-xl font-bold tracking-tight",
                  "text-foreground/90",
                )}
              >
                {title}
              </CardTitle>
            </CardHeader>
          )}
          <CardContent className="px-6 pb-8 pt-8">
            <CalendarContent
              monthName={monthName}
              handlePrevMonth={handlePrevMonth}
              handleNextMonth={handleNextMonth}
              emptyDays={emptyDays}
              days={days}
              formatDateKey={formatDateKey}
              isCurrentMonth={isCurrentMonth}
              todayDate={todayDate}
              selectedDate={selectedDate}
              currentMonthIndex={currentMonthIndex}
              currentYear={currentYear}
              isDateDisabled={isDateDisabled}
              handleDateClick={handleDateClick}
              isAdmin={isAdmin}
              statsMap={statsMap}
              displayLegends={displayLegends}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

interface CalendarContentProps {
  monthName: string;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  emptyDays: any[];
  days: number[];
  formatDateKey: (day: number) => string;
  isCurrentMonth: boolean;
  todayDate: number;
  selectedDate?: Date;
  currentMonthIndex: number;
  currentYear: number;
  isDateDisabled: (day: number) => boolean;
  handleDateClick: (day: number) => void;
  isAdmin: boolean;
  statsMap: any;
  displayLegends: Legend[];
}

function CalendarContent({
  monthName,
  handlePrevMonth,
  handleNextMonth,
  emptyDays,
  days,
  formatDateKey,
  isCurrentMonth,
  todayDate,
  selectedDate,
  currentMonthIndex,
  currentYear,
  isDateDisabled,
  handleDateClick,
  isAdmin,
  statsMap,
  displayLegends,
}: CalendarContentProps) {
  return (
    <div className="flex flex-col p-0">
      {/* Month Navigation */}
      <div className="mb-4 flex min-w-0 items-center justify-between gap-2 sm:mb-6">
        <button
          onClick={handlePrevMonth}
          className="rounded p-2 transition-colors hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="min-w-0 flex-1 text-center text-base font-semibold sm:text-lg">
          {monthName}
        </h2>
        <button
          onClick={handleNextMonth}
          className="rounded p-2 transition-colors hover:bg-muted"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="text-xs font-bold text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {emptyDays.map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="w-full aspect-square"
            />
          ))}
          {days.map((day) => {
            const dateKey = formatDateKey(day);
            const isToday = isCurrentMonth && day === todayDate;
            const isSelected =
              selectedDate?.getDate() === day &&
              selectedDate.getMonth() === currentMonthIndex &&
              selectedDate.getFullYear() === currentYear;
            const isDisabled = isDateDisabled(day);

            let btnClass = cn(
              "flex w-full aspect-square max-w-[2.25rem] sm:max-w-[3rem]",
              "items-center justify-center text-nowrap rounded-full",
              "text-xs font-semibold transition-all focus:outline-none sm:text-sm",
              "focus:ring-1 focus:ring-primary/50",
            );

            if (isDisabled) {
              btnClass = cn(
                btnClass,
                "text-muted-foreground/35 cursor-not-allowed bg-transparent",
              );
            } else if (isSelected) {
              btnClass = cn(
                btnClass,
                "bg-primary text-primary-foreground shadow",
              );
            } else if (isToday) {
              btnClass = cn(
                btnClass,
                "border border-primary text-primary bg-transparent",
                "hover:bg-muted/80",
              );
            } else {
              btnClass = cn(
                btnClass,
                "text-foreground bg-transparent hover:bg-muted/80",
              );
            }

            return (
              <div
                key={day}
                className={cn(
                  "group relative flex w-full aspect-square",
                  "items-center justify-center",
                )}
              >
                <button
                  disabled={isDisabled}
                  onClick={() => handleDateClick(day)}
                  className={btnClass}
                  aria-label={`${day} ${monthName}`}
                  aria-pressed={isSelected}
                >
                  {day}
                </button>
                {isAdmin && statsMap[dateKey] && (
                  <div
                    className={cn(
                      "pointer-events-none absolute left-1/2 top-0 flex",
                      "-translate-x-1/2 -translate-y-1/2 -space-x-1",
                    )}
                  >
                    {/* Rescheduled is first in row-reverse order */}
                    {statsMap[dateKey].rescheduledCount > 0 && (
                      <div
                        className={cn(
                          "size-3 rounded-full border-2 border-notice-foreground",
                          "bg-notice-background",
                        )}
                        title="Rescheduled"
                      />
                    )}

                    {/* Scheduled is rendered second (middle) */}
                    {statsMap[dateKey].scheduledCount > 0 && (
                      <div
                        className={cn(
                          "size-3 rounded-full border-2 border-info-foreground",
                          "bg-info-background",
                        )}
                        title="Scheduled"
                      />
                    )}

                    {/* Pending is rendered last */}
                    {statsMap[dateKey].pendingCount > 0 && (
                      <div
                        className={cn(
                          "size-3 rounded-full border-2 border-warning-foreground",
                          "bg-warning-background",
                        )}
                        title="Pending"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4 sm:mt-8 sm:gap-3">
        {displayLegends.map(({ color, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 text-xs"
          >
            <div className={`size-3 rounded-full border ${color}`} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCalendarStats } from "../hooks/useCalendar";
import { DailyStatusCount } from "../types/calendar";
import { cn } from "@/lib/utils";
import { usePHHolidays, getFallbackHolidayName } from "@/utils/holidays";

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

  const { data: holidays = {} } = usePHHolidays(currentYear);

  const checkIsHoliday = useCallback(
    (day: number): string | null => {
      const monthPart = String(currentMonthIndex + 1).padStart(2, "0");
      const dayPart = String(day).padStart(2, "0");
      const dateKey = `${currentYear}-${monthPart}-${dayPart}`;
      return holidays[dateKey] || getFallbackHolidayName(dateKey);
    },
    [currentYear, currentMonthIndex, holidays],
  );

  const { data: daysMeta } = useCalendarStats({
    isAdmin,
    params: {
      startDate: `${currentMonth.getFullYear()}-${String(
        currentMonth.getMonth() + 1,
      ).padStart(2, "0")}-01`,
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

  const formatDateKey = useCallback(
    (day: number): string => {
      return `${currentYear}-${String(currentMonthIndex + 1).padStart(
        2,
        "0",
      )}-${String(day).padStart(2, "0")}`;
    },
    [currentYear, currentMonthIndex],
  );

  const isDateDisabled = useCallback(
    (day: number): boolean => {
      const date = new Date(currentYear, currentMonthIndex, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isPast = isCurrentMonth ? day < todayDate : currentMonth < today;
      const isToday = isCurrentMonth && day === todayDate;
      const dateKey = `${currentYear}-${String(currentMonthIndex + 1).padStart(
        2,
        "0",
      )}-${String(day).padStart(2, "0")}`;

      if (!allowWeekends && isWeekend) return true;
      if (!allowPastDates && isPast) return true;
      if (!allowCurrentDate && isToday) return true;
      if (maxDate && date > maxDate) return true;
      if (!isAdmin && checkIsHoliday(day)) return true;
      if (!isAdmin && bookedDates.has(dateKey)) return true;
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
      bookedDates,
      isAdmin,
      checkIsHoliday,
    ],
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
    {
      color: "border border-dashed border-amber-500 bg-amber-500/10",
      label: "Holiday",
    },
  ];

  const displayLegends = legends || defaultLegends;
  const hasInitialCalendarChecked = useRef(false);

  useEffect(() => {
    if (hasInitialCalendarChecked.current) return;

    const allDaysDisabled = Array.from(
      { length: daysInMonth },
      (_, i) => i + 1,
    ).every((day) => isDateDisabled(day));

    if (allDaysDisabled) {
      onMonthChange(new Date(currentYear, currentMonthIndex + 1, 1));
      return;
    }

    hasInitialCalendarChecked.current = true;
  }, [
    currentMonth,
    daysInMonth,
    isDateDisabled,
    onMonthChange,
    currentYear,
    currentMonthIndex,
  ]);

  return (
    <Card
      className={cn(
        "h-fit overflow-hidden rounded-2xl border border-border bg-glass-bg",
        "shadow-md backdrop-blur-xl transition-all duration-300",
        className,
      )}
    >
      {hasHeader && (
        <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-4 sm:px-6 sm:py-5">
          <CardTitle className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {title}
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="px-3 pb-5 pt-5 min-[420px]:px-4 sm:px-6 sm:pb-8 sm:pt-8">
        <div className="mx-auto w-full max-w-[34rem]">
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
            occupiedDayColor={occupiedDayColor}
            isHoliday={checkIsHoliday}
          />
        </div>
      </CardContent>
    </Card>
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
  occupiedDayColor: string;
  isHoliday: (day: number) => string | null;
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
  occupiedDayColor,
  isHoliday,
}: CalendarContentProps) {
  return (
    <div className="flex min-w-0 flex-col p-0">
      <div className="mb-4 flex min-w-0 items-center justify-between gap-2 sm:mb-6">
        <button
          type="button"
          onClick={handlePrevMonth}
          className={cn(
            "flex h-10 w-10 min-h-0 shrink-0 items-center justify-center rounded-lg p-0",
            "text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30",
            "[overflow-wrap:normal] [word-break:normal]",
          )}
          aria-label="Previous month"
        >
          <span aria-hidden="true" className="text-2xl font-semibold leading-none">
            ‹
          </span>
        </button>

        <h2 className="min-w-0 flex-1 truncate text-center text-base font-semibold text-foreground sm:text-lg">
          {monthName}
        </h2>

        <button
          type="button"
          onClick={handleNextMonth}
          className={cn(
            "flex h-10 w-10 min-h-0 shrink-0 items-center justify-center rounded-lg p-0",
            "text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30",
            "[overflow-wrap:normal] [word-break:normal]",
          )}
          aria-label="Next month"
        >
          <span aria-hidden="true" className="text-2xl font-semibold leading-none">
            ›
          </span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-7 text-center">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="text-xs font-bold uppercase tracking-[0.04em] text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {emptyDays.map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square w-full" />
          ))}

          {days.map((day) => {
            const dateKey = formatDateKey(day);
            const isToday = isCurrentMonth && day === todayDate;
            const isSelected =
              selectedDate?.getDate() === day &&
              selectedDate.getMonth() === currentMonthIndex &&
              selectedDate.getFullYear() === currentYear;
            const isDisabled = isDateDisabled(day);
            const holidayName = isHoliday(day);
            const isHolidayDate = !!holidayName;

            const btnClass = cn(
              "mx-auto flex aspect-square w-full max-w-[2.25rem] " +
                "items-center justify-center rounded-full p-0",
              "whitespace-nowrap text-center text-xs font-semibold " +
                "leading-none transition-all sm:max-w-[3rem] sm:text-sm",
              "[overflow-wrap:normal] [word-break:normal] " +
                "focus:outline-none focus:ring-1 focus:ring-primary/50",
              isDisabled &&
                "cursor-not-allowed bg-transparent text-muted-foreground/35",
              !isDisabled &&
                isSelected &&
                `${occupiedDayColor} text-primary-foreground shadow`,
              !isDisabled &&
                !isSelected &&
                isToday &&
                "border border-primary bg-transparent text-primary hover:bg-muted/80",
              !isDisabled &&
                !isSelected &&
                !isToday &&
                (isHolidayDate
                  ? "border border-dashed border-amber-500 bg-amber-500/5 " +
                    "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  : "bg-transparent text-foreground hover:bg-muted/80"),
            );

            return (
              <div
                key={day}
                className={cn(
                  "group relative flex aspect-square w-full",
                  "items-center justify-center",
                )}
              >
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDateClick(day)}
                  className={btnClass}
                  aria-label={`${day} ${monthName}${
                    holidayName ? ` - ${holidayName}` : ""
                  }`}
                  aria-pressed={isSelected}
                  title={holidayName || undefined}
                >
                  {day}
                </button>

                {isAdmin && statsMap[dateKey] && (
                  <div className="pointer-events-none absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 -space-x-1">
                    {statsMap[dateKey].rescheduledCount > 0 && (
                      <div
                        className="size-3 rounded-full border-2 border-notice-foreground bg-notice-background"
                        title="Rescheduled"
                      />
                    )}
                    {statsMap[dateKey].scheduledCount > 0 && (
                      <div
                        className="size-3 rounded-full border-2 border-info-foreground bg-info-background"
                        title="Scheduled"
                      />
                    )}
                    {statsMap[dateKey].pendingCount > 0 && (
                      <div
                        className="size-3 rounded-full border-2 border-warning-foreground bg-warning-background"
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

      {displayLegends.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4 sm:mt-8 sm:gap-3">
          {displayLegends.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <div className={cn("size-3 rounded-full border", color)} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Global Date and Time Utility Functions
 */

import { getDate } from "date-fns";

/**
 * Format a date string or Date object to a readable format
 * @param date - ISO date string or Date object
 * @returns Formatted date string (e.g., "January 5, 2026")
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Converts a Date object to an ISO date string (YYYY-MM-DD)
 * @param date - Date object to convert
 * @returns Formatted date string
 */
export const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Formats a time or date string into a 12-hour AM/PM format.
 * @param input - The date or time string to format
 * @returns Formatted time string (e.g., "02:30 PM")
 */
export const format12HourTime = (input: string): string => {
  if (!input) return "";

  let hour: number;
  let minute: number;

  const IS_FULL_DATE = input.includes("T") || input.includes("-");
  const TIME_SEPARATOR = ":";
  const NOON_HOUR = 12;
  const MIDNIGHT_HOUR = 0;

  if (IS_FULL_DATE) {
    const dateObj = new Date(input);
    hour = dateObj.getHours();
    minute = dateObj.getMinutes();
  } else {
    const parts = input.split(TIME_SEPARATOR);
    if (parts.length < 2) return input;
    const [h, m] = parts.map(Number);
    hour = h;
    minute = m;
  }

  const period = hour >= NOON_HOUR ? "PM" : "AM";
  const hour12 =
    hour % NOON_HOUR === MIDNIGHT_HOUR ? NOON_HOUR : hour % NOON_HOUR;
  const minuteDisplay = String(minute).padStart(2, "0");

  return `${hour12}:${minuteDisplay} ${period}`;
};

export type TimeFilter = "today" | "week" | "month" | "all";

export interface DateRange {
  startDate: string;
  endDate: string;
}

/**
 * Get date range for a given time filter
 * @param filter - Time filter type (today, week, month, or all)
 * @returns Date range with startDate and endDate in YYYY-MM-DD format
 */
export function getDateRange(filter: TimeFilter): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate: Date;
  let endDate: Date = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  switch (filter) {
    case "today":
      startDate = new Date(today);
      break;
    case "week": {
      startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - today.getDay(),
      );
      endDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + (6 - today.getDay()),
      );
      break;
    }
    case "month": {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case "all":
      startDate = new Date("1900-01-01");
      break;
    default:
      startDate = new Date(today);
  }

  return {
    startDate: toISODateString(startDate),
    endDate: toISODateString(endDate),
  };
}

/**
 * Get the display label for a time filter
 */
export function getFilterLabel(filter: TimeFilter): string {
  const labels: Record<TimeFilter, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  };
  return labels[filter];
}

/**
 * Get year and month from a date string
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Object with year and month
 */
export function getYearAndMonth(dateString: string): {
  year: number;
  month: number;
} {
  const [year, month] = dateString.split("-").map(Number);
  return { year, month };
}

/**
 * Get date range for a specific year and month
 * @param year - Year (e.g., 2024)
 * @param month - Month (1-12)
 * @returns Date range covering the entire month
 */
export function getMonthRange(year: number, month: number): DateRange {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  return {
    startDate: toISODateString(startDate),
    endDate: toISODateString(endDate),
  };
}

/**
 * Get list of available months for a given year
 * Returns months from January to December
 */
export function getMonthsList(): Array<{ id: number; name: string }> {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months.map((name, index) => ({ id: index + 1, name }));
}

/**
 * Get list of available years
 * Goes back 5 years from current year
 */
export function getYearsList(): Array<{ id: number; name: string }> {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = 0; i <= 5; i++) {
    years.unshift(currentYear - i);
  }
  return years.map((year, index) => ({
    id: index + 1,
    name: year.toString(),
  }));
}

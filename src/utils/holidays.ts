import { useQuery } from "@tanstack/react-query";

export interface Holiday {
  date: string; // YYYY-MM-DD
  localName: string;
  name: string;
}

// Static fallback national holidays for PH (2026 and 2027)
const PH_STATIC_HOLIDAYS: Record<string, string> = {
  // Fixed dates
  "01-01": "New Year's Day",
  "02-25": "EDSA People Power Revolution Anniversary",
  "04-09": "Araw ng Kagitingan (Day of Valor)",
  "05-01": "Labor Day",
  "06-12": "Independence Day",
  "08-21": "Ninoy Aquino Day",
  "11-01": "All Saints' Day",
  "11-02": "All Souls' Day",
  "11-30": "Bonifacio Day",
  "12-08": "Feast of the Immaculate Conception",
  "12-24": "Christmas Eve",
  "12-25": "Christmas Day",
  "12-30": "Rizal Day",
  "12-31": "Last Day of the Year",

  // Movable holidays 2026
  "2026-04-02": "Maundy Thursday",
  "2026-04-03": "Good Friday",
  "2026-04-04": "Black Saturday",
  "2026-08-31": "National Heroes Day",

  // Movable holidays 2027
  "2027-03-25": "Maundy Thursday",
  "2027-03-26": "Good Friday",
  "2027-03-27": "Black Saturday",
  "2027-08-30": "National Heroes Day",
};

/**
 * Returns the name of a public holiday if the date matches the fallback registry.
 */
export function getFallbackHolidayName(dateKey: string): string | null {
  if (PH_STATIC_HOLIDAYS[dateKey]) {
    return PH_STATIC_HOLIDAYS[dateKey];
  }
  const monthDay = dateKey.slice(5); // MM-DD
  if (PH_STATIC_HOLIDAYS[monthDay]) {
    return PH_STATIC_HOLIDAYS[monthDay];
  }
  return null;
}

/**
 * React Query hook to fetch public holidays for the specified year.
 */
export function usePHHolidays(year: number) {
  return useQuery<Record<string, string>>({
    queryKey: ["holidays", year],
    queryFn: async () => {
      try {
        const response = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/PH`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch holidays");
        }
        const data: Holiday[] = await response.json();
        const holidaysMap: Record<string, string> = {};
        data.forEach((holiday) => {
          holidaysMap[holiday.date] = holiday.name;
        });
        return holidaysMap;
      } catch (err) {
        console.error("[usePHHolidays] error:", err);
        return {};
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
  });
}

/**
 * Application Constants
 * Centralized app-wide constants and configuration
 */

// Role to route mapping
export const ROLE_ROUTES = {
  student: "/student", // Student role
  admin: "/admin", // Admin role
} as const;

// Excuse Slip status
export const STATUS_COLORS: Record<string, string> = {
  warning:
    "bg-warning-background text-warning-foreground border-warning-foreground",
  danger:
    "bg-danger-background text-danger-foreground border-danger-foreground",
  success:
    "bg-success-background text-success-foreground border-success-foreground",
  info: "bg-info-background text-info-foreground border-info-foreground",
  stale: "bg-stale-background text-stale-foreground border-stale-foreground",
  notice:
    "bg-notice-background text-notice-foreground border-notice-foreground",
} as const;

/**
 * Maps a status name to its corresponding color key in STATUS_COLORS.
 */
export function getStatusColorKey(statusName?: string): string {
  if (!statusName) return "info";
  const name = statusName.toLowerCase().trim();
  switch (name) {
    case "pending":
      return "warning";
    case "scheduled":
      return "info";
    case "completed":
    case "approved":
      return "success";
    case "cancelled":
    case "rejected":
      return "danger";
    case "rescheduled":
    case "for revision":
      return "notice";
    case "no-show":
      return "stale";
    default:
      return "info";
  }
}

// App config
export const APP_CONFIG = {
  APP_NAME: "PUP Guidance System",
  STUDENT_ID_PREFIX: "PUP",
  FORM_VALIDATION_DEBOUNCE: 300, // ms
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
} as const;

/**
 * React Query Cache Timing Configuration
 * Defines staleTime and gcTime for different data freshness needs.
 * Usage: useQuery({ queryKey: [...], queryFn: ..., ...CACHE_TIMING.SHORT })
 */
export const CACHE_TIMING = {
  /**
   * SHORT: 5 minutes stale, 30 minutes garbage collection
   * Use for: Frequently changing data (appointments, slips)
   */
  SHORT: {
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  } as const,

  /**
   * MEDIUM: 30 minutes stale, 1 hour garbage collection
   * Use for: Moderately changing data (user preferences)
   */
  MEDIUM: {
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  } as const,

  /**
   * LONG: 1 hour stale, 2 hours garbage collection
   * Use for: Stable reference data (statuses, categories, locations)
   */
  LONG: {
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  } as const,

  /**
   * NEVER: Never stale, never garbage collected
   * Use for: Critical data that must always be fresh (user identity)
   */
  NEVER: {
    staleTime: Infinity,
    gcTime: Infinity,
  } as const,

  /**
   * IIR_LOOKUPS: 12 hours stale, 24 hours garbage collection
   * Use for: IIR reference data (courses, genders, religions, etc.)
   */
  IIR_LOOKUPS: {
    staleTime: 12 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  } as const,

  /**
   * IIR_INVENTORY: 1 hour stale, 2 hours garbage collection
   * Use for: IIR student records and inventory data
   */
  IIR_INVENTORY: {
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  } as const,
} as const;

// Shared layout style utilities for student and admin modules
export const LAYOUT_STYLES = {
  CARD:
    "overflow-hidden rounded-[18px] border border-border bg-card " +
    "shadow-sm",
  INNER:
    "border border-border/55 bg-muted/40 shadow-md",
  ALERT:
    "animate-fade-in-up rounded-[18px] border border-rose-400/45 " +
    "bg-rose-50/80 px-5 py-4 text-rose-600 " +
    "shadow-[0_10px_26px_rgba(244,63,94,0.08)] backdrop-blur-xl " +
    "dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400 " +
    "[&>svg]:!left-5 [&>svg]:!top-5 [&>svg~*]:!pl-8",
} as const;


/**
 * Centralized React Query Keys
 * Single source of truth for all query key definitions.
 * Prevents duplication and ensures consistency across hooks.
 */

/**
 * Query key factory for type-safe, consistent query keys
 * Usage: useQuery({ queryKey: QUERY_KEYS.users.me, ... })
 */
export const QUERY_KEYS = {
  /**
   * User-related query keys
   */
  users: {
    all: ["users"] as const,
    me: ["users", "me"] as const,
    byId: (id: string) => ["users", "me", id] as const,
  },

  /**
   * Slip-related query keys
   */
  slips: {
    all: ["slips"] as const,
    mySlips: ["slips", "me"] as const,
    stats: ["slips", "stats"] as const,
    byId: (id: string) => ["slips", "id", id] as const,
    attachments: (id: string) => ["slips", "id", id, "attachments"] as const,
    lookups: {
      statuses: ["slips", "lookups", "statuses"] as const,
      categories: ["slips", "lookups", "categories"] as const,
    },
  },

  /**
   * Appointment-related query keys
   */
  appointments: {
    all: ["appointments"] as const,
    myAppointments: ["appointments", "me"] as const,
    stats: ["appointments", "stats"] as const,
    byId: (id: number) => ["appointments", "id", id] as const,
    lookups: {
      statuses: ["appointments", "lookups", "statuses"] as const,
      categories: ["appointments", "lookups", "categories"] as const,
      slots: (date: string) =>
        ["appointments", "lookups", "slots", date] as const,
    },
  },

  /**
   * Location-related query keys
   */
  locations: {
    regions: ["locations", "regions"] as const,
    provinces: (regionCode: string) =>
      ["locations", "provinces", regionCode] as const,
    citiesByRegion: (regionCode: string) =>
      ["locations", "cities", regionCode] as const,
    citiesByProvince: (provinceCode: string) =>
      ["locations", "cities", provinceCode] as const,
    barangays: (cityCode: string) =>
      ["locations", "barangays", cityCode] as const,
  },

  /**
   * Consent-related query keys
   */
  consents: {
    latest: (type: string) => ["consents", "latest", type] as const,
    latestContent: (type: string) =>
      ["consents", "latest", type, "content"] as const,
    check: (docId: number) => ["consents", "check", docId] as const,
  },

  /**
   * Analytics-related query keys
   */
  analytics: {
    all: ["analytics"] as const,
    reports: ["analytics", "reports"] as const,
  },

  /**
   * IIR (Integrated Information Record) query keys
   */
  iir: {
    lookups: {
      courses: ["iir", "lookups", "courses"] as const,
      genders: ["iir", "lookups", "genders"] as const,
      enrollmentYears: ["iir", "lookups", "enrollment-years"] as const,
      religions: ["iir", "lookups", "religions"] as const,
      parentalStatusTypes: ["iir", "lookups", "parental-status-types"] as const,
      enrollmentReasons: ["iir", "lookups", "enrollment-reasons"] as const,
      incomeRanges: ["iir", "lookups", "income-ranges"] as const,
      studentSupportTypes: ["iir", "lookups", "student-support-types"] as const,
      siblingSupportTypes: ["iir", "lookups", "sibling-support-types"] as const,
      civilStatuses: ["iir", "lookups", "civil-statuses"] as const,
      natureOfResidenceTypes: [
        "iir",
        "lookups",
        "nature-of-residence-types",
      ] as const,
      studentRelationshipTypes: [
        "iir",
        "lookups",
        "student-relationship-types",
      ] as const,
      activityOptions: ["iir", "lookups", "activity-options"] as const,
      studentStatuses: ["iir", "lookups", "student-statuses"] as const,
      educationalAttainments: [
        "iir",
        "lookups",
        "educational-attainments",
      ] as const,
      educationalLevels: ["iir", "lookups", "educational-levels"] as const,
    },
    inventory: {
      all: ["iir", "inventory", "all"] as const,
      byUserId: (userId: string) =>
        ["iir", "inventory", "user", userId] as const,
      byIirId: (iirId: string) => ["iir", "inventory", "iir", iirId] as const,
      profile: (iirId: string) =>
        ["iir", "inventory", "profile", iirId] as const,
    },
    draft: ["iir", "draft"] as const,
  },

  /**
   * Notes-related query keys
   */
  notes: {
    all: ["notes"] as const,
    byIirId: (iirId: string) => ["notes", "iir", iirId] as const,
  },
  /**
   * Notifications-related query keys
   */
  notifications: {
    all: ["notifications"] as const,
    me: ["notifications", "me"] as const,
  },

  /**
   * Superadmin-related query keys
   */
  superadmin: {
    m2mClients: (includeRevoked: boolean) =>
      ["superadmin", "m2mClients", { includeRevoked }] as const,
    users: (params?: any) => ["superadmin", "users", params] as const,
    whitelist: ["superadmin", "users", "whitelist"] as const,
    userDistribution: ["superadmin", "users", "distribution"] as const,
    analytics: ["superadmin", "analytics", "admin"] as const,
    securityLogs: (params?: any) =>
      ["superadmin", "logs", "security", params] as const,
    systemLogs: (params?: any) =>
      ["superadmin", "logs", "system", params] as const,
    auditLogs: (params?: any) =>
      ["superadmin", "logs", "audit", params] as const,
    logStats: (startDate?: string, endDate?: string) =>
      ["superadmin", "logs", "stats", { startDate, endDate }] as const,
    logActivity: ["superadmin", "logs", "activity"] as const,
    myLogs: ["superadmin", "logs", "me"] as const,
    traceTracks: (traceId: string) =>
      ["superadmin", "logs", "trace", traceId] as const,
    logDetail: (id: string) =>
      ["superadmin", "logs", "detail", id] as const,
  },
} as const;
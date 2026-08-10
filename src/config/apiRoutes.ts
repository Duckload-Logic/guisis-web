/**
 * Centralized API Routes Configuration
 * Single source of truth for all API endpoint strings.
 * Prevents hardcoded URLs and enables easy endpoint updates.
 */

/**
 * API route definitions organized by feature domain
 * All routes are frozen to prevent accidental mutations
 */
export const API_ROUTES = Object.freeze({
  /**
   * User-related endpoints
   */
  users: Object.freeze({
    byId: (id: string) => `/users/${id}`,
    profilePicture: (id: string) => `/users/profile-picture/${id}`,
    profilePictureUpload: "/users/profile-picture/upload",
  }),

  /**
   * Slip (Admission Slip) related endpoints
   */
  slips: Object.freeze({
    all: "/slips",
    mySlips: "/slips/me",
    urgent: "/slips/urgent",
    stats: "/slips/stats",
    byId: (id: string) => `/slips/id/${id}`,
    attachments: (id: string) => `/slips/id/${id}/attachments`,
    downloadAttachment: (id: string, attachmentId: string) =>
      `/slips/id/${id}/attachments/${attachmentId}`,
    update: (id: string) => `/slips/id/${id}`,
    lookups: Object.freeze({
      statuses: "/slips/lookups/statuses",
      categories: "/slips/lookups/categories",
    }),
    updateStatus: (id: string) => `/slips/id/${id}/status`,
    claimTicket: "/slips/tickets/claim",
    ticketByCode: (code: string) => `/slips/tickets/${code}`,
  }),

  /**
   * Appointment related endpoints
   */
  appointments: Object.freeze({
    all: "/appointments",
    myAppointments: "/appointments/me",
    stats: "/appointments/stats",
    calendarStats: "/appointments/calendar/stats",
    byId: (id: string) => `/appointments/id/${id}`,
    lookups: Object.freeze({
      statuses: "/appointments/lookups/statuses",
      categories: "/appointments/lookups/categories",
      slots: "/appointments/lookups/slots",
    }),
    cancel: (id: string) => `/appointments/id/${id}/cancel`,
    patch: (id: string) => `/appointments/id/${id}`,
  }),

  /**
   * Significant Notes related endpoints
   */
  notes: Object.freeze({
    all: "/notes",
    byIirId: (iirId: string) => `/notes/user/id/${iirId}`,
  }),

  /**
   * Location related endpoints
   */
  locations: Object.freeze({
    regions: "/locations/regions",
    provinces: (regionCode: string) =>
      `/locations/regions/${regionCode}/provinces`,
    citiesByRegion: (regionCode: string) =>
      `/locations/regions/${regionCode}/cities`,
    citiesByProvince: (provinceCode: string) =>
      `/locations/provinces/${provinceCode}/cities`,
    barangays: (cityCode: string) => `/locations/cities/${cityCode}/barangays`,
  }),

  /**
   * Consent related endpoints
   */
  consents: Object.freeze({
    latest: (type: string) => `/consents/latest/${type}`,
    latestContent: (type: string) => `/consents/latest/${type}/content`,
    checkConsent: (docId: number) => `/consents/check/doc/${docId}`,
    giveConsent: (type: string, docId: number) =>
      `/consents/${type}/doc/${docId}`,
  }),

  /**
   * Analytics related endpoints
   */
  analytics: Object.freeze({
    all: "/analytics",
    reports: "/analytics/reports",
    iirReport: "/analytics/reports/iir",
    iirReportExport: "/analytics/reports/iir/export",
    adminDashboard: "/analytics/admin-dashboard",
  }),

  /**
   * Authentication related endpoints
   */
  auth: Object.freeze({
    me: "/auth/me",
    login: "/auth/login",
    logout: (redirectUri: string) => `/auth/logout?redirect_uri=${redirectUri}`,
    refresh: "/auth/refresh",
    register: "/auth/register",
    idpAuthorizeUrl: "/auth/idp/authorize",
    idpToken: "/auth/idp/token",
    idpStatus: "/auth/idp/status",
    otpRequest: "/auth/otp/request",
    otpLogin: "/auth/otp/login",
  }),

  /**
   * IIR (Integrated Information Record) related endpoints
   */
  iir: Object.freeze({
    lookups: Object.freeze({
      programs: "/students/lookups/programs",
      genders: "/students/lookups/genders",
      enrollmentYears: "/students/lookups/enrollment-years",
      religions: "/students/lookups/religions",
      parentalStatusTypes: "/students/lookups/parental-status-types",
      enrollmentReasons: "/students/lookups/enrollment-reasons",
      incomeRanges: "/students/lookups/income-ranges",
      studentSupportTypes: "/students/lookups/support-types",
      siblingSupportTypes: "/students/lookups/support-types/siblings",
      civilStatuses: "/students/lookups/civil-statuses",
      natureOfResidenceTypes: "/students/lookups/nature-of-residence-types",
      studentRelationshipTypes: "/students/lookups/student-relationship-types",
      activityOptions: "/students/lookups/activity-options",
      studentStatuses: "/students/lookups/student-statuses",
      educationalLevels: "/students/lookups/educational-levels",
      educationalAttainments: "/students/lookups/educational-attainments",
    }),
    inventory: Object.freeze({
      all: "/students/inventory/records",
      byUserId: (userId: string) =>
        `/students/inventory/records/user/${userId}`,
      byIirId: (iirId: string) => `/students/inventory/records/iir/${iirId}`,
      profileByMe: "/students/inventory/records/iir/me/profile",
      profile: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/profile`,
      enrollmentReasons: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/enrollment-reasons`,
      personalInfo: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/personal-info`,
      addresses: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/addresses`,
      familyBackground: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/family-background`,
      relatedPersons: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/related-persons`,
      education: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/education`,
      finance: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/finance`,
      health: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/health`,
      consultations: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/consultations`,
      activities: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/activities`,
      subjectPreferences: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/subject-preferences`,
      hobbies: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/hobbies`,
      testResults: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/test-results`,
      significantNotes: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/significant-notes`,
      download: (iirId: string) =>
        `/students/inventory/records/iir/${iirId}/download`,
      cor: (iirId: string) => `/students/inventory/records/iir/${iirId}/cor`,
    }),
    draft: Object.freeze({
      save: "/students/inventory/records/iir/draft",
      submit: "/students/inventory/records/iir/draft",
    }),
    checkStudentNumber: "/students/inventory/records/iir/check-number",
    submit: "/students/inventory/records/iir",
    update: (iirId: string) => `/students/inventory/records/iir/${iirId}`,
    checkOnboarding: (userId: string) =>
      `/students/inventory/records/user/${userId}`,
    bulkStatus: "/students/inventory/records/bulk-status",
  }),
  /**
   * Superadmin related endpoints
   */
  /**
   * Superadmin related endpoints
   */
  superadmin: Object.freeze({
    m2mClients: Object.freeze({
      list: "/m2m-clients",
      create: "/m2m-clients",
      revoke: (id: string | number) => `/m2m-clients/${id}`,
      rotateSecret: (id: string | number) => `/m2m-clients/${id}/secret`,
      verify: (id: string | number) => `/m2m-clients/${id}/verify`,
      reject: (id: string | number) => `/m2m-clients/${id}/reject`,
    }),
    users: Object.freeze({
      list: "/users",
      distribution: "/users/distribution",
      toggleStatus: (id: string, action: "block" | "unblock") =>
        `/users/${id}/${action}`,
      sessions: (id: string) => `/users/${id}/sessions`,
      revokeSession: (userId: string, sessionId: string) =>
        `/users/${userId}/sessions/${sessionId}`,
      activity: (id: string) => `/users/${id}/activity`,
      whitelist: "/users/whitelist",
      removeWhitelist: "/users/whitelist/remove",
      updateRoles: "/users/update-roles",
    }),
    analytics: Object.freeze({
      admin: "/analytics",
    }),
    logs: Object.freeze({
      myLogs: "/logs/me",
      security: "/logs/security",
      system: "/logs/system",
      audit: "/logs/audit",
      m2m: "/logs/m2m",
      stats: "/logs/stats",
      activity: "/logs/activity",
      traceTracks: (traceId: string) => `/logs/trace/${traceId}`,
      detail: (id: string) => `/logs/${id}`,
      health: "/logs/system/health",
    }),
  }),

  /**
   * Academic related endpoints
   */
  academic: Object.freeze({
    settings: "/students/settings/academic",
  }),
  /**
   * Developer portal related endpoints
   */
  developer: Object.freeze({
    docs: "/docs/integrations/doc.json",
  }),
  /**
   * Notification related endpoints
   */
  notifications: Object.freeze({
    me: "/notifications/me",
    stream: "/notifications/me/stream",
    markAsRead: (id: string) => `/notifications/${id}/read`,
    markAllAsRead: "/notifications/me/read",
    markAllAsTouched: "/notifications/me/touched",
    push: Object.freeze({
      subscribe: "/notifications/push/subscribe",
    }),
  }),
});


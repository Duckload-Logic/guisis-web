// M2M Client types
export interface M2MClient {
  id: number;
  clientName: string;
  clientId: string;
  clientDescription: string;
  scopes?: string[];
  isActive: boolean;
  isVerified: boolean;
  hasPersonalInfoAccess: boolean;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateM2MClientRequest {
  clientName: string;
  clientDescription: string;
  scopes?: string[];
  expiresAt?: string;
  hasPersonalInfoAccess?: boolean;
}

export interface CreateM2MClientResponse extends M2MClient {
  clientSecret: string;
}

// User Management types
export interface UserRole {
  id: number;
  name: string; // role name (e.g., student, superadmin)
}

export interface UserAccount {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffixName?: string;
  email: string;
  profilePicture?: string | null;
  roles: UserRole[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersParams {
  page?: number;
  page_size?: number;
  role_id?: number;
  search?: string;
  active?: boolean;
  sort_by?: string;
  sort_order?: string;
}

export interface ListUsersResponse {
  users: UserAccount[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Analytics Dashboard types
export interface DemographicStat {
  category: string;
  maleCount: number;
  femaleCount: number;
  total: number;
  rank: number;
  totalPct: number;
  malePct: number;
  femalePct: number;
}

export interface MonthlyVisitor {
  period: string;
  logins: number;
  activity: number;
}

export interface AdminAnalytics {
  totalStudents: number;
  totalReports: number;
  totalAppointments: number;
  totalSlips: number;
  liveSessions: number;
  monthlyVisitors: MonthlyVisitor[];
}

// System Log types
export interface SystemLog {
  id: number;
  level: string;
  category: string;
  action: string;
  message: string;
  userEmail?: string;
  targetEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
  createdAt: string;
}

export interface SystemLogsResponse {
  logs: SystemLog[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface SystemLogsParams {
  page?: number;
  page_size?: number;
  category?: string;
  action?: string;
  search?: string;
  user_email?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;     // Added for backend sorting
  sort_order?: string;  // Added for backend sorting
}

export interface LogStats {
  level: string;
  category: string;
  count: number;
}

export interface LogActivityStat {
  time: string;
  requests: number;
  errors: number;
}

export interface RoleDistribution {
  roleName: string;
  count: number;
}

export interface WhitelistEntry {
  email: string;
  profilePicture?: string | null;
  roles: UserRole[];
  createdAt: string;
}
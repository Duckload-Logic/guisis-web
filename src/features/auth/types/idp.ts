import { UserRole } from "@/features/users/types/user";

/**
 * Request payload for POST /auth/idp/token endpoint
 * Contains authorization code and state from IDP callback
 */
export interface IDPTokenExchangeRequest {
  code: string;
}

export interface IDPTokenExchangeResponse {
  message: string;
  role: UserRole;
  userId: string;
  userEmail: string;
}

/**
 * Role-based dashboard route mapping
 * Maps role_id to corresponding dashboard path
 */
export const ROLE_ROUTES_INTERNAL = Object.freeze({
  student: "/student",
  admin: "/admin",
  superadmin: "/superadmin",
  developer: "/developer",
  studentassistant: "/assistant",
  assistant: "/assistant",
} as const);

/**
 * User-facing error messages for IDP authentication
 */
export const IDP_ERROR_MESSAGES = Object.freeze({
  AUTHORIZATION_FAILED: "Failed to get authorization URL",
  TOKEN_EXCHANGE_FAILED: "Authentication failed",
  INVALID_STATE: "Invalid authentication state",
  MISSING_CODE: "Authentication code missing",
  UNKNOWN_ROLE: "Unauthorized role",
} as const);

/**
 * Error auto-dismiss timeout in milliseconds
 */
export const ERROR_DISMISS_TIMEOUT = 10000;

/**
 * Button text constants
 */
export const IDP_BUTTON_TEXT = Object.freeze({
  LOGIN: "Login with IDP",
  LOADING: "Redirecting...",
} as const);

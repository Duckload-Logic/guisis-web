import { capitalizeFirstLetter } from "@/utils";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { decamelizeKeys, camelizeKeys } from "humps";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Extended Axios config with custom logging metadata
 * Allows partial config for use in hooks and services
 */
export interface AxiosConfigWithMeta
  extends Partial<InternalAxiosRequestConfig> {
  handlerName?: string;
  stepName?: string;
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export default apiClient;

/**
 * Request Interceptor: Transform params from camelCase
 * to snake_case. Eliminates need for manual
 * decamelizeKeys calls in services
 */
apiClient.interceptors.request.use((config) => {
  if (config.params) {
    config.params = decamelizeKeys(config.params);
  }
  return config;
});

let refreshPromise: Promise<void> | null = null;
let isRefreshLockedOut = false;

const SESSION_EXPIRED_EVENT = "ogos:session-expired";

const clearClientSession = () => {
  localStorage.removeItem("session_active");
  localStorage.removeItem("active_role");
};

const isAuthRequest = (url?: string) => {
  if (!url) return false;
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/idp/token")
  );
};

const redirectToLoginAfterSessionExpiry = () => {
  if (typeof window === "undefined") return;

  clearClientSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));

  const pathname = window.location.pathname;
  const isAlreadyOnAuthPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/auth");

  if (!isAlreadyOnAuthPage) {
    window.location.replace("/login");
  }
};

apiClient.interceptors.response.use(
  (response) => {
    const contentType = response.headers["content-type"];
    if (
      response.data &&
      typeof contentType === "string" &&
      contentType.includes("application/json")
    ) {
      response.data = camelizeKeys(response.data);

      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.status === "success" &&
        response.data.data !== undefined
      ) {
        response.data = response.data.data;
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosConfigWithMeta;

    if (isRefreshLockedOut && error.response?.status === 401) {
      redirectToLoginAfterSessionExpiry();
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes("/auth/refresh") &&
      !originalRequest?.url?.includes("auth/idp/token") &&
      localStorage.getItem("session_active") === "true"
    ) {
      if (originalRequest) {
        originalRequest._retry = true;
      }

      try {
        if (!refreshPromise) {
          refreshPromise = apiClient
            .post("/auth/refresh")
            .then(() => {
              refreshPromise = null;
              isRefreshLockedOut = false;
            })
            .catch((refreshError) => {
              refreshPromise = null;
              isRefreshLockedOut = true;

              setTimeout(() => {
                isRefreshLockedOut = false;
              }, 10000);

              throw refreshError;
            });
        }

        await refreshPromise;

        if (originalRequest) {
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        redirectToLoginAfterSessionExpiry();
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401 && !isAuthRequest(originalRequest?.url)) {
      redirectToLoginAfterSessionExpiry();
    }

    return Promise.reject(error);
  },
);

/**
 * Extracts and formats user-friendly error messages from backend responses
 * adhering to the JSend specification (success/fail/error).
 */
export function getErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";

  const responseData = error.response?.data;
  if (responseData && typeof responseData === "object") {
    if (
      responseData.status === "error" &&
      typeof responseData.message === "string"
    ) {
      return capitalizeFirstLetter(responseData.message);
    }

    if (responseData.status === "fail" && responseData.data) {
      const data = responseData.data;
      if (typeof data === "object") {
        if (typeof data.error === "string") {
          return capitalizeFirstLetter(data.error);
        }
        if (typeof data.message === "string") {
          return capitalizeFirstLetter(data.message);
        }

        const values = Object.values(data);
        if (values.length > 0 && typeof values[0] === "string") {
          return capitalizeFirstLetter(values[0]);
        }
      }
      if (typeof data === "string") return capitalizeFirstLetter(data);
    }
  }

  return (
    capitalizeFirstLetter(error.message) || "An unexpected error occurred."
  );
}
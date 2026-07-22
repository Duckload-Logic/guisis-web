import { capitalizeFirstLetter, isAuthPath } from "@/utils";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { decamelizeKeys, camelizeKeys } from "humps";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const isStagingEnvironment = () => {
  const environmentName = String(
    import.meta.env.VITE_APP_ENV ||
      import.meta.env.VITE_ENV ||
      import.meta.env.MODE ||
      "",
  ).toLowerCase();
  const baseUrl = String(API_BASE_URL || "").toLowerCase();
  const host =
    typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";

  return (
    environmentName.includes("staging") ||
    baseUrl.includes("staging") ||
    host.includes("staging")
  );
};

const getStagingMaskedMessage = (status?: number) => {
  if (!isStagingEnvironment()) return "";
  if (status === 401) return "Invalid Credentials";
  if (status === 404) return "Network Error";
  return "";
};

const applyStagingErrorMask = <TError extends AxiosError>(error: TError) => {
  const maskedMessage = getStagingMaskedMessage(error.response?.status);
  if (!maskedMessage) return error;

  error.message = maskedMessage;

  if (error.response) {
    const existingData = error.response.data;

    if (existingData && typeof existingData === "object") {
      error.response.data = {
        ...existingData,
        message: maskedMessage,
        error: maskedMessage,
      };
    } else {
      error.response.data = {
        status: "fail",
        data: { message: maskedMessage },
        message: maskedMessage,
      };
    }
  }

  return error;
};


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
  const isAlreadyOnAuthPage = isAuthPath(pathname);

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
      return Promise.reject(applyStagingErrorMask(error));
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
        return Promise.reject(applyStagingErrorMask(refreshError as AxiosError));
      }
    }

    if (error.response?.status === 401 && !isAuthRequest(originalRequest?.url)) {
      redirectToLoginAfterSessionExpiry();
    }

    return Promise.reject(applyStagingErrorMask(error));
  },
);

/**
 * Extracts and formats user-friendly error messages from backend responses
 * adhering to the JSend specification (success/fail/error).
 */
export function getErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred.";

  const status = error.response?.status;
  const maskedMessage = getStagingMaskedMessage(status);
  if (maskedMessage) return maskedMessage;

  if (status >= 500) {
    return "We're having trouble loading this page right now. Please try again in a moment.";
  }

  if (status === 404) {
    return "We couldn't find the requested information. It may have been moved or is no longer available.";
  }

  if (status === 403) {
    return "You don't have permission to view this information.";
  }

  if (status === 401 && !isAuthRequest(error.config?.url)) {
    return "Your session has expired. Please sign in again.";
  }

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

  const rawMessage = String(error.message || "");

  if (/network error/i.test(rawMessage)) {
    return "We couldn't connect to the server. Please check your connection and try again.";
  }

  if (/timeout/i.test(rawMessage)) {
    return "The request took too long to finish. Please try again.";
  }

  if (/request failed with status code/i.test(rawMessage)) {
    return "We couldn't complete the request. Please try again in a moment.";
  }

  return capitalizeFirstLetter(rawMessage) || "An unexpected error occurred.";
}

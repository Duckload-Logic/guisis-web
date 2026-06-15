import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";
import type {
  ListNotificationsParams,
  ListNotificationsResponse,
} from "../types";

export const GetMyNotifications = async (
  params?: ListNotificationsParams,
  config?: AxiosConfigWithMeta,
): Promise<ListNotificationsResponse> => {
  const { data } = await apiClient.get<ListNotificationsResponse>(
    API_ROUTES.notifications.me,
    {
      ...config,
      params: {
        ...(config?.params || {}),
        ...(params || {}),
      },
    },
  );

  return data;
};

export const PatchNotificationRead = async (
  id: string,
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  await apiClient.patch(API_ROUTES.notifications.markAsRead(id), {}, config);
};

export const PatchNotificationsRead = async (
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  await apiClient.patch(API_ROUTES.notifications.markAllAsRead, {}, config);
};

export const PatchNotificationsTouched = async (
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  await apiClient.patch(API_ROUTES.notifications.markAllAsTouched, {}, config);
};

export const GetNotificationStreamUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return `${baseUrl}${API_ROUTES.notifications.stream}`;
};

export * from "./push";


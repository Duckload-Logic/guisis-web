import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";
import type { ListNotificationsResponse } from "../types";

export const GetMyNotifications = async (
  config?: AxiosConfigWithMeta,
): Promise<ListNotificationsResponse> => {
  try {
    const { data } = await apiClient.get<ListNotificationsResponse>(
      API_ROUTES.notifications.me,
      config,
    );
    return data as unknown as ListNotificationsResponse;
  } catch (error) {

    throw error;
  }
};

export const PatchNotificationRead = async (
  id: string,
  config?: AxiosConfigWithMeta,
): Promise<void> => {
  try {
    await apiClient.patch(API_ROUTES.notifications.markAsRead(id), {}, config);
  } catch (error) {

    throw error;
  }
};

export const GetNotificationStreamUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
  return `${baseUrl}${API_ROUTES.notifications.stream}`;
};

export * from "./push";

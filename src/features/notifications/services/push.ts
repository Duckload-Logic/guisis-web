import { apiClient } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dhKey: string;
  authKey: string;
}

export const PostPushSubscribe = async (
  payload: PushSubscriptionPayload,
): Promise<void> => {
  await apiClient.post(API_ROUTES.notifications.push.subscribe, payload);
};

export const DeletePushSubscribe = async (
  endpoint: string,
): Promise<void> => {
  await apiClient.delete(API_ROUTES.notifications.push.subscribe, {
    params: { endpoint },
  });
};

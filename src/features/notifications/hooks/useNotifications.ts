import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GetMyNotifications,
  GetNotificationStreamUrl,
  PatchNotificationRead,
  PatchNotificationsRead,
  PatchNotificationsTouched,
} from "../services";
import type { ListNotificationsParams } from "../types";
import { QUERY_KEYS } from "@/config/queryKeys";
import { useAuth } from "@/context";

export function useGetNotifications(params?: ListNotificationsParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.notifications.list(params),
    queryFn: () => GetMyNotifications(params),
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => PatchNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.all,
      });
    },
    onError: (error) => {
      console.error(
        "Failed to mark notification as read: ",
        error instanceof Error ? error.message : "Failed to mark as read",
      );
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => PatchNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.all,
      });
    },
    onError: (error) => {
      console.error(
        "Failed to mark notifications as read: ",
        error instanceof Error ? error.message : "Failed to mark all as read",
      );
    },
  });
}

export function useMarkNotificationsTouched() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => PatchNotificationsTouched(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.all,
      });
    },
    onError: (error) => {
      console.error(
        "Failed to mark notifications as touched: ",
        error instanceof Error ? error.message : "Failed to mark as touched",
      );
    },
  });
}

export function useNotificationsStream() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;

    let fallbackTimer: ReturnType<typeof setInterval> | undefined;

    fallbackTimer = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.all,
      });
    }, 15000);

    const source = new EventSource(GetNotificationStreamUrl(), {
      withCredentials: true,
    });

    const refreshNotifications = () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.all,
      });
    };

    source.addEventListener("notification", refreshNotifications);
    source.addEventListener("message", refreshNotifications);
    source.onerror = () => {
      refreshNotifications();
    };

    return () => {
      if (fallbackTimer) {
        clearInterval(fallbackTimer);
      }
      source.removeEventListener("notification", refreshNotifications);
      source.removeEventListener("message", refreshNotifications);
      source.close();
    };
  }, [isAuthenticated, queryClient]);
}


import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  GetMyNotifications,
  GetNotificationStreamUrl,
  PatchNotificationRead,
  PatchNotificationTargetRead,
  PatchNotificationsRead,
  PatchNotificationsTouched,
} from "../services";
import type { ListNotificationsParams, NotificationEntry } from "../types";
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

export function useMarkNotificationTargetRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetId: string) => PatchNotificationTargetRead(targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.all,
      });
    },
    onError: (error) => {
      console.error(
        "Failed to mark target notifications as read: ",
        error instanceof Error ? error.message : "Failed to mark as read",
      );
    },
  });
}

export function useAutoMarkNotificationRead(targetId?: string | null) {
  const markTargetRead = useMarkNotificationTargetRead();
  const queryClient = useQueryClient();
  const markedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!targetId || markedRef.current === targetId) return;
    markedRef.current = targetId;

    queryClient.setQueriesData(
      { queryKey: QUERY_KEYS.notifications.all },
      (oldData: unknown) => {
        const data = oldData as
          | {
              notifications?: NotificationEntry[];
              unreadCount?: number;
            }
          | undefined;

        if (!data || !Array.isArray(data.notifications)) return oldData;

        let markedCount = 0;
        const updated = data.notifications.map((n) => {
          if (n.targetId === targetId && !n.isRead) {
            markedCount++;
            return { ...n, isRead: true, isTouched: true };
          }
          return n;
        });

        if (markedCount === 0) return oldData;

        return {
          ...data,
          notifications: updated,
          unreadCount: Math.max(0, (data.unreadCount || 0) - markedCount),
        };
      },
    );

    markTargetRead.mutate(targetId);
  }, [targetId, markTargetRead, queryClient]);
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

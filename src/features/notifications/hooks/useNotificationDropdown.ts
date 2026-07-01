import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type UIEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/hooks";
import { useIsMobile } from "@/hooks/useIsMobile";

import {
  useGetNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationsTouched,
} from "./useNotifications";
import { usePushNotifications } from "./usePushNotifications";
import type { NotificationEntry } from "../types";
import { getNotificationTargetUrl, getRolePath } from "../utils";

const DROPDOWN_PAGE_SIZE = 8;
const SCROLL_LOAD_THRESHOLD = 96;

type NotificationFilter = "all" | "unread";

interface UseNotificationDropdownArgs {
  showNotifications: boolean;
  setShowNotifications: (value: boolean) => void;
}

export function useNotificationDropdown({
  showNotifications,
  setShowNotifications,
}: UseNotificationDropdownArgs) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();

  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [loadedNotifications, setLoadedNotifications] = useState<
    NotificationEntry[]
  >([]);
  const [selectedReadIds, setSelectedReadIds] = useState<Set<string>>(
    () => new Set(),
  );

  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const markTouched = useMarkNotificationsTouched();

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: DROPDOWN_PAGE_SIZE,
      unreadOnly: filter === "unread",
    }),
    [filter, page],
  );

  const { data, isLoading, isFetching } = useGetNotifications(queryParams);

  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isPending: isPushPending,
    subscribe: subscribePush,
  } = usePushNotifications();

  const roleName = activeRole?.name || user?.roles?.[0]?.name || "student";
  const rolePath = getRolePath(roleName);
  const totalPages = Math.max(data?.totalPages || 1, 1);
  const unreadCount = data?.unreadCount || 0;
  const hasNextPage = page < totalPages;
  const showPushBanner =
    isPushSupported && pushPermission === "default" && !isPushSubscribed;

  const closeNotifications = useCallback(() => {
    if ((data?.untouchedCount || 0) > 0 && !markTouched.isPending) {
      markTouched.mutate();
    }

    setShowNotifications(false);
  }, [data?.untouchedCount, markTouched, setShowNotifications]);

  useEffect(() => {
    if (!showNotifications) return;

    setPage(1);
    setLoadedNotifications([]);
    setSelectedReadIds(new Set());
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [filter, showNotifications]);

  useEffect(() => {
    if (!showNotifications || !data || data.page !== page) return;

    setLoadedNotifications((previous) => {
      const incoming = data.notifications || [];

      if (page === 1) return incoming;

      const existingIds = new Set(
        previous.map((notification) => notification.id),
      );
      const nextNotifications = incoming.filter(
        (notification) => !existingIds.has(notification.id),
      );

      return [...previous, ...nextNotifications];
    });
  }, [data, page, showNotifications]);

  useEffect(() => {
    if (!showNotifications) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;

      if (dropdownRef.current?.contains(target as Node)) return;
      if (target?.closest('[data-notification-trigger="true"]')) return;

      closeNotifications();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeNotifications();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeNotifications, showNotifications]);

  useEffect(() => {
    if (isMobile && showNotifications) {
      closeNotifications();
    }
  }, [closeNotifications, isMobile, showNotifications]);

  const handleSubscribePush = useCallback(async () => {
    try {
      await subscribePush();
    } catch (err) {
      console.error("Failed to subscribe push notifications:", err);
    }
  }, [subscribePush]);

  const handleMarkAllRead = useCallback(() => {
    if (unreadCount === 0 || markAllRead.isPending) return;

    setSelectedReadIds(
      new Set(loadedNotifications.map((notification) => notification.id)),
    );

    markAllRead.mutate();
  }, [loadedNotifications, markAllRead, unreadCount]);

  const handleNotificationClick = useCallback(
    (notification: NotificationEntry) => {
      if (!notification.isRead) {
        setSelectedReadIds((previous) => {
          const next = new Set(previous);
          next.add(notification.id);
          return next;
        });

        if (!markRead.isPending) {
          markRead.mutate(notification.id);
        }
      }

      const url = getNotificationTargetUrl(notification, roleName);

      if (url) {
        navigate(url);
        closeNotifications();
      }
    },
    [closeNotifications, markRead, navigate, roleName],
  );

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
      const nearBottom =
        scrollHeight - scrollTop - clientHeight < SCROLL_LOAD_THRESHOLD;

      if (nearBottom && hasNextPage && !isFetching) {
        setPage((value) => value + 1);
      }
    },
    [hasNextPage, isFetching],
  );

  return {
    dropdownRef,
    scrollContainerRef,
    filter,
    setFilter,
    loadedNotifications,
    selectedReadIds,
    isLoading,
    isFetching,
    isMobile,
    unreadCount,
    rolePath,
    hasNextPage,
    showPushBanner,
    isPushPending,
    markAllRead,
    closeNotifications,
    handleSubscribePush,
    handleMarkAllRead,
    handleNotificationClick,
    handleScroll,
  };
}

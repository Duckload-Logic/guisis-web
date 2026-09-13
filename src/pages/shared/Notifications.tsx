import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, CheckCheck } from "lucide-react";

import { usePageMetadata, useAuth } from "@/context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useGetNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationsTouched,
  useNotificationsStream,
} from "@/features/notifications/hooks/useNotifications";
import type { NotificationEntry } from "@/features/notifications/types";
import {
  NotificationItem,
} from "@/features/notifications/components/NotificationItem";
import {
  NotificationFilterButton,
} from "@/features/notifications/components/NotificationFilterButton";
import { getNotificationTargetUrl } from "@/features/notifications/utils";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const pageMetadata = useMemo(
    () => ({
      title: "Notifications",
      description: "View all your system activities and alerts.",
      badgeText: "Account",
    }),
    [],
  );

  usePageMetadata(pageMetadata);

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [loadedNotifications, setLoadedNotifications] = useState<
    NotificationEntry[]
  >([]);
  const [selectedReadIds, setSelectedReadIds] = useState<Set<string>>(
    () => new Set(),
  );
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadMoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchedOnceRef = useRef(false);
  useNotificationsStream();

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      unreadOnly: filter === "unread",
    }),
    [filter, page],
  );

  const { data, isLoading, isFetching } = useGetNotifications(queryParams);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const markTouched = useMarkNotificationsTouched();
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();

  const unreadCount = data?.unreadCount || 0;
  const totalPages = Math.max(data?.totalPages || 1, 1);
  const hasNextPage = page < totalPages;
  const roleName = activeRole?.name || user?.roles?.[0]?.name || "student";

  const requestNextPage = useCallback(() => {
    if (!hasNextPage || isFetching || loadMoreTimerRef.current) return;

    loadMoreTimerRef.current = setTimeout(() => {
      setPage((value) => value + 1);
      loadMoreTimerRef.current = null;
    }, 650);
  }, [hasNextPage, isFetching]);

  useEffect(() => {
    return () => {
      if (loadMoreTimerRef.current) {
        clearTimeout(loadMoreTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setPage(1);
    setLoadedNotifications([]);
    setSelectedReadIds(new Set());
  }, [filter]);

  useEffect(() => {
    if (!data || data.page !== page) return;

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
  }, [data, page]);

  useEffect(() => {
    if (touchedOnceRef.current || !data) return;

    if ((data.untouchedCount || 0) > 0 && !markTouched.isPending) {
      touchedOnceRef.current = true;
      markTouched.mutate();
    }
  }, [data, markTouched]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          requestNextPage();
        }
      },
      { rootMargin: "180px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasNextPage, isFetching, requestNextPage]);

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || markAllRead.isPending) return;
    setSelectedReadIds(
      new Set(loadedNotifications.map((notification) => notification.id)),
    );
    markAllRead.mutate();
  };

  const handleNotificationClick = (notification: NotificationEntry) => {
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
    }
  };

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl space-y-4 px-0 py-2",
        "sm:space-y-6 sm:p-4 md:p-6",
      )}
    >
      <Card className="overflow-hidden rounded-xl border-border shadow-md">
        <CardHeader
          className={cn(
            "flex flex-col gap-4 border-b p-4 sm:flex-row",
            "sm:items-center sm:justify-between sm:p-6",
          )}
        >
          <div className="min-w-0">
            <CardTitle
              className={cn(
                "flex items-center gap-2 text-lg font-semibold sm:text-xl",
              )}
            >
              <Bell className="h-5 w-5 shrink-0 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription className="mt-1 text-sm leading-relaxed">
              Stay up to date with the latest activities and alerts.
            </CardDescription>
          </div>

          {unreadCount > 0 && (
            <Button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className="gap-1.5 min-h-11 w-full sm:w-auto"
            >
              <CheckCheck className="h-4 w-4" />
              <span>
                {markAllRead.isPending ? "Marking..." : "Mark all as read"}
              </span>
            </Button>
          )}
        </CardHeader>

        {/* Filter Bar */}
        <div
          className={cn(
            "flex items-center gap-1 border-b border-border bg-muted/20",
            "p-2 sm:px-6 sm:py-2.5",
          )}
        >
          <div
            className={cn(
              "flex w-full max-w-xs gap-1 rounded-lg bg-muted/50 p-1",
            )}
          >
            <NotificationFilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All
            </NotificationFilterButton>
            <NotificationFilterButton
              active={filter === "unread"}
              onClick={() => setFilter("unread")}
            >
              Unread
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className={cn(
                    "ml-1.5 h-4 min-w-4 px-1 text-[10px] font-bold",
                  )}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </NotificationFilterButton>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading && loadedNotifications.length === 0 ? (
            <div className="space-y-3 p-4 sm:p-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border",
                    "border-border/40 animate-pulse bg-muted/20 p-3",
                  )}
                >
                  <div
                    className="h-10 w-10 shrink-0 rounded-full bg-muted/60"
                  />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="h-4 w-1/3 rounded bg-muted/60" />
                    <div className="h-3 w-3/4 rounded bg-muted/40" />
                    <div className="h-2.5 w-1/4 rounded bg-muted/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadedNotifications.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center py-16",
                "text-center",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  "bg-muted/50 text-muted-foreground",
                )}
              >
                <BellOff className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                No {filter === "unread" ? "unread " : ""}notifications
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {filter === "unread"
                  ? "You have no unread notifications."
                  : "You're all caught up! No notifications to display."}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 p-3 sm:p-6">
              {loadedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isSelectedRead={selectedReadIds.has(notification.id)}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="min-h-1" />

          {hasNextPage && loadedNotifications.length > 0 && (
            <div className="border-t border-border p-4 sm:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={requestNextPage}
                disabled={isFetching}
                className="h-11 w-full rounded-xl shadow-md"
              >
                {isFetching ? "Loading..." : "Load more notifications"}
              </Button>
            </div>
          )}

          {isFetching && loadedNotifications.length > 0 && (
            <div
              className={cn(
                "border-t border-border p-4 text-center text-xs font-medium",
                "text-muted-foreground",
              )}
            >
              Loading more notifications...
            </div>
          )}

          {!hasNextPage && loadedNotifications.length > 0 && (
            <div
              className={cn(
                "border-t border-border p-4 text-center text-[11px]",
                "font-medium text-muted-foreground",
              )}
            >
              You are all caught up.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

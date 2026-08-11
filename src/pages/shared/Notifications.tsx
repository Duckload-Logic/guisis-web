import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { usePageMetadata, useAuth } from "@/context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  formatNotificationTime,
  getIconForNotificationType,
  getNotificationIconClass,
  getNotificationTargetUrl,
} from "@/features/notifications/utils";

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
    <div className="mx-auto w-full max-w-5xl space-y-4 px-0 py-2 sm:space-y-6 sm:p-4 md:p-6">
      <Card className="overflow-hidden rounded-xl border-border shadow-md">
        <CardHeader className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold sm:text-xl">
              <Bell className="h-5 w-5 shrink-0 text-primary" />
              Recent Notifications
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
              className="min-h-11 w-full border-primary sm:w-auto"
            >
              {markAllRead.isPending ? "Marking..." : "Mark all as read"}
            </Button>
          )}
        </CardHeader>

        <div className="flex gap-2 border-b border-border px-4 py-3 text-sm sm:px-6">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All
          </FilterButton>
          <FilterButton
            active={filter === "unread"}
            onClick={() => setFilter("unread")}
          >
            Unread
            {unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </FilterButton>
        </div>

        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading && loadedNotifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : loadedNotifications.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No {filter === "unread" ? "unread " : ""}notifications found.
              </div>
            ) : (
              loadedNotifications.map((notification) => (
                <div key={notification.id} className="px-2 py-1 sm:px-3">
                  <NotificationItem
                    notification={notification}
                    isSelectedRead={selectedReadIds.has(notification.id)}
                    onClick={handleNotificationClick}
                  />
                </div>
              ))
            )}
          </div>

          <div ref={loadMoreRef} className="min-h-1" />

          {hasNextPage && loadedNotifications.length > 0 && (
            <div className="border-t border-border px-4 py-3 sm:hidden">
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
            <div className="border-t border-border p-4 text-center text-xs font-medium text-muted-foreground">
              Loading more notifications...
            </div>
          )}

          {!hasNextPage && loadedNotifications.length > 0 && (
            <div className="border-t border-border p-4 text-center text-[11px] font-medium text-muted-foreground">
              You are all caught up.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "relative min-h-11 rounded-xl px-3 font-medium shadow-none",
        active
          ? "bg-primary/10 text-primary shadow-md"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {children}
    </Button>
  );
}

function NotificationItem({
  notification,
  isSelectedRead,
  onClick,
}: {
  notification: NotificationEntry;
  isSelectedRead: boolean;
  onClick: (notification: NotificationEntry) => void;
}) {
  const { icon: Icon, color } = getIconForNotificationType(
    notification.type || "",
    notification.targetType || "",
  );
  const unread = !notification.isRead && !isSelectedRead;
  const highlightedRead = isSelectedRead || notification.isRead;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onClick(notification)}
      className={cn(
        "group flex min-h-11 w-full cursor-pointer items-start justify-start text-left",
        "gap-3 rounded-xl border p-4 shadow-md transition-colors duration-200",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        unread && "border-primary/15 bg-primary/5",
        highlightedRead &&
          "border-border/60 bg-muted/30 text-muted-foreground opacity-60",
      )}
    >
      <span
        className={cn(
          "mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full transition-colors",
          unread ? "bg-red-500 shadow-md" : "bg-transparent",
        )}
      />

      <span
        className={cn(
          "shrink-0 rounded-xl p-2.5 shadow-md",
          getNotificationIconClass(color),
          highlightedRead && "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block line-clamp-1 text-sm sm:text-base",
            unread
              ? "font-semibold text-foreground"
              : "font-medium text-muted-foreground",
          )}
        >
          {notification.title}
        </span>
        <span className="mt-1 block line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:line-clamp-none">
          {notification.message}
        </span>
        <span className="mt-2 block text-xs font-medium text-muted-foreground">
          {formatNotificationTime(notification.createdAt)}
        </span>
      </span>
    </Button>
  );
}

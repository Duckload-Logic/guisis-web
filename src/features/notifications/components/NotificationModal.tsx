import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useNotificationDropdown } from "../hooks/useNotificationDropdown";
import { NotificationFilterButton } from "./NotificationFilterButton";
import { NotificationItem } from "./NotificationItem";
import { PushNotificationBanner } from "./PushNotificationBanner";

interface Props {
  showNotifications: boolean;
  setShowNotifications: (value: boolean) => void;
}

export default function NotificationModal({
  showNotifications,
  setShowNotifications,
}: Props) {
  const {
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
  } = useNotificationDropdown({ showNotifications, setShowNotifications });

  if (!showNotifications || isMobile) return null;

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications dropdown"
      className={cn(
        "fixed right-3 top-[4.25rem] z-50 hidden w-[calc(100vw-1.5rem)]",
        "max-w-[28rem] flex-col overflow-hidden rounded-xl border",
        "border-border bg-card text-card-foreground shadow-md outline-none",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
        "sm:top-[5.25rem] md:right-24 md:flex lg:right-28",
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex gap-2 text-sm">
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
              <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-md">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NotificationFilterButton>
        </div>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="h-9 min-h-9 shrink-0 border-primary/40 px-3 text-xs"
          >
            {markAllRead.isPending ? "Marking..." : "Mark all read"}
          </Button>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="max-h-[26rem] flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-2.5"
      >
        {showPushBanner && (
          <PushNotificationBanner
            isPending={isPushPending}
            onSubscribe={handleSubscribePush}
          />
        )}

        {isLoading && loadedNotifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : loadedNotifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No {filter === "unread" ? "unread " : ""}notifications found.
          </div>
        ) : (
          loadedNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isSelectedRead={selectedReadIds.has(notification.id)}
              onClick={handleNotificationClick}
            />
          ))
        )}

        {isFetching && loadedNotifications.length > 0 && (
          <div className="py-3 text-center text-xs font-medium text-muted-foreground">
            Loading more notifications...
          </div>
        )}

        {!hasNextPage && loadedNotifications.length > 0 && (
          <div className="py-3 text-center text-[11px] font-medium text-muted-foreground">
            You are all caught up.
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <Button
          asChild
          type="button"
          variant="ghost"
          className={cn(
            "h-9 min-h-9 w-full rounded-xl text-sm font-medium text-primary",
            "hover:bg-primary/10 hover:text-primary",
          )}
        >
          <Link to={`/${rolePath}/notifications`} onClick={closeNotifications}>
            View All
          </Link>
        </Button>
      </div>
    </div>
  );
}

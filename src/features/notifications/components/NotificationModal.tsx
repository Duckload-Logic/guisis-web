import { Link } from "react-router-dom";
import { CheckCheck, BellOff, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        "absolute right-0 top-full z-[9999] mt-2 flex w-[calc(100vw-2rem)]",
        "max-w-[28rem] flex-col overflow-hidden rounded-2xl border",
        "border-border bg-card text-card-foreground shadow-2xl outline-none",
        "origin-top-right animate-popover-show sm:w-[26rem]",
      )}
    >
      {/* Header Bar */}
      <div className="border-b border-border/70 px-4 pb-2.5 pt-3.5">
        <div className="flex items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="h-4 min-w-4 px-1.5 text-[10px] font-bold"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
              className={cn(
                "h-7 gap-1.5 px-2 text-xs text-muted-foreground",
                "hover:text-foreground",
              )}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>
                {markAllRead.isPending ? "Marking..." : "Mark all read"}
              </span>
            </Button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex gap-1 rounded-lg bg-muted/40 p-1 text-xs">
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
            Unread{unreadCount > 0 ? ` (${unreadCount})` : ""}
          </NotificationFilterButton>
        </div>
      </div>

      {/* Scrollable Notification List */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={cn(
          "max-h-[25rem] flex-1 space-y-2 overflow-y-auto overscroll-contain",
          "p-2.5",
        )}
      >
        {showPushBanner && (
          <PushNotificationBanner
            isPending={isPushPending}
            onSubscribe={handleSubscribePush}
          />
        )}

        {/* Skeleton Loading State */}
        {isLoading && loadedNotifications.length === 0 ? (
          <div className="space-y-2.5 p-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border/40",
                  "animate-pulse bg-muted/20 p-3",
                )}
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-muted/60" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-muted/60" />
                  <div className="h-3 w-1/2 rounded bg-muted/40" />
                </div>
              </div>
            ))}
          </div>
        ) : loadedNotifications.length === 0 ? (
          /* Empty State */
          <div
            className={cn(
              "flex flex-col items-center justify-center py-10 text-center",
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                "bg-muted/50 text-muted-foreground",
              )}
            >
              <BellOff className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xs font-semibold text-foreground">
              No {filter === "unread" ? "unread " : ""}notifications
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              We will let you know when something arrives.
            </p>
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
          <div className="py-2.5 text-center text-xs text-muted-foreground">
            Loading more notifications...
          </div>
        )}

        {!hasNextPage && loadedNotifications.length > 0 && (
          <div
            className={cn(
              "py-2 text-center text-[11px] font-medium",
              "text-muted-foreground/80",
            )}
          >
            You are all caught up.
          </div>
        )}
      </div>

      {/* Footer Bar */}
      <div className="border-t border-border/70 p-2">
        <Button
          asChild
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-full justify-center gap-1.5 text-xs font-medium",
            "text-muted-foreground hover:bg-primary/5 hover:text-primary",
          )}
        >
          <Link
            to={`/${rolePath}/notifications`}
            onClick={closeNotifications}
          >
            <span>View all in notifications page</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

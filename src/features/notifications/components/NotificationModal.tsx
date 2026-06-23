import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  Shield,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useGetNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationsTouched,
} from "../hooks/useNotifications";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/hooks";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import type { NotificationEntry } from "../types";

const DROPDOWN_PAGE_SIZE = 6;

type NotificationIconTone = "blue" | "purple" | "green" | "red";

interface Props {
  showNotifications: boolean;
  setShowNotifications: (value: boolean) => void;
}

function formatNotificationTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (Number.isNaN(seconds)) return "Recently";
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

function getIconForNotificationType(type: string): {
  icon: LucideIcon;
  color: NotificationIconTone;
} {
  const normalizedType = type.toLowerCase();

  if (normalizedType.includes("appointment")) {
    return { icon: Calendar, color: "blue" };
  }
  if (normalizedType.includes("slip")) {
    return { icon: FileText, color: "purple" };
  }
  if (normalizedType.includes("user")) {
    return { icon: User, color: "green" };
  }
  if (normalizedType.includes("security") || normalizedType.includes("auth")) {
    return { icon: Shield, color: "red" };
  }
  if (normalizedType.includes("error") || normalizedType.includes("failed")) {
    return { icon: AlertTriangle, color: "red" };
  }
  if (normalizedType.includes("success")) {
    return { icon: CheckCircle, color: "green" };
  }

  return { icon: Info, color: "blue" };
}

function getNotificationIconClass(color: NotificationIconTone) {
  const colors: Record<NotificationIconTone, string> = {
    blue: "bg-blue-500/10 text-blue-500",
    purple: "bg-purple-500/10 text-purple-500",
    green: "bg-green-500/10 text-green-500",
    red: "bg-red-500/10 text-red-500",
  };

  return colors[color];
}

function getRolePath(roleName?: string) {
  const role = roleName?.toLowerCase().replace(/\s+/g, "") || "student";
  if (role === "admin" || role === "counselor") return "admin";
  if (role === "superadmin") return "superadmin";
  if (role === "developer") return "developer";
  return "student";
}

function getNotificationTargetUrl(
  notification: NotificationEntry,
  roleName?: string,
) {
  const rolePath = getRolePath(roleName);
  const nType = (notification.type || "").toLowerCase();
  const title = (notification.title || "").toLowerCase();
  const adminLikeRole = rolePath === "admin";

  if (nType.includes("appointment")) {
    return adminLikeRole && notification.targetId
      ? `/admin/appointments/${notification.targetId}`
      : `/${rolePath}/appointments`;
  }

  if (nType.includes("slip")) {
    return adminLikeRole && notification.targetId
      ? `/admin/slips/${notification.targetId}`
      : `/${rolePath}/slips`;
  }

  if (nType.includes("user") && adminLikeRole && notification.targetId) {
    return `/admin/student-records/${notification.targetId}`;
  }

  if (nType.includes("system") || title.includes("m2m")) {
    if (rolePath === "developer") return "/developer";
    if (rolePath === "superadmin") return "/superadmin/m2m-management";
  }

  return "";
}

export default function NotificationModal({
  showNotifications,
  setShowNotifications,
}: Props) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const markTouched = useMarkNotificationsTouched();
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();

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

  const closeNotifications = useCallback(() => {
    if ((data?.untouchedCount || 0) > 0 && !markTouched.isPending) {
      markTouched.mutate();
    }
    setShowNotifications(false);
  }, [data?.untouchedCount, markTouched, setShowNotifications]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (data?.totalPages && page > data.totalPages) {
      setPage(Math.max(data.totalPages, 1));
    }
  }, [data?.totalPages, page]);

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

  const handleSubscribePush = async () => {
    try {
      await subscribePush();
    } catch (err) {
      console.error("Failed to subscribe push notifications:", err);
    }
  };

  if (!showNotifications || isMobile) return null;

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const totalPages = Math.max(data?.totalPages || 1, 1);
  const currentPage = data?.page || page;
  const roleName = activeRole?.name || user?.roles?.[0]?.name || "student";
  const rolePath = getRolePath(roleName);
  const showPushBanner =
    isPushSupported && pushPermission === "default" && !isPushSubscribed;

  const handleMarkAllRead = () => {
    if (unreadCount === 0 || markAllRead.isPending) return;
    markAllRead.mutate();
  };

  const handleNotificationClick = (notification: NotificationEntry) => {
    if (!notification.isRead && !markRead.isPending) {
      markRead.mutate(notification.id);
    }

    const url = getNotificationTargetUrl(notification, roleName);
    if (url) {
      navigate(url);
      closeNotifications();
    }
  };

  const handleNextPage = () => {
    if (page < totalPages && !isFetching) setPage((value) => value + 1);
  };

  const handlePreviousPage = () => {
    if (page > 1 && !isFetching) setPage((value) => value - 1);
  };

  return (
    <div
      ref={dropdownRef}
      role="dialog"
      aria-label="Notifications dropdown"
      className={cn(
        "fixed right-3 top-[4.25rem] z-50 hidden w-[calc(100vw-1.5rem)]",
        "max-w-[28rem] flex-col overflow-hidden rounded-2xl border",
        "border-border bg-card text-card-foreground shadow-2xl outline-none",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
        "sm:right-6 sm:top-[5.25rem] md:flex lg:right-8",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Bell className="h-4 w-4 shrink-0 text-primary" />
            Notifications
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            The bell badge clears after closing this dropdown.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={closeNotifications}
          className="-mr-2 -mt-2 h-9 w-9 shrink-0"
          aria-label="Close notifications"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex gap-2 text-sm">
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
              <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </FilterButton>
        </div>

        {unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending}
            className="h-9 shrink-0 px-3 text-xs"
          >
            {markAllRead.isPending ? "Marking..." : "Mark all read"}
          </Button>
        )}
      </div>

      <div className="max-h-[24rem] flex-1 space-y-2 overflow-y-auto overscroll-contain p-3">
        {showPushBanner && (
          <div
            className={cn(
              "rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-sm",
              "transition hover:bg-primary/10",
            )}
          >
            <div className="flex items-start gap-3">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  Enable Background Notifications
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Receive urgent status updates even when PUPT-GuiSIS is closed.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleSubscribePush}
              disabled={isPushPending}
              className="mt-3 h-9 w-full"
            >
              {isPushPending ? "Enabling..." : "Enable"}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No {filter === "unread" ? "unread " : ""}notifications found.
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={handleNotificationClick}
            />
          ))
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1 || isFetching}
            className="h-9 w-9"
            aria-label="Previous notification page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[4.5rem] text-center text-xs text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isFetching}
            className="h-9 w-9"
            aria-label="Next notification page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Link
          to={`/${rolePath}/notifications`}
          onClick={closeNotifications}
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-lg px-3",
            "text-sm font-medium text-primary transition hover:bg-primary/10",
          )}
        >
          View All
        </Link>
      </div>
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex h-9 items-center rounded-lg px-3 font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: NotificationEntry;
  onClick: (notification: NotificationEntry) => void;
}) {
  const { icon: Icon, color } = getIconForNotificationType(
    notification.type || "",
  );
  const unread = !notification.isRead;

  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={cn(
        "group flex min-h-11 w-full cursor-pointer items-start text-left",
        "gap-3 rounded-xl p-3 transition-colors duration-200 hover:bg-muted/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        unread ? "bg-primary/5" : "opacity-75",
      )}
    >
      <span
        className={cn(
          "mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full transition-colors",
          unread ? "bg-red-500 shadow-sm" : "bg-transparent",
        )}
      />

      <div
        className={cn(
          "shrink-0 rounded-xl p-2.5",
          getNotificationIconClass(color),
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "line-clamp-1 text-sm",
            unread ? "font-semibold text-foreground" : "font-medium",
          )}
        >
          {notification.title}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
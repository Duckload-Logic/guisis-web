import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  FileText,
  Info,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import { usePageMetadata, useAuth } from "@/context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";
import {
  useGetNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMarkNotificationsTouched,
  useNotificationsStream,
} from "@/features/notifications/hooks/useNotifications";
import type { NotificationEntry } from "@/features/notifications/types";

const PAGE_SIZE = 10;

type NotificationIconTone = "blue" | "purple" | "green" | "red";

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

export default function NotificationsPage() {
  usePageMetadata({
    title: "Notifications",
    description: "View all your system activities and alerts.",
    badgeText: "Account",
  });

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
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
  const touchedOnceRef = useRef(false);
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (data?.totalPages && page > data.totalPages) {
      setPage(Math.max(data.totalPages, 1));
    }
  }, [data?.totalPages, page]);

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const totalPages = Math.max(data?.totalPages || 1, 1);
  const currentPage = data?.page || page;
  const roleName = activeRole?.name || user?.roles?.[0]?.name || "student";
  const rolePath = getRolePath(roleName);
  const fromPath = (location.state as { from?: string } | null)?.from;

  useEffect(() => {
    if (touchedOnceRef.current || !data) return;

    if ((data.untouchedCount || 0) > 0 && !markTouched.isPending) {
      touchedOnceRef.current = true;
      markTouched.mutate();
    }
  }, [data, markTouched]);

  const handleBack = () => {
    if (fromPath) {
      navigate(fromPath);
      return;
    }

    navigate(`/${rolePath}`);
  };

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
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-0 py-2 sm:space-y-6 sm:p-4 md:p-6">
      <Button
        type="button"
        variant="ghost"
        onClick={handleBack}
        className="inline-flex min-h-11 items-center gap-2 px-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card className="overflow-hidden border-border shadow-sm">
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
              className="min-h-11 w-full sm:w-auto"
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
              <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </FilterButton>
        </div>

        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No {filter === "unread" ? "unread " : ""}notifications found.
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className="px-2 py-1 sm:px-3">
                  <NotificationItem
                    notification={notification}
                    onClick={handleNotificationClick}
                  />
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              isLoading={isFetching}
              className="border-t border-border px-4 sm:px-6"
            />
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex min-h-11 items-center rounded-lg px-3 font-medium",
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
        "gap-3 rounded-xl p-4 transition-colors duration-200 hover:bg-muted/60",
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
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "line-clamp-1 text-sm sm:text-base",
            unread ? "font-semibold text-foreground" : "font-medium",
          )}
        >
          {notification.title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:line-clamp-none">
          {notification.message}
        </p>
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
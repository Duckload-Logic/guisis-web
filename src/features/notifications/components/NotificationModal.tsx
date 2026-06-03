import { useState } from "react";
import {
  Calendar,
  FileText,
  Bell,
  User,
  Shield,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveModal,
  ResponsiveModalContent,
} from "@/components/ui/responsive-modal";
import {
  useGetNotifications,
  useMarkNotificationRead,
  useNotificationsStream,
} from "../hooks/useNotifications";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/hooks";
import { cn } from "@/lib/utils";

// Simple relative time formatter
function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

// Icon mapper
function getIconForType(type: string) {
  const t = type.toLowerCase();
  if (t.includes("appointment")) return { icon: Calendar, color: "blue" };
  if (t.includes("slip")) return { icon: FileText, color: "purple" };
  if (t.includes("user")) return { icon: User, color: "green" };
  if (t.includes("security") || t.includes("auth"))
    return { icon: Shield, color: "red" };
  if (t.includes("error") || t.includes("failed"))
    return { icon: AlertTriangle, color: "red" };
  if (t.includes("success")) return { icon: CheckCircle, color: "green" };
  return { icon: Info, color: "blue" };
}

interface Props {
  showNotifications: boolean;
  setShowNotifications: (value: boolean) => void;
}

export default function NotificationModal({
  showNotifications,
  setShowNotifications,
}: Props) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  useNotificationsStream();
  const { data, isLoading } = useGetNotifications();
  const markRead = useMarkNotificationRead();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    isSupported: isPushSupported,
    permission: pushPermission,
    isSubscribed: isPushSubscribed,
    isPending: isPushPending,
    subscribe: subscribePush,
  } = usePushNotifications();

  const handleSubscribePush = async () => {
    try {
      await subscribePush();
    } catch (err) {
      console.error("Failed to subscribe push notifications:", err);
    }
  };

  const showPushBanner =
    isPushSupported && pushPermission === "default" && !isPushSubscribed;

  if (!showNotifications) return null;

  const notifications = data?.notifications;
  const displayList =
    notifications?.filter((n) => (filter === "all" ? true : !n.isRead)) || [];
  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const handleMarkAllRead = async () => {
    if (!notifications) return;
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    await Promise.allSettled(unreadIds.map((id) => markRead.mutateAsync(id)));
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead && !markRead.isPending) {
      markRead.mutate(notif.id);
    }

    const role = user?.roles?.[0]?.name?.toLowerCase() || "student";
    let url = "";
    const nType = (notif.type || "").toLowerCase();

    if (nType.includes("appointment")) {
      url =
        role === "admin" && notif.targetId
          ? `/admin/appointments/${notif.targetId}`
          : `/${role}/appointments`;
    } else if (nType.includes("slip")) {
      url =
        role === "admin" && notif.targetId
          ? `/admin/slips/${notif.targetId}`
          : `/${role}/slips`;
    } else if (nType.includes("user") && role === "admin" && notif.targetId) {
      url = `/admin/student-records/${notif.targetId}`;
    } else if (
      nType.includes("system") ||
      (notif.title || "").toLowerCase().includes("m2m")
    ) {
      if (role === "developer") {
        url = "/developer";
      } else if (role === "superadmin") {
        url = "/superadmin/m2m-management";
      }
    }

    if (url) {
      navigate(url);
      setShowNotifications(false);
    }
  };

  return (
    <ResponsiveModal
      open={showNotifications}
      onOpenChange={setShowNotifications}
    >
      <ResponsiveModalContent
        hasCloseButton={false}
        className={cn(
          "flex h-[85vh] w-full flex-col overflow-hidden border-border",
          "bg-card p-0 shadow-2xl outline-none sm:h-[75vh]",
          "md:max-w-[60%]",
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Bell
                size={16}
                className="text-primary"
              />
              Notifications
            </h2>

            <p className="text-xs text-muted-foreground">
              Stay updated with system activity
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markRead.isPending}
                className={cn(
                  "mr-10 text-xs text-muted-foreground transition",
                  "hover:text-primary disabled:opacity-50",
                )}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-6 border-b border-border px-6 py-3 text-sm">
          <button
            onClick={() => setFilter("all")}
            className={`font-medium transition-colors ${filter === "all" ? "relative text-primary after:absolute after:-bottom-[13px] after:left-0 after:h-[2px] after:w-full after:bg-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("unread")}
            className={`flex items-center gap-2 font-medium transition-colors ${filter === "unread" ? "relative text-primary after:absolute after:-bottom-[13px] after:left-0 after:h-[2px] after:w-full after:bg-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            Unread
            {unreadCount > 0 && filter === "all" && (
              <span
                className={cn(
                  "flex h-5 min-w-[20px] items-center justify-center",
                  "rounded-full bg-red-500 px-1 text-[10px] text-white",
                )}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className={cn(
          "flex-1 space-y-1 overflow-y-auto scroll-smooth px-3 py-2",
        )}>
          {showPushBanner && (
            <div className={cn(
              "mx-3 my-2 flex flex-col gap-3 rounded-xl border border-primary/20",
              "bg-primary/5 p-4 shadow-sm transition hover:bg-primary/10",
            )}>
              <div className="flex items-start gap-3">
                <Bell className="mt-0.5 shrink-0 text-primary" size={18} />
                <div className="flex-1">
                  <p className="text-xs font-semibold">
                    Enable Background Notifications
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Receive urgent status updates on appointments and slips
                    even when DLL Guidance is closed.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleSubscribePush}
                  disabled={isPushPending}
                  className={cn(
                    "rounded-lg bg-primary px-3 py-1 text-xs font-medium",
                    "text-primary-foreground hover:bg-primary/90",
                    "transition-colors disabled:opacity-50",
                  )}
                >
                  {isPushPending ? "Enabling..." : "Enable"}
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading notifications...
            </div>
          ) : displayList.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No {filter === "unread" ? "unread " : ""}notifications found.
            </div>
          ) : (
            displayList.map((notif) => {
              const { icon, color } = getIconForType(notif.type || "");
              return (
                <NotificationItem
                  key={notif.id}
                  icon={icon}
                  color={color}
                  title={notif.title}
                  description={notif.message}
                  time={formatTimeAgo(notif.createdAt)}
                  unread={!notif.isRead}
                  onClick={() => handleNotificationClick(notif)}
                />
              );
            })
          )}
        </div>

        <div className="border-t border-border p-4 text-center">
          <Link
            to={`/${user?.roles?.[0]?.name?.toLowerCase().replace(/\s+/g, "") || "student"}/notifications`}
            onClick={() => setShowNotifications(false)}
            className="inline-block w-full text-sm text-primary transition hover:underline"
          >
            View All Notifications
          </Link>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}

interface NotificationItemProps {
  icon: any;
  color: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  onClick: () => void;
}

function NotificationItem({
  icon: Icon,
  color,
  title,
  description,
  time,
  unread,
  onClick,
}: NotificationItemProps) {
  const colors: Record<string, string> = {
    blue: "text-blue-500 bg-blue-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    green: "text-green-500 bg-green-500/10",
    red: "text-red-500 bg-red-500/10",
  };

  const colorClass = colors[color] || colors.blue;

  return (
    <div
      onClick={onClick}
      className={`group flex cursor-pointer items-start gap-4 rounded-xl p-4 transition-colors duration-200 hover:bg-muted/60 ${
        unread ? "" : "opacity-70"
      }`}
    >
      <span
        className={`mt-2 h-2 w-2 shrink-0 rounded-full transition-colors ${unread ? "bg-red-500 shadow-sm" : "bg-transparent"}`}
      />

      <div className={`shrink-0 rounded-lg p-2 ${colorClass}`}>
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>

        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {description}
        </p>

        <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
          {time}
        </p>
      </div>
    </div>
  );
}

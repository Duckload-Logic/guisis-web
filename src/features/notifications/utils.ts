import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
  Info,
  MessageSquare,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import type { NotificationEntry } from "./types";

export type NotificationIconTone = "blue" | "purple" | "green" | "red";

export function formatNotificationTime(dateString: string) {
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

export function getIconForNotificationType(
  type: string,
  targetType?: string,
): {
  icon: LucideIcon;
  color: NotificationIconTone;
} {
  const normalizedType = type.toLowerCase();
  const normalizedTarget = (targetType || "").toLowerCase();

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

  if (
    normalizedType.includes("support") ||
    normalizedTarget === "supportticket"
  ) {
    return { icon: MessageSquare, color: "blue" };
  }

  return { icon: Info, color: "blue" };
}

export function getNotificationIconClass(color: NotificationIconTone) {
  const colors: Record<NotificationIconTone, string> = {
    blue: "bg-blue-500/10 text-blue-500",
    purple: "bg-purple-500/10 text-purple-500",
    green: "bg-green-500/10 text-green-500",
    red: "bg-red-500/10 text-red-500",
  };

  return colors[color];
}

export function getRolePath(roleName?: string) {
  const role = roleName?.toLowerCase().replace(/\s+/g, "") || "student";
  if (role === "admin" || role === "counselor") return "admin";
  if (role === "superadmin") return "superadmin";
  if (role === "developer") return "developer";
  return "student";
}

export function getNotificationTargetUrl(
  notification: NotificationEntry,
  roleName?: string,
) {
  const rolePath = getRolePath(roleName);
  const notificationType = (notification.type || "").toLowerCase();
  const targetType = (notification.targetType || "").toLowerCase();
  const title = (notification.title || "").toLowerCase();
  const adminLikeRole = rolePath === "admin";

  if (
    notificationType.includes("support") ||
    targetType === "supportticket" ||
    title.includes("support")
  ) {
    if (rolePath === "student") {
      const tid = notification.targetId || "";
      return `/student?openSupport=true&ticketId=${tid}`;
    }
    return `/${rolePath}/support`;
  }

  if (notificationType.includes("appointment")) {
    return adminLikeRole && notification.targetId
      ? `/admin/appointments/${notification.targetId}`
      : `/${rolePath}/appointments`;
  }

  if (notificationType.includes("slip")) {
    return adminLikeRole && notification.targetId
      ? `/admin/slips/${notification.targetId}`
      : `/${rolePath}/slips`;
  }

  if (notificationType.includes("user") && adminLikeRole && notification.targetId) {
    return `/admin/student-records/${notification.targetId}`;
  }

  if (notificationType.includes("system") || title.includes("m2m")) {
    if (rolePath === "developer") return "/developer";
    if (rolePath === "superadmin") return "/superadmin/m2m-management";
  }

  return "";
}

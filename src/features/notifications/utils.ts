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
  if (role === "studentassistant" || role === "assistant") return "assistant";
  if (role === "superadmin") return "superadmin";
  if (role === "developer") return "developer";
  return "student";
}

export function extractTargetId(notification: NotificationEntry): string {
  const direct =
    notification.targetId ||
    (notification as { target_id?: string }).target_id ||
    (notification as { targetID?: string }).targetID;

  if (typeof direct === "string" && direct.trim() !== "") {
    return direct.trim();
  }

  const text = `${notification.title || ""} ${notification.message || ""}`;

  const uuidMatch = text.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  if (uuidMatch) {
    return uuidMatch[0];
  }

  const codeMatch = text.match(/\b(SLIP-[A-Z0-9]+)\b/i);
  if (codeMatch) {
    return codeMatch[1];
  }

  const hashMatch = text.match(/#([a-zA-Z0-9_-]+)/);
  if (hashMatch) {
    return hashMatch[1];
  }

  return "";
}

export function getNotificationTargetUrl(
  notification: NotificationEntry,
  roleName?: string,
) {
  const rolePath = getRolePath(roleName);
  const notificationType = (notification.type || "").toLowerCase();
  const targetType = (notification.targetType || "").toLowerCase();
  const title = (notification.title || "").toLowerCase();
  const targetId = extractTargetId(notification);

  if (
    notificationType.includes("support") ||
    targetType === "supportticket" ||
    title.includes("support")
  ) {
    if (rolePath === "student") {
      return targetId
        ? `/student?openSupport=true&ticketId=${targetId}`
        : "/student?openSupport=true";
    }
    return targetId
      ? `/${rolePath}/support?ticketId=${targetId}`
      : `/${rolePath}/support`;
  }

  const isAppointment =
    notificationType.includes("appointment") ||
    targetType === "appointment" ||
    title.includes("appointment");

  if (isAppointment) {
    if (targetId && (rolePath === "admin" || rolePath === "student")) {
      return `/${rolePath}/appointments/${targetId}`;
    }
    return `/${rolePath}/appointments`;
  }

  const isSlip =
    notificationType.includes("slip") ||
    targetType === "slip" ||
    title.includes("slip");

  if (isSlip) {
    if (
      targetId &&
      (rolePath === "admin" ||
        rolePath === "assistant" ||
        rolePath === "student")
    ) {
      return `/${rolePath}/slips/${targetId}`;
    }
    return `/${rolePath}/slips`;
  }

  const isStudentRecord =
    notificationType.includes("user") ||
    notificationType.includes("student") ||
    targetType === "student" ||
    targetType === "user";

  if (isStudentRecord && rolePath === "admin" && targetId) {
    return `/admin/student-records/${targetId}`;
  }

  if (notificationType.includes("system") || title.includes("m2m")) {
    if (rolePath === "developer") return "/developer";
    if (rolePath === "superadmin") return "/superadmin/m2m-management";
  }

  return "";
}

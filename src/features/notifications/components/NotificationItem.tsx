import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { NotificationEntry } from "../types";
import {
  formatNotificationTime,
  getIconForNotificationType,
  getNotificationIconClass,
} from "../utils";

interface NotificationItemProps {
  notification: NotificationEntry;
  isSelectedRead: boolean;
  onClick: (notification: NotificationEntry) => void;
}

export function NotificationItem({
  notification,
  isSelectedRead,
  onClick,
}: NotificationItemProps) {
  const { icon: Icon, color } = getIconForNotificationType(
    notification.type || "",
  );

  const unread = !notification.isRead && !isSelectedRead;
  const highlightedRead = isSelectedRead || notification.isRead;

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onClick(notification)}
      className={cn(
        "group relative flex h-auto min-h-[88px] w-full cursor-pointer items-center justify-start gap-3",
        "rounded-xl border px-3 py-3 text-left shadow-md transition-all duration-200",
        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        unread && "border-primary/15 bg-primary/5",
        highlightedRead && "border-red-500/20 bg-red-500/10 text-foreground",
      )}
    >
      <div className="flex w-3 shrink-0 items-center justify-center">
        {unread && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
      </div>

      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md",
          getNotificationIconClass(color),
          highlightedRead && "bg-red-500/10 text-red-600",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "line-clamp-1 text-sm leading-5 text-foreground",
            unread ? "font-semibold" : "font-medium",
          )}
        >
          {notification.title}
        </p>

        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {notification.message}
        </p>

        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </Button>
  );
}

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getProfilePictureUrl } from "@/lib/profilePicture";
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

function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function NotificationItem({
  notification,
  isSelectedRead,
  onClick,
}: NotificationItemProps) {
  const { icon: Icon, color } = getIconForNotificationType(
    notification.type || "",
    notification.targetType || "",
  );

  const unread = !notification.isRead && !isSelectedRead;
  const highlightedRead = isSelectedRead || notification.isRead;

  const hasActor = Boolean(
    notification.actorId ||
      notification.actorName ||
      notification.actorProfilePicture,
  );
  const avatarUrl = getProfilePictureUrl(notification.actorProfilePicture);
  const initials = getInitials(notification.actorName);

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onClick(notification)}
      className={cn(
        "group relative flex h-auto min-h-[84px] w-full cursor-pointer",
        "items-start justify-start gap-3 rounded-xl border p-3 text-left",
        "shadow-sm transition-all duration-200 hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring",
        unread && "border-primary/20 bg-primary/5",
        highlightedRead &&
          "border-border/60 bg-muted/20 text-muted-foreground opacity-85",
      )}
    >
      <div
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center",
        )}
      >
        {hasActor ? (
          <>
            <Avatar
              className={cn(
                "h-10 w-10 rounded-full border border-border/60",
                highlightedRead && "opacity-85",
              )}
            >
              <AvatarImage
                src={avatarUrl}
                alt={notification.actorName || "Actor"}
                className="object-cover"
              />
              <AvatarFallback
                className={cn(
                  "text-xs font-bold",
                  getNotificationIconClass(color),
                )}
              >
                {initials}
              </AvatarFallback>
            </Avatar>

            <span
              className={cn(
                "absolute -bottom-1 -right-1 flex h-4 w-4 items-center",
                "justify-center rounded-full border-2 border-background",
                "shadow-sm",
                getNotificationIconClass(color),
              )}
            >
              <Icon className="h-2 w-2" />
            </span>
          </>
        ) : (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              "shadow-sm",
              getNotificationIconClass(color),
              highlightedRead && "bg-muted/80 text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "line-clamp-1 text-sm leading-tight text-foreground",
              unread ? "font-semibold" : "font-medium text-foreground/70",
            )}
          >
            {notification.title}
          </p>
          {unread && (
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
              aria-label="Unread"
            />
          )}
        </div>

        <p
          className={cn(
            "mt-1 line-clamp-2 text-xs leading-4",
            highlightedRead
              ? "text-muted-foreground/85"
              : "text-muted-foreground",
          )}
        >
          {notification.message}
        </p>

        <p
          className={cn(
            "mt-1.5 text-[11px] font-medium",
            highlightedRead
              ? "text-muted-foreground/80"
              : "text-muted-foreground",
          )}
        >
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </Button>
  );
}

import { Bell } from "lucide-react";
import {
  useGetNotifications,
  useNotificationsStream,
} from "../hooks/useNotifications";
import { cn } from "@/lib/utils";

interface Props {
  showNotifications: boolean;
  setShowNotifications: (value: boolean) => void;
}

export default function NotificationBell({
  showNotifications,
  setShowNotifications,
}: Props) {
  useNotificationsStream();

  const { data } = useGetNotifications({ page: 1, pageSize: 1 });
  const fallbackUntouchedCount =
    data?.notifications?.filter((notification) => !notification.isTouched)
      .length || 0;
  const untouchedCount = data?.untouchedCount ?? fallbackUntouchedCount;

  return (
    <button
      type="button"
      onClick={() => setShowNotifications(!showNotifications)}
      aria-label="Open notifications"
      aria-expanded={showNotifications}
      className={cn(
        "group relative rounded-lg p-2 text-foreground transition-colors",
        "duration-300 hover:bg-muted/30",
      )}
    >
      <Bell
        className={cn(
          "h-[1.15rem] w-[1.15rem] transition-transform duration-300",
          "group-hover:-rotate-12 group-hover:scale-110 group-hover:text-primary",
        )}
      />

      {untouchedCount > 0 && (
        <span
          className={cn(
            "absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center",
            "justify-center rounded-full bg-red-500 px-1 text-[10px]",
            "font-medium leading-none text-white shadow-md",
          )}
        >
          {untouchedCount > 99 ? "99+" : untouchedCount}
        </span>
      )}
    </button>
  );
}


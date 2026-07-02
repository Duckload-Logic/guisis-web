import { Bell } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useGetNotifications,
  useNotificationsStream,
} from "../hooks/useNotifications";
import { useAuth } from "@/context/hooks";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getRolePath } from "../utils";

interface Props {
  showNotifications: boolean;
  setShowNotifications: (value: boolean) => void;
}

export default function NotificationBell({
  showNotifications,
  setShowNotifications,
}: Props) {
  useNotificationsStream();

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, activeRole } = useAuth();

  const { data } = useGetNotifications({ page: 1, pageSize: 1 });
  const fallbackUntouchedCount =
    data?.notifications?.filter((notification) => !notification.isTouched)
      .length || 0;
  const untouchedCount = data?.untouchedCount ?? fallbackUntouchedCount;

  const handleClick = () => {
    if (isMobile) {
      const roleName = activeRole?.name || user?.roles?.[0]?.name || "student";
      const rolePath = getRolePath(roleName);

      setShowNotifications(false);
      navigate(`/${rolePath}/notifications`, {
        state: { from: location.pathname },
      });
      return;
    }

    setShowNotifications(!showNotifications);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-notification-trigger="true"
      onClick={handleClick}
      aria-label={isMobile ? "Go to notifications" : "Open notifications"}
      aria-expanded={!isMobile && showNotifications}
      className={cn(
        "group relative h-11 w-11 rounded-xl p-2 text-foreground",
        "duration-300 hover:bg-muted/30 hover:shadow-md",
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
    </Button>
  );
}

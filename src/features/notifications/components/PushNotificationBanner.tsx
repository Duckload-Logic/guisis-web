import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PushNotificationBannerProps {
  isPending: boolean;
  onSubscribe: () => void;
}

export function PushNotificationBanner({
  isPending,
  onSubscribe,
}: PushNotificationBannerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/20 bg-primary/5 p-3 shadow-md",
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
        onClick={onSubscribe}
        disabled={isPending}
        className="mt-3 h-9 min-h-9 w-full border-primary"
      >
        {isPending ? "Enabling..." : "Enable"}
      </Button>
    </div>
  );
}

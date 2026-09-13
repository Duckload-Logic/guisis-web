import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationFilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function NotificationFilterButton({
  active,
  onClick,
  children,
  className,
}: NotificationFilterButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "relative h-7 flex-1 rounded-md px-3 text-xs font-medium",
        "transition-all",
        active
          ? "bg-background font-semibold text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
        className,
      )}
    >
      {children}
    </Button>
  );
}

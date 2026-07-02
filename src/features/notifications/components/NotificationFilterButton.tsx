import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationFilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function NotificationFilterButton({
  active,
  onClick,
  children,
}: NotificationFilterButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "relative h-9 min-h-9 rounded-xl px-3 font-medium shadow-none",
        active
          ? "bg-primary/10 text-primary shadow-md"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      {children}
    </Button>
  );
}

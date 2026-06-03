import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { ToastItem } from "@/context";

interface Props {
  toasts: ToastItem[];
  icon?: React.ReactNode;
}

const ICON_SIZE = 20;

export default function Toast({
  toasts,
  icon = (
    <Bell
      size={ICON_SIZE}
      className="text-primary"
    />
  ),
}: Props) {
  const visibleToasts = toasts.slice(-5);

  return (
    <div
      className={cn(
        "fixed right-6 top-24 z-[99999]",
        "flex flex-col-reverse gap-3",
      )}
    >
      {visibleToasts.map((toast, index) => {
        const age = visibleToasts.length - 1 - index;
        const opacity = Math.max(0.2, 1 - age * 0.2);

        return (
          <div
            key={toast.id}
            style={{ opacity }}
            className={cn(
              "flex animate-toast-slide-in-right items-center gap-3",
              "rounded-xl border-glass-border bg-card px-5 py-3 text-sm",
              "cursor-default shadow-xl transition-opacity duration-300",
              "max-w-[20rem]",
            )}
          >
            <div className="flex-shrink-0 origin-top animate-ring">{icon}</div>
            {toast.message}
          </div>
        );
      })}
    </div>
  );
}

import { cn } from "@/lib/utils";

interface IIRProgressPillProps {
  completion: number;
}

export function IIRProgressPill({ completion }: IIRProgressPillProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 mb-4 delay-300 duration-700">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border",
          "bg-glass border-glass-border px-4 py-2",
          "shadow-md backdrop-blur-md",
        )}
      >
        <div
          className={cn(
            "h-2.5 w-2.5 animate-pulse rounded-full bg-primary",
            "shadow-[0_0_10px_rgba(var(--primary),0.6)]",
          )}
        />
        <span
          className={cn(
            "text-[11px] uppercase",
            "text-neutral-700 dark:text-white",
          )}
        >
          {completion}% Form Progress
        </span>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

interface HeaderStatsProps {
  totalAppointments: number;
  totalSlips: number;
}

export function HeaderStats({
  totalAppointments,
  totalSlips,
}: HeaderStatsProps) {
  return (
    <div className="hidden grid-cols-2 gap-3 min-[520px]:grid">
      <div
        className={cn(
          "bg-glass rounded-xl border border-glass-border px-4 py-3",
          "backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]",
          "animate-fade-in-up",
        )}
        style={{ animationDelay: "0.10s", animationFillMode: "both" }}
      >
        <p
          className={cn(
            "text-center text-[11px] font-medium uppercase",
            "tracking-[0.18em] text-muted-foreground",
          )}
        >
          Appts
        </p>
        <p
          className={cn(
            "mt-1 text-center text-2xl font-bold",
            "tabular-nums text-foreground",
          )}
        >
          {totalAppointments}
        </p>
      </div>

      <div
        className={cn(
          "bg-glass rounded-xl border border-glass-border px-4 py-3",
          "backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]",
          "animate-fade-in-up",
        )}
        style={{ animationDelay: "0.15s", animationFillMode: "both" }}
      >
        <p
          className={cn(
            "text-center text-[11px] font-medium uppercase",
            "tracking-[0.18em] text-muted-foreground",
          )}
        >
          Slips
        </p>
        <p
          className={cn(
            "mt-1 text-center text-2xl font-bold",
            "tabular-nums text-foreground",
          )}
        >
          {totalSlips}
        </p>
      </div>
    </div>
  );
}

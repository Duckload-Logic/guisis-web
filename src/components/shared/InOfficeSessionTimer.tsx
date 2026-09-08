import React, { useEffect, useState } from "react";
import {
  Clock3,
  Play,
  CheckCircle,
  XCircle,
  Zap,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InOfficeSessionTimerProps {
  startedAt?: string | null;
  completedAt?: string | null;
  onStart?: (offsetMinutes?: number) => Promise<void> | void;
  onComplete?: () => void;
  onCancel?: () => void;
  isPending?: boolean;
  title?: string;
  subtitle?: string;
  studentName?: string;
  studentNumber?: string;
  compact?: boolean;
}

const IS_PROD =
  import.meta.env.VITE_IS_PRODUCTION === "true" ||
  import.meta.env.MODE === "production";

const SIM_OFFSETS = [
  { label: "+5m", mins: 5 },
  { label: "+15m", mins: 15 },
  { label: "+30m", mins: 30 },
  { label: "+45m", mins: 45 },
  { label: "+1h", mins: 60 },
];

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

function formatDurationSummary(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) {
    return `${hrs} hr ${mins} min${mins === 1 ? "" : "s"}`;
  }
  return `${mins} min${mins === 1 ? "" : "s"}`;
}

export const InOfficeSessionTimer: React.FC<InOfficeSessionTimerProps> = ({
  startedAt,
  completedAt,
  onStart,
  onComplete,
  onCancel,
  isPending = false,
  title = "In-Office Session",
  subtitle,
  studentName,
  studentNumber,
  compact = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const isCompleted = !!completedAt;
  const isRunning = !!startedAt && !isCompleted;
  const isNotStarted = !startedAt && !isCompleted;

  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startTs = new Date(startedAt).getTime();

    if (completedAt) {
      const endTs = new Date(completedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((endTs - startTs) / 1000)));
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - startTs) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startedAt, completedAt]);

  const handleSimulate = (mins: number) => {
    if (IS_PROD || !onStart) return;
    onStart(mins);
  };

  if (isNotStarted) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border p-4 bg-card shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                {title}
              </p>
              {subtitle && (
                <p className="text-[11px] text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
            Ready to Start
          </span>
        </div>

        {studentName && (
          <div className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Student: </span>
            <span className="font-semibold text-foreground">{studentName}</span>
            {studentNumber && (
              <span className="text-muted-foreground"> ({studentNumber})</span>
            )}
          </div>
        )}

        {onStart && (
          <Button
            onClick={() => onStart(0)}
            disabled={isPending}
            className={cn(
              "h-10 w-full items-center justify-between rounded-xl",
              "border border-emerald-500/30 bg-emerald-600 text-white",
              "font-bold text-xs shadow-sm hover:bg-emerald-500",
            )}
          >
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 fill-white" />
              <span>Start In-Office Session</span>
            </div>
            <Clock3 className="h-4 w-4 opacity-80" />
          </Button>
        )}

        {!IS_PROD && onStart && (
          <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 fill-amber-500" />
                <span>Staging Simulator (Defense & Audit)</span>
              </div>
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                Staging Only
              </span>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Start directly with simulated consultation minutes:
            </p>
            <div className="mt-2 grid grid-cols-5 gap-1.5">
              {SIM_OFFSETS.map((sim) => (
                <button
                  key={sim.label}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSimulate(sim.mins)}
                  className={cn(
                    "rounded-lg border border-border bg-card py-1",
                    "text-[11px] font-bold text-foreground shadow-xs",
                    "transition hover:bg-emerald-500/10",
                    "hover:border-emerald-500/40 hover:text-emerald-600",
                    "active:scale-95 disabled:opacity-50",
                  )}
                >
                  {sim.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              {title} Completed
            </span>
          </div>
          <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
            {formatDuration(elapsedSeconds)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Logged turnaround:{" "}
          <strong className="text-foreground">
            {formatDurationSummary(elapsedSeconds)}
          </strong>
          . Stored in logs for accreditation compliance.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3.5 rounded-2xl border shadow-sm",
        "border-emerald-500/30 bg-card p-4 transition-all",
        compact && "p-3 gap-2.5",
      )}
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <Timer className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              {title}
            </h4>
            {studentName && (
              <p className="text-[10px] text-muted-foreground">
                {studentName} {studentNumber ? `(${studentNumber})` : ""}
              </p>
            )}
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
          Live Session
        </span>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Elapsed In-Office Time
        </p>
        <div className="my-1 font-mono text-3xl font-black tracking-tight text-foreground">
          {formatDuration(elapsedSeconds)}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Started:{" "}
          {startedAt
            ? new Date(startedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })
            : "Recently"}
        </p>
      </div>

      {!IS_PROD && onStart && (
        <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 fill-amber-500" />
              <span>Fast-Forward Simulation</span>
            </div>
            <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[9px] font-bold text-amber-600">
              Staging Only
            </span>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Advance session elapsed duration for defense demo:
          </p>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {SIM_OFFSETS.map((sim) => (
              <button
                key={sim.label}
                type="button"
                disabled={isPending}
                onClick={() => handleSimulate(sim.mins)}
                className={cn(
                  "rounded-lg border border-border bg-card py-1.5",
                  "text-[11px] font-bold text-foreground shadow-xs",
                  "transition hover:bg-emerald-500/10",
                  "hover:border-emerald-500/40 hover:text-emerald-600",
                  "active:scale-95 disabled:opacity-50",
                )}
              >
                {sim.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {IS_PROD && (
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>
            Tamper-proof timer active. Turnaround logged for accreditation.
          </span>
        </div>
      )}

      {(onComplete || onCancel) && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          {onComplete && (
            <Button
              size="sm"
              onClick={onComplete}
              disabled={isPending}
              className="h-9 gap-1.5 rounded-lg bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Complete Session
            </Button>
          )}
          {onCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
              className="h-9 gap-1.5 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-bold"
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel Session
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

import { AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FriendlyErrorStateProps {
  title?: string;
  description?: string;
  helperText?: string;
  actionLabel?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

function ErrorSticker() {
  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary/15 via-rose-500/10 to-amber-400/10 shadow-inner" />
      <div className="absolute -right-2 top-4 h-8 w-8 rounded-full bg-amber-300/70 blur-[1px]" />
      <div className="absolute -bottom-1 left-3 h-7 w-7 rounded-full bg-primary/20 blur-[1px]" />
      <div
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-3xl",
          "border border-white/60 bg-white/85 shadow-md backdrop-blur-md",
          "dark:border-white/10 dark:bg-neutral-950/85",
        )}
      >
        <div className="absolute -right-2 -top-2 rounded-full bg-primary p-1.5 text-primary-foreground shadow-md">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <AlertTriangle className="h-9 w-9 text-primary" />
      </div>
    </div>
  );
}

export function FriendlyErrorState({
  title = "Something went wrong",
  description = "We're having trouble loading this page right now. Please try again in a moment.",
  helperText = "If this keeps happening, refresh the page or contact the Guidance Office support team.",
  actionLabel = "Try again",
  onRetry,
  className,
  compact = false,
}: FriendlyErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-md",
        compact ? "p-6" : "px-6 py-10 sm:px-10 sm:py-12",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="relative mx-auto flex max-w-xl flex-col items-center text-center">
        {!compact && <ErrorSticker />}

        <div className={cn(!compact && "mt-4")}>
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            <AlertTriangle className="h-3.5 w-3.5" />
            Unable to load
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
          {helperText && (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80 sm:text-sm">
              {helperText}
            </p>
          )}
        </div>

        {onRetry && (
          <Button
            type="button"
            onClick={onRetry}
            className="mt-6 rounded-xl px-5 font-semibold shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default FriendlyErrorState;

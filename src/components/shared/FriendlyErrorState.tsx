import { AlertCircle, RefreshCw } from "lucide-react";

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

export function FriendlyErrorState({
  title = "Something went wrong",
  description = "We're having trouble loading this page right now.",
  helperText = "If this keeps happening, refresh the page or contact the Guidance Office.",
  actionLabel = "Try again",
  onRetry,
  className,
  compact = false,
}: FriendlyErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-destructive/20 bg-card p-6 text-card-foreground",
        "shadow-sm",
        compact ? "py-6" : "py-10 sm:py-12",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            "border border-destructive/30 bg-destructive/10 text-destructive",
          )}
        >
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          {helperText && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground/80">
              {helperText}
            </p>
          )}
        </div>

        {onRetry && (
          <Button
            type="button"
            variant="outline"
            onClick={onRetry}
            className="mt-6 gap-2 rounded-lg font-semibold"
          >
            <RefreshCw className="h-4 w-4" />
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default FriendlyErrorState;

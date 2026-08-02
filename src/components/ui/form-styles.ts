import { cn } from "@/lib/utils";

export const BASE_FIELD_CLASSES = cn(
  "flex h-11 w-full items-center justify-between rounded-xl border px-4",
  "py-2.5 text-left text-sm font-medium tracking-tight text-foreground",
  "outline-none transition-all duration-200",
  "focus-visible:border-primary/50 focus-visible:ring-2",
  "focus-visible:ring-primary/5"
);

export function getFieldStateClasses(state: {
  disabled?: boolean;
  error?: string | boolean;
  filled?: boolean;
  required?: boolean;
}) {
  if (state.disabled) {
    return cn(
      "cursor-not-allowed border-0 bg-border/50",
      "text-muted-foreground opacity-90"
    );
  }
  if (state.error) {
    return cn(
      "border-destructive/50 focus-visible:border-destructive/60",
      "focus-visible:ring-destructive/10"
    );
  }
  if (state.filled) {
    return "border-primary/30 bg-muted/20 shadow-md";
  }
  if (state.required) {
    return cn(
      "border-destructive/20 bg-muted/20 hover:border-destructive/40",
      "focus-visible:border-destructive/50 focus-visible:ring-destructive/5"
    );
  }
  return cn(
    "border-foreground/30 bg-card shadow-sm",
    "hover:border-glass-border/60"
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[100px] w-full resize-none rounded-xl border border-foreground/30",
          "bg-card px-4 py-3 text-sm font-medium tracking-tight text-foreground",
          "shadow-sm outline-none transition-all duration-200",
          "placeholder:text-muted-foreground/70 hover:border-glass-border/60",
          "focus-visible:border-primary/50 focus-visible:bg-glass-bg",
          "focus-visible:ring-2 focus-visible:ring-primary/5",
          "dark:focus-visible:bg-glass-bg/40 disabled:cursor-not-allowed",
          "disabled:border-0 disabled:bg-border/50 disabled:text-muted-foreground",
          "disabled:opacity-90",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };

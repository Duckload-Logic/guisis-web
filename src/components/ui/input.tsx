import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-foreground/30 bg-card",
          "px-4 py-2.5 text-sm font-medium tracking-tight text-foreground",
          "shadow-sm outline-none transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "file:text-foreground placeholder:text-muted-foreground/70",
          "hover:border-glass-border/60 focus-visible:border-primary/50",
          "focus-visible:bg-glass-bg focus-visible:ring-2 focus-visible:ring-primary/5",
          "dark:focus-visible:bg-glass-bg/40 disabled:cursor-not-allowed",
          "disabled:border-0 disabled:bg-border/50 disabled:text-muted-foreground",
          "disabled:opacity-90 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

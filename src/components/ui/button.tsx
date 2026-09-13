import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-xl border text-sm font-medium ring-offset-background shadow-md",
    "transition-colors focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: cn(
          "border-primary bg-primary text-primary-foreground",
          "hover:bg-primary/90",
        ),
        destructive: cn(
          "border-destructive bg-destructive text-destructive-foreground",
          "hover:bg-destructive/90",
        ),
        outline: cn(
          "border-primary/40 bg-background text-foreground",
          "hover:border-primary hover:bg-primary/10 hover:text-primary",
        ),
        secondary: cn(
          "border-secondary bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80",
        ),
        ghost: cn(
          "border-transparent bg-transparent text-muted-foreground shadow-none",
          "hover:bg-accent hover:text-foreground",
        ),
        link: cn(
          "border-transparent bg-transparent p-0 text-primary shadow-none",
          "underline-offset-4 hover:underline",
        ),
      },
      size: {
        default: "min-h-11 px-4 py-2",
        sm: "min-h-11 px-3",
        lg: "min-h-11 px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 500;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      debounceMs = DEFAULT_DEBOUNCE_MS,
      onClick,
      disabled,
      ...props
    },
    ref,
  ) => {
    const lastClickRef = React.useRef<number>(0);
    const isPendingRef = React.useRef<boolean>(false);
    const Comp = asChild ? Slot : "button";

    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (isPendingRef.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (debounceMs > 0) {
          const now = Date.now();
          if (now - lastClickRef.current < debounceMs) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          lastClickRef.current = now;
        }

        if (!onClick) return;

        try {
          const result = onClick(event);
          const isPromise =
            result &&
            typeof (result as unknown as Promise<unknown>).then === "function";

          if (isPromise) {
            isPendingRef.current = true;
            (result as unknown as Promise<unknown>).finally(() => {
              isPendingRef.current = false;
            });
          }
        } catch (err) {
          isPendingRef.current = false;
          throw err;
        }
      },
      [onClick, debounceMs],
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled}
        onClick={handleClick}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

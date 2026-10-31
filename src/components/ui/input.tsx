import * as React from "react";
import { cn } from "@/lib/utils";
import { BASE_FIELD_CLASSES, getFieldStateClasses } from "./form-styles";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean;
  filled?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      disabled,
      required,
      error,
      filled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const isFilled =
      filled !== undefined
        ? filled
        : props.value !== undefined && props.value !== "";

    const isDateOrTime =
      type === "date" ||
      type === "time" ||
      type === "datetime-local" ||
      type === "month";

    const stateClasses = getFieldStateClasses({
      disabled,
      error: !!error,
      filled: isFilled,
      required,
    });

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      if (isDateOrTime && !disabled) {
        try {
          e.currentTarget.showPicker?.();
        } catch {
          // Ignore unsupported browser restrictions
        }
      }
      onClick?.(e);
    };

    return (
      <input
        type={type}
        disabled={disabled}
        required={required}
        onClick={handleClick}
        className={cn(
          BASE_FIELD_CLASSES,
          stateClasses,
          isDateOrTime && "cursor-pointer",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "file:text-foreground placeholder:text-muted-foreground/70",
          "focus-visible:bg-glass-bg md:text-sm",
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

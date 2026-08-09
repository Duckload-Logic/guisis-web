import * as React from "react";
import { cn } from "@/lib/utils";
import {
  BASE_FIELD_CLASSES,
  getFieldStateClasses,
} from "./form-styles";

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
      ...props
    },
    ref,
  ) => {
    const isFilled =
      filled !== undefined
        ? filled
        : props.value !== undefined && props.value !== "";

    const stateClasses = getFieldStateClasses({
      disabled,
      error: !!error,
      filled: isFilled,
      required,
    });

    return (
      <input
        type={type}
        disabled={disabled}
        required={required}
        className={cn(
          BASE_FIELD_CLASSES,
          stateClasses,
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "file:text-foreground placeholder:text-muted-foreground/70",
          "focus-visible:bg-glass-bg dark:focus-visible:bg-glass-bg/40",
          "md:text-sm",
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

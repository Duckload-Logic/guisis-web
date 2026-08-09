import * as React from "react";
import { cn } from "@/lib/utils";
import {
  BASE_FIELD_CLASSES,
  getFieldStateClasses,
} from "./form-styles";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | boolean;
  filled?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
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
      <textarea
        disabled={disabled}
        required={required}
        className={cn(
          BASE_FIELD_CLASSES,
          stateClasses,
          "min-h-[100px] resize-none py-3",
          "placeholder:text-muted-foreground/70",
          "focus-visible:bg-glass-bg dark:focus-visible:bg-glass-bg/40",
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

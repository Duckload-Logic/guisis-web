import * as React from "react";
import { format, isValid, parse, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BASE_FIELD_CLASSES,
  getFieldStateClasses,
} from "./form-styles";

const MOBILE_BREAKPOINT = 640;
const DEFAULT_FROM_YEAR = 1900;
const DEFAULT_TO_YEAR = new Date().getFullYear();

export interface DatePickerProps {
  id?: string;
  className?: string;
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  fromYear?: number;
  toYear?: number;
  maxDate?: Date;
}

function parseDateValue(value?: string) {
  if (!value) return undefined;

  const parsedIsoDate = parseISO(value);
  if (isValid(parsedIsoDate)) return parsedIsoDate;

  const parsedDateOnly = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsedDateOnly) ? parsedDateOnly : undefined;
}

export function DatePicker({
  id,
  className,
  label,
  value,
  onChange,
  onBlur,
  error,
  required = false,
  disabled = false,
  placeholder = "Select a date",
  fromYear = DEFAULT_FROM_YEAR,
  toYear = DEFAULT_TO_YEAR,
  maxDate,
}: DatePickerProps) {
  const generatedId = React.useId();
  const safeId = (id ?? generatedId).replace(/:/g, "-");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedDate = React.useMemo(() => parseDateValue(value), [value]);
  const nativeValue = React.useMemo(
    () => (selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""),
    [selectedDate],
  );

  React.useEffect(() => {
    const closeOnMobileResize = () => {
      if (window.innerWidth < MOBILE_BREAKPOINT) setOpen(false);
    };

    window.addEventListener("resize", closeOnMobileResize);
    return () => window.removeEventListener("resize", closeOnMobileResize);
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) return;
    setOpen(nextOpen);
    if (!nextOpen) onBlur?.();
  };

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? format(date, "yyyy-MM-dd") : "");
    setOpen(false);
  };

  const hasValue = Boolean(selectedDate);
  const triggerClasses = cn(
    BASE_FIELD_CLASSES,
    getFieldStateClasses({
      disabled,
      error: !!error,
      filled: hasValue,
      required,
    }),
  );

  const displayText = selectedDate ? format(selectedDate, "PPP") : placeholder;

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      {label && (
        <div
          className={cn(
            "flex items-start gap-1 text-sm font-medium",
            "text-card-foreground",
          )}
        >
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </div>
      )}

      <div
        className="relative h-11 w-full sm:hidden cursor-pointer"
        onClick={() => {
          if (!disabled) {
            try {
              inputRef.current?.showPicker();
            } catch (err) {
              inputRef.current?.focus();
              inputRef.current?.click();
            }
          }
        }}
      >
        <div
          className={cn(
            triggerClasses,
            "pointer-events-none",
            !hasValue && "font-normal italic text-muted-foreground/60",
          )}
          aria-hidden="true"
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{displayText}</span>
        </div>

        <input
          ref={inputRef}
          id={`${safeId}-mobile`}
          type="date"
          value={nativeValue}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          max={maxDate ? format(maxDate, "yyyy-MM-dd") : undefined}
          aria-label={label ?? placeholder}
          aria-invalid={Boolean(error)}
          className={cn(
            "absolute inset-0 w-full h-full opacity-0",
            "pointer-events-none",
          )}
        />
      </div>

      <div className="hidden w-full sm:block">
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              id={`${safeId}-desktop`}
              type="button"
              variant="ghost"
              disabled={disabled}
              aria-invalid={Boolean(error)}
              className={cn(
                triggerClasses,
                !hasValue && "font-normal italic text-muted-foreground/60",
              )}
            >
              <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{displayText}</span>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            collisionPadding={8}
            className={cn(
              "w-[300px] max-w-[calc(100vw-1rem)] overflow-hidden",
              "rounded-xl bg-background p-0",
            )}
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              defaultMonth={selectedDate}
              onSelect={handleSelect}
              initialFocus
              captionLayout="dropdown"
              fromYear={fromYear}
              toYear={toYear}
              disabled={maxDate ? { after: maxDate } : undefined}
            />
          </PopoverContent>
        </Popover>
      </div>

      {error && (
        <p className="ml-1 mt-1.5 text-[11px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

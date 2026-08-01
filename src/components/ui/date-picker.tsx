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
  fromYear = 1900,
  toYear = new Date().getFullYear(),
}: DatePickerProps) {
  const generatedId = React.useId();
  const safeId = (id ?? generatedId).replace(/:/g, "-");
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => parseDateValue(value), [value]);
  const nativeValue = React.useMemo(
    () => (selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""),
    [selectedDate],
  );

  React.useEffect(() => {
    const closeOnMobileResize = () => {
      if (window.innerWidth < 640) setOpen(false);
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
    "flex h-11 w-full items-center justify-start gap-2 rounded-xl border px-4 py-2.5",
    "text-left text-sm font-medium tracking-tight text-foreground outline-none",
    "transition-all duration-200",
    "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/5",
    disabled
      ? "cursor-not-allowed border-0 bg-border/50 text-muted-foreground opacity-90"
      : error
        ? "border-destructive/50 focus-visible:border-destructive/60 focus-visible:ring-destructive/10"
        : hasValue
          ? "border-primary/30 bg-muted/20 shadow-md"
          : required
            ? "border-destructive/20 bg-muted/20 hover:border-destructive/40 focus-visible:border-destructive/50 focus-visible:ring-destructive/5"
            : "border-foreground/30 bg-card shadow-sm hover:border-glass-border/60",
  );

  const displayText = selectedDate ? format(selectedDate, "PPP") : placeholder;

  return (
    <div className={cn("min-w-0 space-y-2", className)}>
      {label && (
        <div className="flex items-start gap-1 text-sm font-medium text-card-foreground">
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </div>
      )}

      <div className="relative h-11 w-full sm:hidden">
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
          id={`${safeId}-mobile`}
          type="date"
          value={nativeValue}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-label={label ?? placeholder}
          aria-invalid={Boolean(error)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
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
            className="w-[300px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl bg-background p-0"
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

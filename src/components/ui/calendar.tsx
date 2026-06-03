import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: cn(
          "flex flex-col sm:flex-row space-y-4",
          "sm:space-x-4 sm:space-y-0",
        ),
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium hidden",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-8 w-8 bg-transparent p-0 rounded-full " +
            "transition-all duration-200",
          "hover:bg-accent hover:scale-105 active:scale-95",
          "focus-visible:ring-2 focus-visible:ring-ring",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "border-collapse mx-auto",
        head_row: "flex",
        head_cell: cn(
          "text-muted-foreground rounded-md w-9",
          "font-normal text-[0.8rem] uppercase",
        ),
        row: "flex w-full mt-2",
        cell: cn(
          "h-10 w-10 text-center text-sm p-0 relative overflow-visible",
          "[&_button]:mx-auto",
          "[&:has([aria-selected].day-range-end)]:rounded-r-full",
          "[&:has([aria-selected].day-outside)]:bg-accent/50",
          "[&:has([aria-selected])]:bg-accent/30",
          "first:[&:has([aria-selected])]:rounded-l-full",
          "last:[&:has([aria-selected])]:rounded-r-full",
          "focus-within:relative focus-within:z-20",
        ),
        day: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-10 w-10 p-0 font-normal rounded-full transition-all duration-200",
          "hover:scale-105 hover:bg-accent hover:text-accent-foreground",
          "active:scale-95",
        ),
        day_range_end: "day-range-end",
        day_selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary",
          "hover:text-primary-foreground focus:bg-primary",
          "focus:text-primary-foreground shadow-md shadow-primary/20",
        ),
        day_today: cn(
          "bg-accent text-accent-foreground ring-1 ring-primary/30",
          "font-semibold",
        ),
        day_outside: cn(
          "day-outside text-muted-foreground/60 opacity-60",
          "aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
          "aria-selected:opacity-40",
        ),
        day_disabled: "text-muted-foreground opacity-40 cursor-not-allowed",
        day_range_middle: cn(
          "aria-selected:bg-accent/60",
          "aria-selected:text-accent-foreground rounded-full",
        ),
        day_hidden: "invisible",
        vhidden: "vhidden hidden",
        caption_dropdowns: "flex justify-center gap-2 pt-1",
        dropdown_month: "flex items-center",
        dropdown_year: "flex items-center",
        dropdown: cn(
          "cursor-pointer bg-glass-bg border border-input rounded-md",
          "px-4 py-1 text-sm font-medium",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
          "hover:bg-accent hover:text-accent-foreground transition-colors",
        ),
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Dropdown: ({
          value,
          onChange,
          children,
          name,
          ...dropdownProps
        }) => {
          const options =
            React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return {
                  value: String(child.props.value),
                  label: String(child.props.children),
                };
              }
              return null;
            })?.filter(
              (opt): opt is { value: string; label: string } =>
                opt !== null,
            ) || [];

          const handleValueChange = (val: string) => {
            if (onChange) {
              const mockEvent = {
                target: {
                  value: val,
                  name: name,
                },
              } as React.ChangeEvent<HTMLSelectElement>;
              onChange(mockEvent);
            }
          };

          return (
            <Select
              value={value !== undefined ? String(value) : ""}
              onValueChange={handleValueChange}
            >
              <SelectTrigger
                className={cn(
                  "h-8 border-glass-border/40 bg-glass-bg/60",
                  "text-xs focus:ring-1 focus:ring-primary/40",
                  "focus:border-primary/50 text-foreground w-[110px]",
                  "[&>span]:truncate",
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className={cn(
                  "max-h-[200px] overflow-y-auto bg-background/95",
                  "backdrop-blur-md border-glass-border/40 z-50",
                )}
              >
                {options.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className={cn(
                      "text-xs hover:bg-accent/40 text-foreground",
                      "focus:bg-accent/40",
                    )}
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

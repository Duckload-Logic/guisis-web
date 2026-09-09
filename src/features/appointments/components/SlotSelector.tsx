import type { ReactNode } from "react";
import { AvailableTimeSlotView, TimeSlot } from "../types";
import { Moon, Sun, Clock } from "lucide-react";
import { Spinner } from "@/components/shared";
import { format12HourTime } from "@/utils/dateTime";
import { cn } from "@/lib/utils";

interface TimeSlotselectorProps {
  selectedDate: Date | undefined;
  selectedTime: TimeSlot | undefined;
  availableSlots: AvailableTimeSlotView[];
  loading: boolean;
  onTimeSelect: (slot: AvailableTimeSlotView) => void;
  className?: string;
}

export default function SlotSelector({
  selectedDate,
  selectedTime,
  availableSlots,
  loading,
  onTimeSelect,
  className,
}: TimeSlotselectorProps) {
  const getHour = (time24: string) => Number(time24.split(":")[0]);

  const amSlots = availableSlots.filter((slot) => getHour(slot.time) < 12);
  const pmSlots = availableSlots.filter((slot) => getHour(slot.time) >= 12);

  const renderSlotButton = (slot: AvailableTimeSlotView) => {
    const isSelected = selectedTime?.id === slot.id;

    return (
      <button
        key={slot.id}
        type="button"
        onClick={() => onTimeSelect(slot)}
        disabled={!slot.isAvailable}
        className={cn(
          "flex items-center justify-center rounded-xl border px-3 py-2.5",
          "whitespace-nowrap text-xs font-semibold tracking-tight",
          "transition-all duration-200 sm:text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          isSelected
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : slot.isAvailable
              ? "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/50"
              : "cursor-not-allowed border-border/50 bg-muted/20 text-muted-foreground/40",
        )}
        aria-label={`Select ${format12HourTime(slot.time)}`}
        aria-pressed={isSelected}
      >
        {format12HourTime(slot.time)}
      </button>
    );
  };

  const renderSlotGroup = (
    label: string,
    slots: AvailableTimeSlotView[],
    icon: ReactNode,
  ) => (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
        <div className="flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-[11px] font-normal text-muted-foreground">
          {slots.length} {slots.length === 1 ? "slot" : "slots"}
        </span>
      </div>

      {slots.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {slots.map(renderSlotButton)}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 py-3 text-center text-xs text-muted-foreground">
          No {label.toLowerCase()} slots available
        </p>
      )}
    </div>
  );

  if (!selectedDate) {
    return (
      <div
        className={cn(
          "flex min-h-[260px] flex-col items-center justify-center",
          "rounded-xl border border-dashed border-border/70 p-6 text-center",
          className,
        )}
      >
        <Clock className="mb-2 h-7 w-7 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">No Date Selected</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Select a date on the calendar to view available slots
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Available Slots
        </span>
        <span className="text-xs font-bold text-foreground">
          {selectedDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {loading ? (
        <div className="flex min-h-36 items-center justify-center text-xs text-muted-foreground">
          <Spinner
            size="sm"
            message="Loading time slots..."
          />
        </div>
      ) : availableSlots.length > 0 ? (
        <div className="space-y-4">
          {renderSlotGroup(
            "Morning",
            amSlots,
            <Sun className="h-4 w-4 text-amber-500" />,
          )}
          {renderSlotGroup(
            "Afternoon",
            pmSlots,
            <Moon className="h-4 w-4 text-indigo-500" />,
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-center">
          <p className="text-xs font-medium text-muted-foreground">
            No consultation slots available for this date.
          </p>
        </div>
      )}
    </div>
  );
}

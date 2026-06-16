import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailableTimeSlotView, TimeSlot } from "../types";
import { Moon, Sun } from "lucide-react";
import { Spinner } from "@/components/shared";
import { format12HourTime } from "@/utils/dateTime";
import { cn } from "@/lib/utils";

interface TimeSlotselectorProps {
  selectedDate: Date | undefined;
  selectedTime: TimeSlot | undefined;
  availableSlots: AvailableTimeSlotView[];
  loading: boolean;
  onTimeSelect: (slot: AvailableTimeSlotView) => void;
}

export default function SlotSelector({
  selectedDate,
  selectedTime,
  availableSlots,
  loading,
  onTimeSelect,
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
          "min-h-10 rounded-xl border px-2 py-2 text-xs font-semibold",
          "transition-all duration-200 sm:min-h-11 sm:text-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          isSelected
            ? "border-primary bg-primary text-primary-foreground shadow-sm"
            : slot.isAvailable
              ? "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/50"
              : "cursor-not-allowed border-border/60 bg-muted/30 text-muted-foreground/50",
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
    <div className="min-w-0 space-y-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
        {icon}
        <span>{label}</span>
        <span className="text-xs font-normal text-muted-foreground">
          ({slots.length} slots)
        </span>
      </div>

      {slots.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">{slots.map(renderSlotButton)}</div>
      ) : (
        <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 py-4 text-center text-sm text-muted-foreground">
          No {label.toLowerCase()} slots
        </p>
      )}
    </div>
  );

  return (
    <Card className="h-full min-w-0 overflow-hidden rounded-2xl border border-border bg-glass-bg shadow-md">
      <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-4 sm:px-5">
        <CardTitle className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          Select Time
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {selectedDate ? (
          <>
            <p className="mb-4 text-sm font-semibold text-muted-foreground">
              {selectedDate.toDateString()}
            </p>

            {loading ? (
              <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                <Spinner size="sm" message="Loading available slots" />
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
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
              <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
                No available slots for this date
              </p>
            )}
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-border/70 bg-muted/20 py-8 text-center text-sm text-muted-foreground">
            Select a date to see available times
          </p>
        )}
      </CardContent>
    </Card>
  );
}

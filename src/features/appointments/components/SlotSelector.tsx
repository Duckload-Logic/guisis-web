import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AvailableTimeSlotView, TimeSlot } from "../types";
import { Sun, Moon } from "lucide-react";
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
  const getHour = (time24: string) => {
    return Number(time24.split(":")[0]);
  };

  const amSlots = availableSlots.filter((slot) => getHour(slot.time) < 12);
  const pmSlots = availableSlots.filter((slot) => getHour(slot.time) >= 12);

  const renderSlotButton = (slot: AvailableTimeSlotView) => (
    <button
      key={slot.id}
      onClick={() => onTimeSelect(slot)}
      disabled={!slot.isAvailable}
      className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
        selectedTime?.id === slot.id
          ? "bg-primary text-primary-foreground ring-2 ring-primary"
          : slot.isAvailable
            ? "bg-muted text-foreground hover:bg-muted/80 hover:ring-2 hover:ring-primary/50"
            : "cursor-not-allowed bg-muted/50 text-muted-foreground"
      }`}
      aria-label={`Select ${slot.time}`}
      aria-pressed={selectedTime?.id === slot.id}
    >
      {format12HourTime(slot.time)}
    </button>
  );

  return (
    <div className="w-full">
      <Card className="h-full border border-border bg-card shadow-sm">
        <CardHeader className="rounded-t-md border-b border-border bg-gradient-to-r from-muted/50 to-muted">
          <CardTitle className="text-lg text-foreground">Select Time</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {selectedDate ? (
            <>
              <p className="mb-4 text-sm font-semibold text-muted-foreground">
                {selectedDate.toDateString()}
              </p>
              {loading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  <Spinner
                    size="sm"
                    message="Loading available slots"
                  />
                </p>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* AM Column */}
                  <div className="space-y-3">
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm font-semibold text-amber-600",
                        "dark:text-amber-400",
                      )}
                    >
                      <Sun className="h-4 w-4" />
                      <span>Morning</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        ({amSlots.length} slots)
                      </span>
                    </div>
                    {amSlots.length > 0 ? (
                      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto p-2">
                        {amSlots.map(renderSlotButton)}
                      </div>
                    ) : (
                      <p className="rounded-lg bg-muted/30 py-4 text-center text-sm text-muted-foreground">
                        No morning slots
                      </p>
                    )}
                  </div>

                  {/* PM Column */}
                  <div className="space-y-3">
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm font-semibold",
                        "text-indigo-600 dark:text-indigo-400",
                      )}
                    >
                      <Moon className="h-4 w-4" />
                      <span>Afternoon</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        ({pmSlots.length} slots)
                      </span>
                    </div>
                    {pmSlots.length > 0 ? (
                      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto p-2">
                        {pmSlots.map(renderSlotButton)}
                      </div>
                    ) : (
                      <p className="rounded-lg bg-muted/30 py-4 text-center text-sm text-muted-foreground">
                        No afternoon slots
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No available slots for this date
                </p>
              )}
            </>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Select a date to see available times
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

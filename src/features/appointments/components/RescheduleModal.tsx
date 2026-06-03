import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useAvailableSlots } from "@/features/appointments/hooks";
import { Dropdown, FormInput } from "@/components/form";
import { AvailableTimeSlotView } from "../types";
import { format12HourTime, toISODateString } from "@/utils/dateTime";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newDate: string, newTimeSlotId: number) => void;
  currentDate: string;
  currentTimeSlotId: number;
}

export default function RescheduleModal({
  isOpen,
  onClose,
  onConfirm,
  currentDate,
  currentTimeSlotId,
}: RescheduleModalProps) {
  const today = new Date();
  const dateOptions: { value: string; label: string }[] = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    dateOptions.push({ value, label });
  }

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Reset time to start of today

    const cur = new Date(currentDate);
    // Ensure we compare midnight to midnight to avoid time-of-day bugs
    const isFutureOrToday = cur >= todayStart;

    return isFutureOrToday ? toISODateString(cur) : dateOptions[0].value;
  });

  const [selectedSlotId, setSelectedSlotId] = useState<number | undefined>(
    currentTimeSlotId,
  );

  const dateObj = selectedDateStr ? new Date(selectedDateStr) : undefined;
  const { data: availableSlots, isLoading } = useAvailableSlots(dateObj);

  // Reset selected slot when date changes
  useEffect(() => {
    setSelectedSlotId(undefined);
  }, [selectedDateStr]);

  const handleConfirm = () => {
    if (!selectedDateStr || !selectedSlotId) return;
    onConfirm(selectedDateStr, selectedSlotId);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onClose}
    >
      <DialogContent className="animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
            Select a new date and time slot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <FormInput
            type="date"
            label="New Date"
            min={dateOptions[0].value}
            max={dateOptions[dateOptions.length - 1].value}
            value={selectedDateStr}
            onChange={setSelectedDateStr}
          />

          {isLoading && (
            <p className="animate-pulse text-xs text-muted-foreground">
              Loading available time slots...
            </p>
          )}

          <Dropdown
            label={"New time"}
            options={
              availableSlots?.map((slot: AvailableTimeSlotView) => ({
                id: slot.id,
                name: format12HourTime(slot.time),
                isEnabled: slot.isAvailable,
              })) || []
            }
            enabled={!!selectedDateStr && !isLoading}
            value={selectedSlotId}
            onChange={(val) => setSelectedSlotId(Number(val))}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="transition-all duration-200 hover:scale-105"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDateStr || !selectedSlotId}
            className="transition-all duration-200 hover:scale-105"
          >
            Confirm Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

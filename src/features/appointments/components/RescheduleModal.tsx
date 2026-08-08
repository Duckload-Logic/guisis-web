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
import { Textarea } from "@/components/ui/textarea";

import { useAvailableSlots } from "@/features/appointments/hooks";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { AvailableTimeSlotView } from "../types";
import { format12HourTime, toISODateString } from "@/utils/dateTime";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    newDate: string,
    newTimeSlotId: number,
    reason: string,
  ) => void;
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

  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (!selectedDateStr || !selectedSlotId) return;
    if (!reason.trim()) {
      setError("Reason for reschedule is required");
      return;
    }
    onConfirm(selectedDateStr, selectedSlotId, reason);
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
          <FormField
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

          <SelectField
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Reason for Reschedule <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Enter details for rescheduling..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              className="min-h-[80px]"
            />
            {error && (
              <p className="text-xs text-red-500">
                {error}
              </p>
            )}
          </div>
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

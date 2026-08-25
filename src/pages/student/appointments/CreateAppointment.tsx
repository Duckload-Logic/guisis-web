import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAvailableSlots } from "@/features/appointments/hooks/useLookups";
import {
  SlotSelector,
  AppointmentForm,
} from "@/features/appointments/components";
import {
  Appointment,
  TimeSlot,
  CreateAppointmentRequest,
} from "@/features/appointments";
import Calendar from "@/features/appointments/components/Calendar";
import {
  CalendarDays,
  CheckCircle2,
  Edit2,
  LockKeyhole,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubmitAppointment } from "@/features/appointments/hooks/useAppointments";
import { toISODateString } from "@/utils";
import { usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";

const EMPTY_APPOINTMENT_FORM: Appointment = {
  reason: "",
  whenDate: "",
  timeSlot: { id: 0, time: "" },
  appointmentCategory: { id: 0, name: "" },
};

type PreferredScheduleOption = {
  date?: Date;
  time?: TimeSlot;
  month: Date;
};

export default function CreateAppointment() {
  const [appointmentFormData, setAppointmentFormData] = useState<Appointment>(
    EMPTY_APPOINTMENT_FORM,
  );

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<TimeSlot>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isScheduleNoticeOpen, setIsScheduleNoticeOpen] = useState(true);

  const [activePreferredIndex, setActivePreferredIndex] = useState(0);

  const [preferredOptions, setPreferredOptions] = useState<
    PreferredScheduleOption[]
  >([
    { date: undefined, time: undefined, month: new Date() },
    { date: undefined, time: undefined, month: new Date() },
    { date: undefined, time: undefined, month: new Date() },
  ]);

  const { data: slots, isLoading } = useAvailableSlots(
    selectedDate || undefined,
  );

  const { data: preferredSlotsOne, isLoading: isPreferredSlotsOneLoading } =
    useAvailableSlots(preferredOptions[0].date || undefined);

  const { data: preferredSlotsTwo, isLoading: isPreferredSlotsTwoLoading } =
    useAvailableSlots(preferredOptions[1].date || undefined);

  const { data: preferredSlotsThree, isLoading: isPreferredSlotsThreeLoading } =
    useAvailableSlots(preferredOptions[2].date || undefined);

  const navigate = useNavigate();
  const { mutate: submit, isPending: isSubmitting } = useSubmitAppointment();

  const currentStep = !selectedDate ? 1 : !selectedTime ? 2 : 3;

  const hasSelectedCategory = !!appointmentFormData.appointmentCategory?.id;
  const hasReason = !!appointmentFormData.reason?.trim();

  const canShowPreferredProcess =
    !!selectedDate && !!selectedTime && hasSelectedCategory && hasReason;

  const requiredPreferredComplete =
    !!preferredOptions[0].date && !!preferredOptions[0].time?.id;

  const canSubmitAppointment =
    canShowPreferredProcess &&
    requiredPreferredComplete &&
    !isSubmitting &&
    !isLoading &&
    !isPreferredSlotsOneLoading &&
    !isPreferredSlotsTwoLoading &&
    !isPreferredSlotsThreeLoading;

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFullDate = (date?: Date) => {
    if (!date) return "Not provided";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPreferredSlots = (index: number) => {
    if (index === 0) return preferredSlotsOne || [];
    if (index === 1) return preferredSlotsTwo || [];
    return preferredSlotsThree || [];
  };

  const getPreferredSlotsLoading = (index: number) => {
    if (index === 0) return isPreferredSlotsOneLoading;
    if (index === 1) return isPreferredSlotsTwoLoading;
    return isPreferredSlotsThreeLoading;
  };

  const updatePreferredOption = (
    index: number,
    updates: Partial<PreferredScheduleOption>,
  ) => {
    setPreferredOptions((prev) =>
      prev.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...updates } : option,
      ),
    );
  };

  const resetPreferredOption = (index: number) => {
    updatePreferredOption(index, {
      date: undefined,
      time: undefined,
      month: new Date(),
    });
  };

  const resetPreferredTime = (index: number) => {
    updatePreferredOption(index, {
      time: undefined,
    });
  };

  const resetAllPreferredOptions = () => {
    setPreferredOptions([
      { date: undefined, time: undefined, month: new Date() },
      { date: undefined, time: undefined, month: new Date() },
      { date: undefined, time: undefined, month: new Date() },
    ]);
    setActivePreferredIndex(0);
  };

  const resetDateAndTime = () => {
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    resetAllPreferredOptions();

    setAppointmentFormData((prev) => ({
      ...prev,
      whenDate: "",
      timeSlot: { id: 0, time: "" },
    }));
  };

  const resetTime = () => {
    setSelectedTime(undefined);
    resetAllPreferredOptions();

    setAppointmentFormData((prev) => ({
      ...prev,
      timeSlot: { id: 0, time: "" },
    }));
  };

  const buildPreferredScheduleText = () => {
    return preferredOptions
      .map((option, index) => {
        const optionNumber = index + 1;
        const requirement = index === 0 ? "Required" : "Optional";

        if (!option.date || !option.time?.time) {
          return `Option ${optionNumber} (${requirement}): Not provided`;
        }

        return [
          `Option ${optionNumber} (${requirement}):`,
          `Preferred Date: ${formatFullDate(option.date)}`,
          `Preferred Time: ${option.time.time}`,
        ].join("\n");
      })
      .join("\n\n");
  };

  const filterConflictingSlots = (
    slotsList: any[],
    targetDate: Date | undefined,
    excludePreferredIndex?: number,
  ) => {
    if (!targetDate) return slotsList;
    const targetDateStr = toISODateString(targetDate);

    const selections: Array<{ dateStr: string; slotId: number }> = [];

    if (excludePreferredIndex !== undefined) {
      if (selectedDate && selectedTime?.id) {
        selections.push({
          dateStr: toISODateString(selectedDate),
          slotId: selectedTime.id,
        });
      }
    }

    preferredOptions.forEach((option, idx) => {
      if (
        idx !== excludePreferredIndex &&
        option.date &&
        option.time?.id
      ) {
        selections.push({
          dateStr: toISODateString(option.date),
          slotId: option.time.id,
        });
      }
    });

    return slotsList.map((slot) => {
      const isConflicting = selections.some(
        (sel) =>
          sel.dateStr === targetDateStr && sel.slotId === slot.id,
      );
      if (isConflicting) {
        return { ...slot, isAvailable: false };
      }
      return slot;
    });
  };

  const handleSubmitAppointment = () => {
    const payload: CreateAppointmentRequest = {
      reason: appointmentFormData.reason.trim(),
      whenDate: appointmentFormData.whenDate,
      timeSlot: {
        id: appointmentFormData.timeSlot.id,
      },
      appointmentCategory: {
        id: appointmentFormData.appointmentCategory.id,
      },
    };

    if (preferredOptions[0].date && preferredOptions[0].time?.id) {
      payload.preferredDate1 = toISODateString(preferredOptions[0].date);
      payload.preferredTimeSlot1 = { id: preferredOptions[0].time.id };
    }
    if (preferredOptions[1].date && preferredOptions[1].time?.id) {
      payload.preferredDate2 = toISODateString(preferredOptions[1].date);
      payload.preferredTimeSlot2 = { id: preferredOptions[1].time.id };
    }
    if (preferredOptions[2].date && preferredOptions[2].time?.id) {
      payload.preferredDate3 = toISODateString(preferredOptions[2].date);
      payload.preferredTimeSlot3 = { id: preferredOptions[2].time.id };
    }

    submit(payload, {
      onSuccess: () => {
        navigate("/student/appointments");
      },
      onError: (error: any) => {
        if (error.message?.includes("IIR profile")) {
          navigate("/iir-form");
        }
      },
    });
  };

  usePageMetadata(
    useMemo(() => {
      return {
        title: "Schedule Appointment",
        description:
          "Pick a date, select a time, fill out your reason, then choose up to 3 preferred schedules before submitting.",
        badgeText: "New Appointment",
        badgeIcon: <UserPlus className="h-3 w-3" />,
        isLoading,
      };
    }, [isLoading]),
  );

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);

  const activePreferredOption = preferredOptions[activePreferredIndex];

  return (
    <>
      <Dialog
        open={isScheduleNoticeOpen}
        onOpenChange={setIsScheduleNoticeOpen}
      >
        <DialogContent
          className={cn(
            "overflow-hidden rounded-xl border border-border bg-background p-0",
            "shadow-md sm:max-w-[600px]",
          )}
        >
          <div className="px-5 pb-5 pt-5 sm:px-6 sm:pb-6 sm:pt-6">
            <DialogHeader className="space-y-4 text-left">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    "border border-primary/20 bg-primary/10 text-primary",
                  )}
                >
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div className="min-w-0 space-y-1.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full border border-primary/20 bg-primary/5",
                      "px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]",
                      "text-primary",
                    )}
                  >
                    Appointment Notice
                  </span>

                  <DialogTitle className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Guidance Office Schedule
                  </DialogTitle>
                </div>
              </div>

              <DialogDescription
                className={cn(
                  "rounded-xl border border-border bg-muted/40 px-4 py-4",
                  "text-sm leading-6 text-muted-foreground sm:px-5",
                )}
              >
                Ma&apos;am Liwanag L. Maliksi&apos;s schedule is strictly from
                8:00 AM to 5:00 PM only.
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter
            className={cn(
              "border-t border-border bg-background px-5 py-4",
              "sm:justify-end sm:px-6",
            )}
          >
            <Button
              type="button"
              onClick={() => setIsScheduleNoticeOpen(false)}
              className={cn(
                "h-10 rounded-xl bg-primary px-7 text-sm font-semibold",
                "text-primary-foreground shadow-md transition-colors",
                "hover:bg-primary/90 focus-visible:ring-primary",
              )}
            >
              I understand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="min-h-full">
        <div className="mx-auto w-full max-w-[1500px] overflow-x-hidden px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="space-y-5">
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Calendar
                  currentMonth={currentMonth}
                  selectedDate={selectedDate}
                  onMonthChange={setCurrentMonth}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(undefined);
                    resetAllPreferredOptions();

                    setAppointmentFormData((prev) => ({
                      ...prev,
                      whenDate: toISODateString(date),
                      timeSlot: { id: 0, time: "" },
                    }));
                  }}
                  title="Select a Date"
                  occupiedDayColor="bg-primary/80"
                  legends={[]}
                  hasHeader
                  className="mx-auto w-full max-w-lg"
                  allowCurrentDate={false}
                  allowPastDates={false}
                  maxDate={maxDate}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-300">
                <Card
                  className={cn(
                    "rounded-2xl border border-border bg-glass-bg",
                    "shadow-md backdrop-blur-xl",
                  )}
                >
                  <CardContent className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          "border border-primary/15 bg-primary/10 text-primary",
                        )}
                      >
                        <CalendarDays className="h-4.5 w-4.5" />
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Selected Date
                        </p>

                        <p className="text-sm font-semibold text-foreground">
                          {selectedDate
                            ? formatSelectedDate(selectedDate)
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetDateAndTime}
                      className="h-9 rounded-xl"
                    >
                      <Edit2 className="mr-2 h-3.5 w-3.5" />
                      Change Date
                    </Button>
                  </CardContent>
                </Card>

                <SlotSelector
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  availableSlots={filterConflictingSlots(
                    slots || [],
                    selectedDate,
                  )}
                  loading={isLoading}
                  onTimeSelect={(time) => {
                    setSelectedTime(time);
                    resetAllPreferredOptions();

                    setAppointmentFormData((prev) => ({
                      ...prev,
                      timeSlot: time,
                    }));
                  }}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 space-y-5 duration-300">
                <div
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border border-border",
                    "bg-glass-bg p-4 shadow-md backdrop-blur-xl",
                    "lg:flex-row lg:items-center lg:justify-between",
                  )}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Schedule Selected
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      Fill out your request details, then choose preferred
                      schedule options on the right.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetDateAndTime}
                      className="h-9 rounded-xl"
                    >
                      Change Date
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetTime}
                      className="h-9 rounded-xl"
                    >
                      Change Time
                    </Button>
                  </div>
                </div>

                <div
                  className={cn(
                    "grid w-full min-w-0 gap-5 sm:gap-6",
                    "xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]",
                    "2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]",
                    "xl:items-start",
                  )}
                >
                  <div className="min-w-0 w-full">
                    <AppointmentForm
                      data={appointmentFormData}
                      onChange={(name: string, value: any) => {
                        setAppointmentFormData((prev) => ({
                          ...prev,
                          [name]: value,
                        }));
                      }}
                      onSubmit={handleSubmitAppointment}
                      isLoading={isLoading}
                      isSubmitting={isSubmitting}
                      showSubmitButton={false}
                    />
                  </div>

                  <div className="min-w-0 w-full">
                    <Card
                      className={cn(
                        "overflow-hidden rounded-2xl border bg-glass-bg",
                        canShowPreferredProcess
                          ? "border-border shadow-md"
                          : "border-dashed border-border/70 shadow-sm",
                        "backdrop-blur-xl",
                      )}
                    >
                      <CardHeader className="border-b border-border/60 bg-muted/30 px-4 py-4 sm:px-5">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                              canShowPreferredProcess
                                ? "border-primary/15 bg-primary/10 text-primary"
                                : "border-muted-foreground/20 bg-muted text-muted-foreground",
                            )}
                          >
                            {canShowPreferredProcess ? (
                              <CheckCircle2 className="h-4.5 w-4.5" />
                            ) : (
                              <LockKeyhole className="h-4.5 w-4.5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={cn(
                                "text-xs font-semibold uppercase tracking-[0.14em]",
                                canShowPreferredProcess
                                  ? "text-primary"
                                  : "text-muted-foreground",
                              )}
                            >
                              Preferred Schedule
                            </p>

                            <CardTitle className="mt-1 text-base font-bold tracking-tight text-foreground sm:text-lg">
                              Choose Up to 3 Preferred Schedules
                            </CardTitle>

                            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                              Select at least one preferred schedule. Option 1 is
                              required, while Options 2 and 3 are optional backup
                              schedules.
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-5">
                        {!canShowPreferredProcess && (
                          <div
                            className={cn(
                              "flex min-h-[260px] flex-col items-center justify-center rounded-2xl",
                              "border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center",
                              "shadow-inner",
                            )}
                          >
                            <div
                              className={cn(
                                "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl",
                                "border border-primary/15 bg-primary/10 text-primary",
                              )}
                            >
                              <LockKeyhole className="h-6 w-6" />
                            </div>

                            <h4 className="text-base font-semibold text-foreground">
                              Complete the request details first
                            </h4>

                            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                              Complete the concern category and reason/request
                              on the left first. The preferred schedule options
                              will unlock after that.
                            </p>
                          </div>
                        )}

                        {canShowPreferredProcess && (
                          <>
                            <div className="grid gap-3 md:grid-cols-3">
                              {preferredOptions.map((option, index) => {
                                const isActive = activePreferredIndex === index;
                                const isRequired = index === 0;
                                const isComplete =
                                  !!option.date && !!option.time;

                                return (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() =>
                                      setActivePreferredIndex(index)
                                    }
                                    className={cn(
                                      "min-h-[92px] rounded-2xl border px-3 py-3 text-left transition-all sm:px-4",
                                      isActive
                                        ? "border-primary/40 bg-primary/10 shadow-sm"
                                        : "border-border bg-card hover:bg-muted/30",
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-foreground">
                                        Option {index + 1}
                                      </p>

                                      <span
                                        className={cn(
                                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                          isRequired
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted text-muted-foreground",
                                        )}
                                      >
                                        {isRequired ? "Required" : "Optional"}
                                      </span>
                                    </div>

                                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                      {isComplete
                                        ? `${formatFullDate(option.date)} at ${
                                            option.time?.time
                                          }`
                                        : option.date
                                          ? `${formatFullDate(
                                              option.date,
                                            )} — select time`
                                          : "No schedule selected"}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>

                            {!activePreferredOption.date && (
                              <Calendar
                                currentMonth={activePreferredOption.month}
                                selectedDate={activePreferredOption.date}
                                onMonthChange={(month) =>
                                  updatePreferredOption(activePreferredIndex, {
                                    month,
                                  })
                                }
                                onDateSelect={(date) => {
                                  updatePreferredOption(activePreferredIndex, {
                                    date,
                                    time: undefined,
                                  });
                                }}
                                title={`Select Preferred Date - Option ${
                                  activePreferredIndex + 1
                                }`}
                                occupiedDayColor="bg-primary/80"
                                legends={[]}
                                hasHeader
                                className="mx-auto w-full max-w-full sm:max-w-[430px]"
                                allowCurrentDate={false}
                                allowPastDates={false}
                                maxDate={maxDate}
                              />
                            )}

                            {activePreferredOption.date &&
                              !activePreferredOption.time && (
                                <div className="space-y-4">
                                  <Card
                                    className={cn(
                                      "rounded-2xl border border-border bg-card",
                                      "shadow-sm",
                                    )}
                                  >
                                    <CardContent className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={cn(
                                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                            "border border-primary/15 bg-primary/10 text-primary",
                                          )}
                                        >
                                          <CalendarDays className="h-4.5 w-4.5" />
                                        </div>

                                        <div>
                                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                                            Preferred Date - Option{" "}
                                            {activePreferredIndex + 1}
                                          </p>

                                          <p className="text-sm font-semibold text-foreground">
                                            {formatFullDate(
                                              activePreferredOption.date,
                                            )}
                                          </p>
                                        </div>
                                      </div>

                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          resetPreferredOption(
                                            activePreferredIndex,
                                          )
                                        }
                                        className="h-9 rounded-xl"
                                      >
                                        <Edit2 className="mr-2 h-3.5 w-3.5" />
                                        Change Date
                                      </Button>
                                    </CardContent>
                                  </Card>

                                  <div className="min-w-0">
                                    <SlotSelector
                                      selectedDate={activePreferredOption.date}
                                      selectedTime={activePreferredOption.time}
                                      availableSlots={
                                        filterConflictingSlots(
                                          getPreferredSlots(
                                            activePreferredIndex,
                                          ),
                                          activePreferredOption.date,
                                          activePreferredIndex,
                                        )
                                      }
                                      loading={getPreferredSlotsLoading(
                                        activePreferredIndex,
                                      )}
                                      onTimeSelect={(time) => {
                                        updatePreferredOption(
                                          activePreferredIndex,
                                          { time },
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                            {activePreferredOption.date &&
                              activePreferredOption.time && (
                                <div
                                  className={cn(
                                    "rounded-2xl border border-emerald-500/20",
                                    "bg-emerald-500/10 px-4 py-3",
                                    "text-emerald-700 dark:text-emerald-300",
                                  )}
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-sm leading-6">
                                      Option {activePreferredIndex + 1} selected:{" "}
                                      <span className="font-semibold">
                                        {formatFullDate(
                                          activePreferredOption.date,
                                        )}
                                      </span>{" "}
                                      at{" "}
                                      <span className="font-semibold">
                                        {activePreferredOption.time.time}
                                      </span>
                                      .
                                    </p>

                                    <div className="flex shrink-0 flex-wrap gap-1.5">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          resetPreferredOption(
                                            activePreferredIndex,
                                          )
                                        }
                                        className={cn(
                                          "h-7 rounded-lg border-emerald-500/20 bg-white/60",
                                          "px-2.5 text-[10px] font-semibold text-emerald-700",
                                          "hover:bg-white dark:bg-white/[0.06] dark:text-emerald-300",
                                        )}
                                      >
                                        Change Date
                                      </Button>

                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          resetPreferredTime(
                                            activePreferredIndex,
                                          )
                                        }
                                        className={cn(
                                          "h-7 rounded-lg border-emerald-500/20 bg-white/60",
                                          "px-2.5 text-[10px] font-semibold text-emerald-700",
                                          "hover:bg-white dark:bg-white/[0.06] dark:text-emerald-300",
                                        )}
                                      >
                                        Change Time
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}

                            <div
                              className={cn(
                                "rounded-2xl border px-4 py-3 text-sm leading-6",
                                requiredPreferredComplete
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                              )}
                            >
                              {requiredPreferredComplete
                                ? "Required preferred schedule is complete. You may add Option 2 and Option 3 if you want backup schedules."
                                : "Please complete Preferred Schedule Option 1 to enable submission."}
                            </div>

                            {requiredPreferredComplete && (
                              <div className="flex items-center justify-center pt-1">
                                <Button
                                  type="button"
                                  onClick={handleSubmitAppointment}
                                  disabled={!canSubmitAppointment}
                                  className={cn(
                                    "h-auto w-full rounded-xl bg-primary py-3",
                                    "text-base font-semibold text-primary-foreground",
                                    "transition-colors hover:bg-primary/90",
                                  )}
                                >
                                  {isSubmitting
                                    ? "Submitting..."
                                    : "Submit Appointment Request"}
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 z-[100] flex flex-col items-center",
              "justify-center bg-slate-950/40 shadow-md",
            )}
          >
            <div
              className={cn(
                "flex w-[calc(100%-2rem)] max-w-sm flex-col items-center",
                "gap-4 rounded-xl border border-border bg-card p-6",
                "shadow-2xl backdrop-blur-2xl sm:p-10",
              )}
            >
              <div className="relative">
                <RefreshCw size={48} className="animate-spin text-primary" />
                <div
                  className={cn(
                    "absolute inset-0 animate-ping rounded-full",
                    "border border-primary/20",
                  )}
                />
              </div>

              <div className="space-y-1 text-center">
                <h3 className="text-lg font-bold text-foreground">
                  Scheduling Appointment
                </h3>

                <p className="max-w-[280px] text-sm text-muted-foreground">
                  Sending your appointment request. Please wait...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export default function CreateAppointment() {
  const [appointmentFormData, setAppointmentFormData] = useState<Appointment>(
    EMPTY_APPOINTMENT_FORM,
  );

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<TimeSlot>();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [preferredDate, setPreferredDate] = useState<Date>();
  const [preferredTime, setPreferredTime] = useState<TimeSlot>();
  const [preferredMonth, setPreferredMonth] = useState(new Date());

  const preferredSectionRef = useRef<HTMLDivElement | null>(null);

  const { data: slots, isLoading } = useAvailableSlots(
    selectedDate || undefined,
  );

  const { data: preferredSlots, isLoading: isPreferredSlotsLoading } =
    useAvailableSlots(preferredDate || undefined);

  const navigate = useNavigate();
  const { mutate: submit, isPending: isSubmitting } = useSubmitAppointment();

  const currentStep = !selectedDate ? 1 : !selectedTime ? 2 : 3;

  const hasSelectedCategory = !!appointmentFormData.appointmentCategory?.id;
  const hasReason = !!appointmentFormData.reason?.trim();

  const canShowPreferredProcess =
    !!selectedDate && !!selectedTime && hasSelectedCategory && hasReason;

  const canSubmitAppointment =
    canShowPreferredProcess &&
    !!preferredDate &&
    !!preferredTime?.id &&
    !isSubmitting &&
    !isLoading &&
    !isPreferredSlotsLoading;

  useEffect(() => {
    if (canShowPreferredProcess && preferredSectionRef.current) {
      preferredSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [canShowPreferredProcess]);

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatFullDate = (date?: Date) => {
    if (!date) return "—";

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const resetDateAndTime = () => {
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setPreferredDate(undefined);
    setPreferredTime(undefined);

    setAppointmentFormData((prev) => ({
      ...prev,
      whenDate: "",
      timeSlot: { id: 0, time: "" },
    }));
  };

  const resetTime = () => {
    setSelectedTime(undefined);
    setPreferredDate(undefined);
    setPreferredTime(undefined);

    setAppointmentFormData((prev) => ({
      ...prev,
      timeSlot: { id: 0, time: "" },
    }));
  };

  const resetPreferredDateAndTime = () => {
    setPreferredDate(undefined);
    setPreferredTime(undefined);
  };

  const resetPreferredTime = () => {
    setPreferredTime(undefined);
  };

  const handleSubmitAppointment = () => {
    const finalReason = [
      appointmentFormData.reason.trim(),
      "",
      "Preferred Schedule Details:",
      `Preferred Date: ${formatFullDate(preferredDate)}`,
      `Preferred Time: ${preferredTime?.time || "—"}`,
    ].join("\n");

    const payload: CreateAppointmentRequest = {
      reason: finalReason,
      whenDate: appointmentFormData.whenDate,
      timeSlot: {
        id: appointmentFormData.timeSlot.id,
      },
      appointmentCategory: {
        id: appointmentFormData.appointmentCategory.id,
      },
    };

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
          "Pick a date, select a time, fill out your reason, then choose your preferred schedule before submitting.",
        badgeText: "New Appointment",
        badgeIcon: <UserPlus className="h-3 w-3" />,
        isLoading,
      };
    }, [isLoading]),
  );

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);

  return (
    <>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="space-y-6">
            {currentStep === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Calendar
                  currentMonth={currentMonth}
                  selectedDate={selectedDate}
                  onMonthChange={setCurrentMonth}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(undefined);
                    setPreferredDate(undefined);
                    setPreferredTime(undefined);

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
                  className="mx-auto max-w-md"
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
                    "rounded-2xl border border-white/25 bg-white/45",
                    "shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]",
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
                  availableSlots={slots || []}
                  loading={isLoading}
                  onTimeSelect={(time) => {
                    setSelectedTime(time);
                    setPreferredDate(undefined);
                    setPreferredTime(undefined);

                    setAppointmentFormData((prev) => ({
                      ...prev,
                      timeSlot: time,
                    }));
                  }}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-300">
                <div
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border border-white/25",
                    "bg-white/45 p-4 shadow-sm backdrop-blur-xl",
                    "dark:border-white/10 dark:bg-white/[0.04]",
                    "sm:flex-row sm:items-center sm:justify-between",
                  )}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Schedule Selected
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      Fill out your request details, then answer the preferred
                      schedule section beside it.
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

                <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-start">
                  <div>
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

                  <div
                    ref={preferredSectionRef}
                    className="xl:sticky xl:top-24"
                  >
                    <Card
                      className={cn(
                        "overflow-hidden rounded-[24px] border",
                        canShowPreferredProcess
                          ? "border-primary/20 bg-white/60 shadow-[0_18px_40px_rgba(15,23,42,0.09)]"
                          : "border-dashed border-muted-foreground/25 bg-muted/20",
                        "backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]",
                      )}
                    >
                      <CardContent className="space-y-5 p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border",
                              canShowPreferredProcess
                                ? "border-primary/15 bg-primary/10 text-primary"
                                : "border-muted-foreground/20 bg-muted text-muted-foreground",
                            )}
                          >
                            {canShowPreferredProcess ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <LockKeyhole className="h-5 w-5" />
                            )}
                          </div>

                          <div>
                            <p
                              className={cn(
                                "text-xs font-semibold uppercase tracking-[0.16em]",
                                canShowPreferredProcess
                                  ? "text-primary"
                                  : "text-muted-foreground",
                              )}
                            >
                              Preferred Schedule
                            </p>

                            <h3 className="text-lg font-semibold text-foreground">
                              Answer Your Preferred Date and Time
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              This section will unlock after you choose a concern
                              category and type your reason/request.
                            </p>
                          </div>
                        </div>

                        {!canShowPreferredProcess && (
                          <div
                            className={cn(
                              "rounded-2xl border border-white/25 bg-white/45 p-4",
                              "text-sm leading-6 text-muted-foreground",
                              "dark:border-white/10 dark:bg-white/[0.04]",
                            )}
                          >
                            Complete the fields on the left first. Once done,
                            the preferred date and time selector will appear
                            here automatically.
                          </div>
                        )}

                        {canShowPreferredProcess && !preferredDate && (
                          <Calendar
                            currentMonth={preferredMonth}
                            selectedDate={preferredDate}
                            onMonthChange={setPreferredMonth}
                            onDateSelect={(date) => {
                              setPreferredDate(date);
                              setPreferredTime(undefined);
                            }}
                            title="Select Preferred Date"
                            occupiedDayColor="bg-primary/80"
                            legends={[]}
                            hasHeader
                            className="mx-auto max-w-md"
                            allowCurrentDate={false}
                            allowPastDates={false}
                            maxDate={maxDate}
                          />
                        )}

                        {canShowPreferredProcess &&
                          preferredDate &&
                          !preferredTime && (
                            <div className="space-y-4">
                              <Card
                                className={cn(
                                  "rounded-2xl border border-primary/15 bg-primary/10",
                                  "shadow-sm backdrop-blur-xl",
                                )}
                              >
                                <CardContent className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={cn(
                                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                        "border border-primary/15 bg-white/55 text-primary",
                                        "dark:bg-white/[0.06]",
                                      )}
                                    >
                                      <CalendarDays className="h-4.5 w-4.5" />
                                    </div>

                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                                        Preferred Date
                                      </p>

                                      <p className="text-sm font-semibold text-foreground">
                                        {formatFullDate(preferredDate)}
                                      </p>
                                    </div>
                                  </div>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={resetPreferredDateAndTime}
                                    className="h-9 rounded-xl"
                                  >
                                    <Edit2 className="mr-2 h-3.5 w-3.5" />
                                    Change Date
                                  </Button>
                                </CardContent>
                              </Card>

                              <SlotSelector
                                selectedDate={preferredDate}
                                selectedTime={preferredTime}
                                availableSlots={preferredSlots || []}
                                loading={isPreferredSlotsLoading}
                                onTimeSelect={(time) => {
                                  setPreferredTime(time);
                                }}
                              />
                            </div>
                          )}

                        {canShowPreferredProcess &&
                          preferredDate &&
                          preferredTime && (
                            <div className="space-y-4">
                              <div
                                className={cn(
                                  "rounded-2xl border border-emerald-500/20",
                                  "bg-emerald-500/10 px-4 py-3 text-sm leading-6",
                                  "text-emerald-700 dark:text-emerald-300",
                                )}
                              >
                                Preferred schedule selected:{" "}
                                <span className="font-semibold">
                                  {formatFullDate(preferredDate)}
                                </span>{" "}
                                at{" "}
                                <span className="font-semibold">
                                  {preferredTime.time}
                                </span>
                                . This is still subject to Guidance Office
                                approval.
                              </div>

                              <div className="flex flex-wrap justify-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={resetPreferredDateAndTime}
                                  className="h-10 rounded-xl"
                                >
                                  Change Preferred Date
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={resetPreferredTime}
                                  className="h-10 rounded-xl"
                                >
                                  Change Preferred Time
                                </Button>
                              </div>

                              <div className="flex items-center justify-center pt-2">
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
                            </div>
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
                <RefreshCw
                  size={48}
                  className="animate-spin text-primary"
                />
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
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  Edit2,
  RefreshCw,
  UserPlus,
  Info,
} from "lucide-react";

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

  const { data: slots, isLoading } = useAvailableSlots(
    selectedDate || undefined,
  );
  const navigate = useNavigate();
  const { mutate: submit, isPending: isSubmitting } = useSubmitAppointment();

  const currentStep = !selectedDate ? 1 : !selectedTime ? 2 : 3;

  const steps = [
    { id: 1, label: "Preferred Date", icon: CalendarDays },
    { id: 2, label: "Preferred Time", icon: Clock },
    { id: 3, label: "Request Details", icon: FileText },
  ];

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  usePageMetadata(
    useMemo(() => {
      return {
        title: "Schedule Appointment",
        description:
          "Choose your preferred schedule. Your request is still subject to Guidance Office approval.",
        badgeText: "Preferred Schedule",
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
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          <Card
            className={cn(
              "mb-6 overflow-hidden rounded-[24px] border border-white/25",
              "bg-white/45 shadow-[0_16px_36px_rgba(15,23,42,0.06)]",
              "backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]",
            )}
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Preferred Schedule Process
                  </p>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    Select your preferred appointment date and time
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The schedule you choose will be submitted as a request and
                    will only be final once approved by the Guidance Office.
                  </p>
                </div>

                <div
                  className={cn(
                    "flex items-start gap-2 rounded-2xl border border-primary/15",
                    "bg-primary/10 px-3 py-2 text-xs text-primary",
                  )}
                >
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-[220px]">
                    Preferred schedule is subject to approval.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6 w-full">
            <div
              className={cn(
                "mx-auto flex w-full max-w-xs items-center justify-center",
                "gap-0 px-2 sm:max-w-lg",
              )}
            >
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    className="flex flex-1 items-center last:flex-none"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full",
                          "border transition-all duration-300",
                          isCompleted
                            ? "border-primary bg-primary text-primary-foreground"
                            : isCurrent
                              ? "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15"
                              : "border-white/25 bg-white/45 text-muted-foreground dark:border-white/10 dark:bg-white/[0.04]",
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        ) : (
                          <StepIcon className="h-4.5 w-4.5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "mt-1 hidden text-xs font-medium transition-colors sm:block",
                          isCurrent || isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </span>
                    </div>

                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "mx-2 h-0.5 flex-1 rounded-full transition-colors duration-300",
                          currentStep > step.id ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {(selectedDate || selectedTime) && (
            <Card
              className={cn(
                "mb-6 rounded-2xl border border-white/25 bg-white/45",
                "shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]",
              )}
            >
              <CardContent className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(undefined);
                        setSelectedTime(undefined);
                      }}
                      className={cn(
                        "group inline-flex items-center gap-2 rounded-full border",
                        "border-white/25 bg-white/60 px-3 py-1.5 text-sm font-medium",
                        "transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.05]",
                      )}
                    >
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {formatSelectedDate(selectedDate)}
                      <Edit2 className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                    </button>
                  )}

                  {selectedDate && selectedTime && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}

                  {selectedTime && (
                    <button
                      type="button"
                      onClick={() => setSelectedTime(undefined)}
                      className={cn(
                        "group inline-flex items-center gap-2 rounded-full border",
                        "border-white/25 bg-white/60 px-3 py-1.5 text-sm font-medium",
                        "transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/[0.05]",
                      )}
                    >
                      <Clock className="h-4 w-4 text-primary" />
                      {selectedTime.time}
                      <Edit2 className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
                    setAppointmentFormData((prev) => ({
                      ...prev,
                      whenDate: toISODateString(date),
                      timeSlot: { id: 0, time: "" },
                    }));
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
              </div>
            )}

            {currentStep === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <SlotSelector
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  availableSlots={slots || []}
                  loading={isLoading}
                  onTimeSelect={(time) => {
                    setSelectedTime(time);
                    setAppointmentFormData((prev) => ({
                      ...prev,
                      timeSlot: time,
                    }));
                  }}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <Card
                  className={cn(
                    "mb-6 rounded-2xl border border-emerald-500/20",
                    "bg-emerald-500/10 shadow-sm backdrop-blur-xl",
                  )}
                >
                  <CardContent className="px-5 py-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                          Preferred Schedule Selected
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-700/85 dark:text-emerald-300/85">
                          {new Date(
                            appointmentFormData.whenDate,
                          ).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          at {appointmentFormData.timeSlot.time}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-emerald-700/75 dark:text-emerald-300/75">
                          This is a preferred schedule request. The Guidance
                          Office may approve or reschedule it depending on
                          availability.
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDate(undefined);
                          setSelectedTime(undefined);
                        }}
                        className={cn(
                          "h-8 rounded-xl text-emerald-700 hover:bg-emerald-500/10",
                          "hover:text-emerald-800 dark:text-emerald-300",
                        )}
                      >
                        Change
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <AppointmentForm
                  data={appointmentFormData}
                  onChange={(name: string, value: any) => {
                    setAppointmentFormData((prev) => ({
                      ...prev,
                      [name]: value,
                    }));
                  }}
                  onSubmit={async () => {
                    const payload: CreateAppointmentRequest = {
                      reason: appointmentFormData.reason,
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
                  }}
                  isLoading={isLoading}
                  isSubmitting={isSubmitting}
                />
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
              "justify-center bg-slate-950/40 shadow-md backdrop-blur-sm",
            )}
          >
            <div
              className={cn(
                "flex w-[calc(100%-2rem)] max-w-sm flex-col items-center",
                "gap-4 rounded-2xl border border-white/20 bg-white/80 p-6",
                "shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80 sm:p-10",
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
                  Submitting Appointment Request
                </h3>
                <p className="max-w-[280px] text-sm text-muted-foreground">
                  Sending your preferred schedule to the Guidance Office. Please
                  wait...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
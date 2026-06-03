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
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  Edit2,
  CircleChevronLeft,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
  const { data: slots, isLoading } = useAvailableSlots(
    selectedDate || undefined,
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();

  const {
    mutate: submit,
    isPending: isSubmitting,
    isError,
  } = useSubmitAppointment();

  // Calculate current step for progress indicator
  const currentStep = !selectedDate ? 1 : !selectedTime ? 2 : 3;

  const steps = [
    { id: 1, label: "Date", icon: CalendarDays },
    { id: 2, label: "Time", icon: Clock },
    { id: 3, label: "Details", icon: FileText },
  ];

  const formatSelectedDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  usePageMetadata(
    useMemo(() => {
      return {
        title: "Schedule Appointment",
        description:
          "Select your preferred date and time. Please be descriptive about your concern to help our counselor prepare.",
        badgeText: "New Appointment",
        badgeIcon: <UserPlus className="h-3 w-3" />,
        isLoading: isLoading,
      };
    }, [isLoading]),
  );

  // Calculate max date (2 weeks from now)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);

  return (
    <>
      <div className="min-h-full bg-background">
        {/* Main Content */}
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
          {/* Compact Progress Bar */}
          <div className="mb-6 w-full">
            <div
              className={cn(
                "mx-auto flex w-full max-w-xs items-center justify-center",
                "gap-0 px-2 sm:max-w-md",
              )}
            >
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div
                    key={step.id}
                    className="flex items-center"
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : isCurrent
                              ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                              : "bg-muted text-muted-foreground"
                        } `}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        ) : (
                          <StepIcon className="h-4.5 w-4.5" />
                        )}
                      </div>
                      <span
                        className={`mt-1 hidden text-xs font-medium transition-colors sm:block ${
                          isCurrent || isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                        } `}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "mx-1 h-0.5 flex-1 rounded-full transition-colors",
                          "min-w-[1.5rem] duration-300 sm:mx-2",
                          "sm:min-w-[3.5rem]",
                          currentStep > step.id ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Items Summary Bar */}
          {(selectedDate || selectedTime) && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedDate && (
                    <button
                      onClick={() => {
                        setSelectedDate(undefined);
                        setSelectedTime(undefined);
                      }}
                      className={cn(
                        "group inline-flex items-center gap-2 rounded-full border",
                        "border-border bg-background px-3 py-1.5 text-sm font-medium",
                        "transition-colors hover:bg-muted",
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
                      onClick={() => setSelectedTime(undefined)}
                      className={cn(
                        "group inline-flex items-center gap-2 rounded-full border",
                        "border-border bg-background px-3 py-1.5 text-sm font-medium",
                        "transition-colors hover:bg-muted",
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

          {/* Single Column Wizard Steps */}
          <div className="space-y-6">
            {/* Step 1: Calendar */}
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

            {/* Step 2: Time Slots */}
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

            {/* Step 3: Details Form */}
            {currentStep === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Appointment Summary Card */}
                <Card className="mb-6 border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
                  <CardContent className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          Appointment Selected
                        </p>
                        <p className="mt-0.5 text-sm text-green-700 dark:text-green-300">
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
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDate(undefined);
                          setSelectedTime(undefined);
                        }}
                        className={cn(
                          "text-green-700 hover:bg-green-100 hover:text-green-800",
                          "dark:text-green-300 dark:hover:bg-green-900/30",
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
                  Reserving your slot and creating appointment. Please wait...
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

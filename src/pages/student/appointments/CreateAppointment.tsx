import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select-field";
import { FormField } from "@/components/ui/form-field";
import Calendar from "@/features/appointments/components/Calendar";
import SlotSelector from "@/features/appointments/components/SlotSelector";
import {
  useAvailableSlots,
  useCategories,
} from "@/features/appointments/hooks";
import {
  useSubmitAppointment,
} from "@/features/appointments/hooks/useAppointments";
import {
  TimeSlot,
  CreateAppointmentRequest,
  AvailableTimeSlotView,
} from "@/features/appointments/types";
import { toISODateString } from "@/utils/dateTime";
import { usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";

const MAX_REASON_LENGTH = 500;
const MAX_BOOKING_DAYS_AHEAD = 60;
const MAX_BACKUP_OPTIONS = 3;

interface BackupSchedule {
  date?: Date;
  timeSlot?: TimeSlot;
}

export default function CreateAppointment() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<TimeSlot>();
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [categoryId, setCategoryId] = useState<number>(0);
  const [reason, setReason] = useState<string>("");

  const [showBackupSchedule, setShowBackupSchedule] = useState(false);
  const [activeBackupTab, setActiveBackupTab] = useState(0);
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([
    { date: undefined, timeSlot: undefined },
    { date: undefined, timeSlot: undefined },
    { date: undefined, timeSlot: undefined },
  ]);

  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories();
  const { data: slots = [], isLoading: isSlotsLoading } =
    useAvailableSlots(selectedDate);

  const activeBackup = backupSchedules[activeBackupTab];
  const {
    data: activeBackupSlots = [],
    isLoading: isActiveBackupSlotsLoading,
  } = useAvailableSlots(activeBackup?.date);

  const { mutate: submitAppointment, isPending: isSubmitting } =
    useSubmitAppointment();

  usePageMetadata(
    useMemo(
      () => ({
        title: "Book Consultation Appointment",
        description: "Schedule your guidance and counseling consultation",
        badgeText: "Student Portal",
        badgeIcon: <CalendarDays className="h-4 w-4" />,
      }),
      [],
    ),
  );

  const maxAllowedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + MAX_BOOKING_DAYS_AHEAD);
    return d;
  }, []);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const hasPrimarySchedule = !!selectedDate && !!selectedTime?.id;
  const hasCategory = categoryId > 0;
  const hasReason = reason.trim().length > 0;
  const isFormValid = hasPrimarySchedule && hasCategory && hasReason;

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
  };

  const handleSlotSelect = (slot: AvailableTimeSlotView) => {
    setSelectedTime({ id: slot.id, time: slot.time });
  };

  const handleClearBackup = (indexToClear: number) => {
    setBackupSchedules((prev) => {
      const next = [...prev];
      for (let i = indexToClear; i < next.length; i++) {
        next[i] = { date: undefined, timeSlot: undefined };
      }
      return next;
    });
    if (activeBackupTab > indexToClear) {
      setActiveBackupTab(indexToClear);
    }
  };

  const handleSubmit = () => {
    if (!isFormValid || !selectedDate || !selectedTime) return;

    const payload: CreateAppointmentRequest = {
      whenDate: toISODateString(selectedDate),
      timeSlot: { id: selectedTime.id },
      appointmentCategory: { id: categoryId },
      reason: reason.trim(),
    };

    if (backupSchedules[0]?.date && backupSchedules[0]?.timeSlot?.id) {
      payload.preferredDate1 = toISODateString(backupSchedules[0].date);
      payload.preferredTimeSlot1 = { id: backupSchedules[0].timeSlot.id };
    }
    if (backupSchedules[1]?.date && backupSchedules[1]?.timeSlot?.id) {
      payload.preferredDate2 = toISODateString(backupSchedules[1].date);
      payload.preferredTimeSlot2 = { id: backupSchedules[1].timeSlot.id };
    }
    if (backupSchedules[2]?.date && backupSchedules[2]?.timeSlot?.id) {
      payload.preferredDate3 = toISODateString(backupSchedules[2].date);
      payload.preferredTimeSlot3 = { id: backupSchedules[2].timeSlot.id };
    }

    submitAppointment(payload, {
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

  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const filledBackupCount = backupSchedules.filter(
    (b) => b.date && b.timeSlot,
  ).length;

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl space-y-6 px-4 pb-12 sm:px-6 md:px-8",
      )}
    >
      {/* Schedule Context Banner (Replaces intrusive popup) */}
      <div
        className={cn(
          "flex flex-col gap-2.5 rounded-2xl border border-primary/20",
          "bg-primary/5 p-4 text-xs sm:flex-row sm:items-center",
          "sm:justify-between sm:text-sm",
        )}
      >
        <div className="flex items-center gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium text-foreground">
            Guidance Office Schedule: Consultations are strictly from{" "}
            <strong>8:00 AM to 5:00 PM</strong> on weekdays.
          </span>
        </div>
        <Badge
          variant="secondary"
          className="w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
        >
          Ma&apos;am Liwanag L. Maliksi
        </Badge>
      </div>

      {/* 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Left Column: Form & Schedule (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Interactive Schedule Picker */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  1. Select Date & Available Time Slot
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Click a date on the calendar, then choose your consultation time
              </p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                {/* Calendar sub-column */}
                <div className="md:col-span-6">
                  <Calendar
                    currentMonth={currentMonth}
                    selectedDate={selectedDate}
                    onMonthChange={setCurrentMonth}
                    onDateSelect={handleDateSelect}
                    title="Consultation Calendar"
                    occupiedDayColor="bg-primary/80"
                    hasHeader
                    allowCurrentDate={false}
                    allowPastDates={false}
                    maxDate={maxAllowedDate}
                    className="w-full border-0 p-0 shadow-none"
                  />
                </div>

                {/* Time slot sub-column */}
                <div
                  className={cn(
                    "border-t border-border/60 pt-4 md:col-span-6",
                    "md:border-l md:border-t-0 md:pl-6 md:pt-0",
                  )}
                >
                  <SlotSelector
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    availableSlots={slots}
                    loading={isSlotsLoading}
                    onTimeSelect={handleSlotSelect}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Consultation Details */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  2. Consultation Request Details
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Help the guidance counselor prepare for your consultation
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <SelectField
                label="Concern Category"
                value={categoryId}
                onChange={(val) => setCategoryId(Number(val))}
                options={categories}
                loading={isCategoriesLoading}
                required
              />

              <FormField
                label="Reason for Consultation"
                value={reason}
                onChange={(val) => setReason(val)}
                placeholder="Briefly state your concern or topic for counseling"
                isTextarea
                required
                maxChars={MAX_REASON_LENGTH}
                info={
                  "This note is confidential and read by the " +
                  "guidance counselor."
                }
              />
            </CardContent>
          </Card>

          {/* Card 3: Optional Backup Schedules (Up to 3) */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader
              className="cursor-pointer border-b border-border/60 py-3.5"
              onClick={() => setShowBackupSchedule(!showBackupSchedule)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium text-foreground">
                    Alternative Preferred Schedules (Optional — Up to 3)
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px]"
                  >
                    {filledBackupCount > 0
                      ? `${filledBackupCount} of ${MAX_BACKUP_OPTIONS} selected`
                      : "Optional"}
                  </Badge>
                </div>
                {showBackupSchedule ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {showBackupSchedule && (
              <CardContent className="space-y-4 p-4 sm:p-6">
                <p className="text-xs text-muted-foreground">
                  If your primary date has scheduling conflicts, the counselor
                  can consider up to 3 alternative backup options:
                </p>

                {/* Tab Selector */}
                <div
                  className={cn(
                    "flex flex-wrap items-center gap-2 border-b",
                    "border-border/60 pb-3",
                  )}
                >
                  {[0, 1, 2].map((idx) => {
                    const opt = backupSchedules[idx];
                    const isComplete = !!opt.date && !!opt.timeSlot;
                    const isTabActive = activeBackupTab === idx;
                    const isPrecedingEmpty =
                      idx > 0 &&
                      (!backupSchedules[idx - 1].date ||
                        !backupSchedules[idx - 1].timeSlot);

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isPrecedingEmpty}
                        onClick={() => {
                          if (!isPrecedingEmpty) {
                            setActiveBackupTab(idx);
                          }
                        }}
                        title={
                          isPrecedingEmpty
                            ? `Complete Option ${idx} first`
                            : undefined
                        }
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl px-3 py-1.5",
                          "text-xs font-semibold transition-all",
                          isPrecedingEmpty &&
                            "cursor-not-allowed opacity-40 hover:bg-muted/30",
                          !isPrecedingEmpty &&
                            (isTabActive
                              ? cn(
                                  "border border-primary/40 bg-primary/10",
                                  "text-primary shadow-sm",
                                )
                              : cn(
                                  "border border-border/70 bg-muted/30",
                                  "text-muted-foreground",
                                  "hover:bg-muted/60 hover:text-foreground",
                                )),
                        )}
                      >
                        <span>Option {idx + 1}</span>
                        {isComplete && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Tab Schedule Picker */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                  <div className="md:col-span-6">
                    <Calendar
                      currentMonth={activeBackup.date || new Date()}
                      selectedDate={activeBackup.date}
                      onMonthChange={() => {}}
                      onDateSelect={(d) => {
                        setBackupSchedules((prev) => {
                          const next = [...prev];
                          next[activeBackupTab] = {
                            date: d,
                            timeSlot: undefined,
                          };
                          for (
                            let i = activeBackupTab + 1;
                            i < next.length;
                            i++
                          ) {
                            next[i] = {
                              date: undefined,
                              timeSlot: undefined,
                            };
                          }
                          return next;
                        });
                      }}
                      title={`Backup Option ${activeBackupTab + 1} Date`}
                      occupiedDayColor="bg-primary/80"
                      hasHeader
                      allowCurrentDate={false}
                      allowPastDates={false}
                      maxDate={maxAllowedDate}
                      className="w-full border-0 p-0 shadow-none"
                    />
                  </div>
                  <div
                    className={cn(
                      "md:col-span-6 md:border-l md:border-border/60 md:pl-6",
                    )}
                  >
                    {activeBackup.date ? (
                      <div className="space-y-3">
                        <SlotSelector
                          selectedDate={activeBackup.date}
                          selectedTime={activeBackup.timeSlot}
                          availableSlots={activeBackupSlots}
                          loading={isActiveBackupSlotsLoading}
                          onTimeSelect={(slot) => {
                            setBackupSchedules((prev) => {
                              const next = [...prev];
                              next[activeBackupTab] = {
                                ...next[activeBackupTab],
                                timeSlot: { id: slot.id, time: slot.time },
                              };
                              return next;
                            });
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleClearBackup(activeBackupTab)}
                          className={cn(
                            "h-8 text-xs text-muted-foreground",
                            "hover:text-destructive",
                          )}
                        >
                          Clear Option {activeBackupTab + 1}
                        </Button>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex min-h-[220px] flex-col items-center",
                          "justify-center rounded-xl border border-dashed",
                          "border-border/70 p-4 text-center",
                        )}
                      >
                        <Clock
                          className="mb-1.5 h-6 w-6 text-muted-foreground/50"
                        />
                        <p className="text-xs font-medium text-foreground">
                          Select a date on the calendar for Option{" "}
                          {activeBackupTab + 1}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column: Sticky Booking Summary (4 cols) */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:col-span-4">
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-3">
              <CardTitle
                className={cn(
                  "text-sm font-bold uppercase tracking-wider",
                  "text-muted-foreground",
                )}
              >
                Appointment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Selected Schedule Pill */}
              <div
                className="rounded-xl border border-border/70 bg-muted/30 p-3"
              >
                <span
                  className="text-[11px] font-semibold text-muted-foreground"
                >
                  Primary Schedule
                </span>
                {formattedDate && selectedTime?.time ? (
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">
                      {formattedDate}
                    </p>
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs"
                    >
                      {selectedTime.time}
                    </Badge>
                  </div>
                ) : (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    Select a date and time slot
                  </p>
                )}
              </div>

              {/* Concern Category */}
              <div
                className="rounded-xl border border-border/70 bg-muted/30 p-3"
              >
                <span
                  className="text-[11px] font-semibold text-muted-foreground"
                >
                  Category
                </span>
                <p className="mt-1 text-xs font-semibold text-foreground">
                  {selectedCategory?.name || (
                    <span className="italic text-muted-foreground">
                      No category selected
                    </span>
                  )}
                </p>
              </div>

              {/* Backup Schedules Summary */}
              {filledBackupCount > 0 && (
                <div
                  className="rounded-xl border border-border/70 bg-muted/30 p-3"
                >
                  <span
                    className="text-[11px] font-semibold text-muted-foreground"
                  >
                    Backup Options ({filledBackupCount})
                  </span>
                  <div className="mt-1.5 space-y-1 text-xs">
                    {backupSchedules.map((b, idx) => {
                      if (!b.date || !b.timeSlot) return null;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between",
                            "text-muted-foreground",
                          )}
                        >
                          <span>
                            Opt {idx + 1}:{" "}
                            {b.date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span
                            className="font-mono text-[11px] text-foreground"
                          >
                            {b.timeSlot.time}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Readiness Checklist */}
              <div className="space-y-2 border-t border-border/60 pt-3">
                <span className="text-xs font-semibold text-muted-foreground">
                  Booking Checklist (3-Click Rule):
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    {hasPrimarySchedule ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span
                      className={cn(
                        hasPrimarySchedule
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      Date & Time slot selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasCategory ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span
                      className={cn(
                        hasCategory
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      Concern category selected
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasReason ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span
                      className={cn(
                        hasReason
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      Reason for consultation provided
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
                className={cn(
                  "w-full rounded-xl py-5 text-sm font-semibold shadow-sm",
                )}
              >
                {isSubmitting ? "Booking Appointment..." : "Book Appointment"}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                You will receive a notification once the counselor confirms your
                appointment slot.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

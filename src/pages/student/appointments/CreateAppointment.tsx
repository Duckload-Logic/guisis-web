import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Building2,
  Info,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  User,
  Users,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SelectField } from "@/components/ui/select-field";
import { FormField } from "@/components/ui/form-field";
import Calendar, {
  type DisabledDateReason,
} from "@/features/appointments/components/Calendar";
import SlotSelector from "@/features/appointments/components/SlotSelector";
import {
  useAvailableSlots,
  useCategories,
  useCounselors,
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
import { getFallbackHolidayName } from "@/utils/holidays";
import { useAuth, usePageMetadata, useToast } from "@/context";
import { useFormShortcuts, useLocalDraft } from "@/hooks";
import { AnimationStyles } from "@/components/ui/animations";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import { CRISIS_CONTACTS, STUDENT_ROUTES } from "@/config/constants";
import {
  CounselorPreferenceModal,
  formatCounselorFullName,
} from "./components/CounselorPreferenceModal";

const MAX_REASON_LENGTH = 500;
const MAX_BOOKING_DAYS_AHEAD = 60;
const APPOINTMENT_DRAFT_PREFIX = "guisis_draft_appointment_";

function isNonWorkingAppointmentDate(date: Date): boolean {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;
  const isHoliday = Boolean(
    getFallbackHolidayName(toISODateString(date)),
  );

  return isWeekend || isHoliday;
}

interface BackupSchedule {
  date?: Date;
  timeSlot?: TimeSlot;
}

interface AppointmentDraftState {
  selectedDateIso?: string;
  selectedTime?: TimeSlot;
  categoryId: number;
  reason: string;
  preferredCounselorId?: string;
  counselorPreference?: string;
}

const EMPTY_APPOINTMENT_DRAFT: AppointmentDraftState = {
  selectedDateIso: undefined,
  selectedTime: undefined,
  categoryId: 0,
  reason: "",
  preferredCounselorId: undefined,
  counselorPreference: "NO PREFERENCE",
};

export default function CreateAppointment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerToast } = useToast();

  const draftKey = `${APPOINTMENT_DRAFT_PREFIX}${user?.id || "anon"}`;
  const {
    draft: savedDraft,
    setDraft: setSavedDraft,
    clearDraft: clearSavedDraft,
  } = useLocalDraft<AppointmentDraftState>(draftKey, EMPTY_APPOINTMENT_DRAFT);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() =>
    savedDraft.selectedDateIso
      ? new Date(`${savedDraft.selectedDateIso}T00:00:00`)
      : undefined,
  );
  const [selectedTime, setSelectedTime] = useState<TimeSlot | undefined>(
    () => savedDraft.selectedTime,
  );
  const [currentMonth, setCurrentMonth] = useState<Date>(
    () =>
      savedDraft.selectedDateIso
        ? new Date(`${savedDraft.selectedDateIso}T00:00:00`)
        : new Date(),
  );

  const [categoryId, setCategoryId] = useState<number>(
    () => savedDraft.categoryId || 0,
  );
  const [reason, setReason] = useState<string>(() => savedDraft.reason || "");

  const [activeScheduleOption, setActiveScheduleOption] = useState<number>(0);
  const [backupMonth0, setBackupMonth0] = useState<Date>(() => new Date());
  const [backupMonth1, setBackupMonth1] = useState<Date>(() => new Date());
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([
    { date: undefined, timeSlot: undefined },
    { date: undefined, timeSlot: undefined },
  ]);

  const { data: counselors = [], isLoading: isCounselorsLoading } =
    useCounselors();
  const [selectedCounselorId, setSelectedCounselorId] = useState<
    string | undefined
  >(() => savedDraft.preferredCounselorId);
  const [selectedPreference, setSelectedPreference] = useState<string>(
    () => savedDraft.counselorPreference || "NO PREFERENCE",
  );
  const [isCounselorModalOpen, setIsCounselorModalOpen] = useState(false);

  useEffect(() => {
    setSavedDraft({
      selectedDateIso: selectedDate ? toISODateString(selectedDate) : undefined,
      selectedTime,
      categoryId,
      reason,
      preferredCounselorId: selectedCounselorId,
      counselorPreference: selectedPreference,
    });
  }, [
    selectedDate,
    selectedTime,
    categoryId,
    reason,
    selectedCounselorId,
    selectedPreference,
    setSavedDraft,
  ]);

  const { data: categories = [], isLoading: isCategoriesLoading } =
    useCategories();
  const { data: slots = [], isLoading: isSlotsLoading } =
    useAvailableSlots(selectedDate);
  const { data: backupSlots0 = [], isLoading: isBackupSlotsLoading0 } =
    useAvailableSlots(backupSchedules[0]?.date);
  const { data: backupSlots1 = [], isLoading: isBackupSlotsLoading1 } =
    useAvailableSlots(backupSchedules[1]?.date);

  const { mutate: submitAppointment, isPending: isSubmitting } =
    useSubmitAppointment();

  const isCrisisDetected = useMemo(() => {
    if (!reason || reason.trim().length < 4) return false;
    const lower = reason.toLowerCase();
    const crisisKeywords = [
      "tulong",
      "help",
      "emergency",
      "saklolo",
      "suko",
      "suicide",
      "ayoko na",
      "di ko na kaya",
      "mawala",
      "disappear",
      "ending it",
      "self harm",
      "hurting myself",
      "die",
      "mamatay",
    ];
    return crisisKeywords.some((kw) => lower.includes(kw));
  }, [reason]);

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
  const selectedCounselor = counselors.find(
    (c) => c.userId === selectedCounselorId,
  );

  const hasPrimarySchedule = !!selectedDate && !!selectedTime?.id;
  const hasCategory = categoryId > 0;
  const hasReason = reason.trim().length > 0;
  const isFormValid = hasPrimarySchedule && hasCategory && hasReason;

  const hasDraftProgress = Boolean(
    selectedDate ||
      selectedTime ||
      categoryId > 0 ||
      reason.trim() ||
      selectedCounselorId,
  );

  const handleResetDraft = () => {
    clearSavedDraft();
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setCategoryId(0);
    setReason("");
    setSelectedCounselorId(undefined);
    setSelectedPreference("NO PREFERENCE");
    setBackupSchedules([
      { date: undefined, timeSlot: undefined },
      { date: undefined, timeSlot: undefined },
    ]);
    triggerToast("Saved appointment progress cleared.");
  };

  const handleDateSelect = (date: Date) => {
    if (isNonWorkingAppointmentDate(date)) {
      triggerToast(
        "Appointments cannot be scheduled on non-working days.",
      );
      return;
    }

    setSelectedDate(date);
    setSelectedTime(undefined);
    setBackupMonth0(new Date(date.getFullYear(), date.getMonth(), 1));
    setBackupMonth1(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const handleDisabledDateClick = (
    _date: Date,
    reasonCode: DisabledDateReason,
  ) => {
    if (reasonCode === "weekend" || reasonCode === "holiday") {
      triggerToast(
        "Appointments cannot be scheduled on non-working days.",
      );
      return;
    }

    if (reasonCode === "today") {
      triggerToast("Same-day appointments cannot be scheduled.");
      return;
    }

    if (reasonCode === "past") {
      triggerToast("Past dates cannot be selected for appointments.");
      return;
    }

    if (reasonCode === "after-max") {
      triggerToast(
        `Appointments can only be booked up to ${MAX_BOOKING_DAYS_AHEAD} ` +
          "days ahead.",
      );
      return;
    }

    triggerToast("This date is unavailable for appointment scheduling.");
  };

  const handleSlotSelect = (slot: AvailableTimeSlotView) => {
    setSelectedTime({ id: slot.id, time: slot.time });
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = () => {
    if (
      !isFormValid ||
      !selectedDate ||
      !selectedTime ||
      isSubmitting ||
      isSubmittingRef.current
    ) {
      return;
    }
    const requestedDates = [
      selectedDate,
      ...backupSchedules.map((schedule) => schedule.date),
    ].filter((date): date is Date => Boolean(date));

    if (requestedDates.some(isNonWorkingAppointmentDate)) {
      triggerToast(
        "Appointments cannot be scheduled on non-working days.",
      );
      return;
    }

    isSubmittingRef.current = true;

    const payload: CreateAppointmentRequest = {
      whenDate: toISODateString(selectedDate),
      timeSlot: { id: selectedTime.id },
      appointmentCategory: { id: categoryId },
      reason: reason.trim(),
      preferredCounselorId: selectedCounselorId,
      counselorPreference: selectedPreference,
    };

    if (backupSchedules[0]?.date && backupSchedules[0]?.timeSlot?.id) {
      payload.preferredDate1 = toISODateString(backupSchedules[0].date);
      payload.preferredTimeSlot1 = { id: backupSchedules[0].timeSlot.id };
    }
    if (backupSchedules[1]?.date && backupSchedules[1]?.timeSlot?.id) {
      payload.preferredDate2 = toISODateString(backupSchedules[1].date);
      payload.preferredTimeSlot2 = { id: backupSchedules[1].timeSlot.id };
    }

    submitAppointment(payload, {
      onSuccess: () => {
        clearSavedDraft();
        triggerToast(
          "Appointment booked successfully! Awaiting counselor review.",
        );
        navigate(STUDENT_ROUTES.APPOINTMENTS);
      },
      onError: (error: any) => {
        isSubmittingRef.current = false;
        if (error.message?.includes("IIR profile")) {
          triggerToast("Please complete your IIR profile first.");
          navigate(STUDENT_ROUTES.IIR_FORM);
          return;
        }
        triggerToast(getErrorMessage(error));
      },
      onSettled: () => {
        isSubmittingRef.current = false;
      },
    });
  };

  useFormShortcuts({
    onSubmit: handleSubmit,
    enabled: isFormValid && !isSubmitting,
  });

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
      <AnimationStyles />

      {/* Schedule Context Banner (Replaces intrusive popup) */}
      <div
        className={cn(
          "animate-fade-in-up flex flex-col gap-2.5 rounded-2xl border",
          "border-primary/20 bg-primary/5 p-4 text-xs sm:flex-row",
          "sm:items-center sm:justify-between sm:text-sm",
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
        <div
          className="animate-fade-in-up space-y-6 lg:col-span-8"
          style={{ animationDelay: "0.04s", animationFillMode: "both" }}
        >
          {/* Card 1: Preferred Schedule Options (1 to 3) */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <div
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base font-semibold">
                    1. Preferred Consultation Schedules (Options 1 to 3)
                  </CardTitle>
                </div>
                {hasDraftProgress && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetDraft}
                    className={cn(
                      "h-9 gap-1.5 rounded-lg text-xs text-muted-foreground",
                      "hover:text-destructive",
                    )}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Draft
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Select your primary date and time, and optionally provide
                alternative options
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {/* Clinical Justification Banner */}
              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border",
                  "border-primary/20 bg-primary/5 p-3 text-xs",
                  "text-foreground",
                )}
              >
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="leading-relaxed">
                  <strong>Schedule Options:</strong> Please provide up to three
                  (3) preferred schedule options. This allows the Guidance Office
                  to better address the needs of the students scheduled for
                  counseling as well as the availability of the counselors.
                </p>
              </div>

              {/* Option Selector Tabs */}
              <div
                className={cn(
                  "flex flex-wrap items-center gap-2 border-b",
                  "border-border/60 pb-3",
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveScheduleOption(0)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-xl px-3.5 py-2",
                    "text-xs font-semibold transition-all",
                    activeScheduleOption === 0
                      ? cn(
                          "border border-primary/40 bg-primary/10",
                          "text-primary shadow-sm",
                        )
                      : cn(
                          "border border-border/70 bg-muted/30",
                          "text-muted-foreground hover:bg-muted/60",
                          "hover:text-foreground",
                        ),
                  )}
                >
                  <span>Option 1 (Primary - Required)</span>
                  {hasPrimarySchedule && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveScheduleOption(1)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-xl px-3.5 py-2",
                    "text-xs font-semibold transition-all",
                    activeScheduleOption === 1
                      ? cn(
                          "border border-primary/40 bg-primary/10",
                          "text-primary shadow-sm",
                        )
                      : cn(
                          "border border-border/70 bg-muted/30",
                          "text-muted-foreground hover:bg-muted/60",
                          "hover:text-foreground",
                        ),
                  )}
                >
                  <span>Option 2 (Optional)</span>
                  {backupSchedules[0]?.date &&
                    backupSchedules[0]?.timeSlot && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveScheduleOption(2)}
                  className={cn(
                    "flex min-h-11 items-center gap-2 rounded-xl px-3.5 py-2",
                    "text-xs font-semibold transition-all",
                    activeScheduleOption === 2
                      ? cn(
                          "border border-primary/40 bg-primary/10",
                          "text-primary shadow-sm",
                        )
                      : cn(
                          "border border-border/70 bg-muted/30",
                          "text-muted-foreground hover:bg-muted/60",
                          "hover:text-foreground",
                        ),
                  )}
                >
                  <span>Option 3 (Optional)</span>
                  {backupSchedules[1]?.date &&
                    backupSchedules[1]?.timeSlot && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                </button>
              </div>

              {/* Active Option Notice / Clear Button */}
              {activeScheduleOption > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Configuring Option {activeScheduleOption + 1} (Alternative)
                  </span>
                  {(backupSchedules[activeScheduleOption - 1]?.date ||
                    backupSchedules[activeScheduleOption - 1]?.timeSlot) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBackupSchedules((prev) => {
                          const next = [...prev];
                          next[activeScheduleOption - 1] = {
                            date: undefined,
                            timeSlot: undefined,
                          };
                          return next;
                        });
                        triggerToast(
                          `Option ${activeScheduleOption + 1} cleared.`,
                        );
                      }}
                      className={cn(
                        "h-8 gap-1 rounded-lg text-xs text-muted-foreground",
                        "hover:text-destructive",
                      )}
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear Option {activeScheduleOption + 1}
                    </Button>
                  )}
                </div>
              )}

              {/* Calendar & Slot Selector */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                {/* Calendar Column */}
                <div className="md:col-span-6">
                  {activeScheduleOption === 0 && (
                    <Calendar
                      currentMonth={currentMonth}
                      selectedDate={selectedDate}
                      onMonthChange={setCurrentMonth}
                      onDateSelect={handleDateSelect}
                      onDisabledDateClick={handleDisabledDateClick}
                      title="Option 1 Date (Primary)"
                      occupiedDayColor="bg-primary/80"
                      hasHeader
                      allowCurrentDate={false}
                      allowPastDates={false}
                      allowWeekends={false}
                      maxDate={maxAllowedDate}
                      className="w-full border-0 p-0 shadow-none"
                    />
                  )}

                  {activeScheduleOption === 1 && (
                    <Calendar
                      currentMonth={backupMonth0}
                      selectedDate={backupSchedules[0]?.date}
                      onMonthChange={setBackupMonth0}
                      onDateSelect={(d) => {
                        if (isNonWorkingAppointmentDate(d)) {
                          triggerToast(
                            "Appointments cannot be scheduled on non-working days.",
                          );
                          return;
                        }
                        setBackupMonth0(
                          new Date(d.getFullYear(), d.getMonth(), 1),
                        );
                        setBackupSchedules((prev) => {
                          const next = [...prev];
                          next[0] = { date: d, timeSlot: undefined };
                          return next;
                        });
                      }}
                      onDisabledDateClick={handleDisabledDateClick}
                      title="Option 2 Date (Alternative)"
                      occupiedDayColor="bg-primary/80"
                      hasHeader
                      allowCurrentDate={false}
                      allowPastDates={false}
                      allowWeekends={false}
                      maxDate={maxAllowedDate}
                      className="w-full border-0 p-0 shadow-none"
                    />
                  )}

                  {activeScheduleOption === 2 && (
                    <Calendar
                      currentMonth={backupMonth1}
                      selectedDate={backupSchedules[1]?.date}
                      onMonthChange={setBackupMonth1}
                      onDateSelect={(d) => {
                        if (isNonWorkingAppointmentDate(d)) {
                          triggerToast(
                            "Appointments cannot be scheduled on non-working days.",
                          );
                          return;
                        }
                        setBackupMonth1(
                          new Date(d.getFullYear(), d.getMonth(), 1),
                        );
                        setBackupSchedules((prev) => {
                          const next = [...prev];
                          next[1] = { date: d, timeSlot: undefined };
                          return next;
                        });
                      }}
                      onDisabledDateClick={handleDisabledDateClick}
                      title="Option 3 Date (Alternative)"
                      occupiedDayColor="bg-primary/80"
                      hasHeader
                      allowCurrentDate={false}
                      allowPastDates={false}
                      allowWeekends={false}
                      maxDate={maxAllowedDate}
                      className="w-full border-0 p-0 shadow-none"
                    />
                  )}
                </div>

                {/* Time Slot Column */}
                <div
                  className={cn(
                    "border-t border-border/60 pt-4 md:col-span-6",
                    "md:border-l md:border-t-0 md:pl-6 md:pt-0",
                  )}
                >
                  {activeScheduleOption === 0 && (
                    <SlotSelector
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      availableSlots={slots}
                      loading={isSlotsLoading}
                      onTimeSelect={handleSlotSelect}
                    />
                  )}

                  {activeScheduleOption === 1 && (
                    <SlotSelector
                      selectedDate={backupSchedules[0]?.date}
                      selectedTime={backupSchedules[0]?.timeSlot}
                      availableSlots={backupSlots0}
                      loading={isBackupSlotsLoading0}
                      onTimeSelect={(slot) => {
                        setBackupSchedules((prev) => {
                          const next = [...prev];
                          next[0] = {
                            date: next[0].date,
                            timeSlot: { id: slot.id, time: slot.time },
                          };
                          return next;
                        });
                      }}
                    />
                  )}

                  {activeScheduleOption === 2 && (
                    <SlotSelector
                      selectedDate={backupSchedules[1]?.date}
                      selectedTime={backupSchedules[1]?.timeSlot}
                      availableSlots={backupSlots1}
                      loading={isBackupSlotsLoading1}
                      onTimeSelect={(slot) => {
                        setBackupSchedules((prev) => {
                          const next = [...prev];
                          next[1] = {
                            date: next[1].date,
                            timeSlot: { id: slot.id, time: slot.time },
                          };
                          return next;
                        });
                      }}
                    />
                  )}
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

              {/* Counselor Preference for First-Time Counseling (Requirement 1) */}
              <div className="space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground">
                      For students seeking counseling for the first time, kindly
                      select your preference:
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Select a preferred counselor or choose No Preference.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCounselorModalOpen(true)}
                    className="min-h-11 shrink-0 gap-1.5 rounded-xl text-xs font-semibold"
                  >
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>
                      {selectedPreference
                        ? "Change Preference"
                        : "Select Preference"}
                    </span>
                  </Button>
                </div>

                {/* Selected Counselor Preview Card */}
                <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background p-3">
                  {selectedCounselor ? (
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0 border border-primary/20">
                        <AvatarImage
                          src={selectedCounselor.profilePicture}
                          alt={formatCounselorFullName(selectedCounselor)}
                        />
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {selectedCounselor.firstName.charAt(0)}
                          {selectedCounselor.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">
                          {formatCounselorFullName(selectedCounselor)}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {selectedCounselor.position || "Guidance Counselor"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-foreground">
                          No Preference
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          Any available guidance counselor will be assigned
                        </p>
                      </div>
                    </div>
                  )}
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[10px] font-semibold uppercase"
                  >
                    {selectedPreference || "NO PREFERENCE"}
                  </Badge>
                </div>
              </div>

              <FormField
                label="Reason for Consultation"
                value={reason}
                onChange={(val) => setReason(val)}
                placeholder="Briefly state your concern or topic for counseling"
                isTextarea
                required
                maxChars={MAX_REASON_LENGTH}
                info={
                  "Confidential note read strictly by your guidance " +
                  "counselor. Progress is saved automatically in this session."
                }
              />

              {isCrisisDetected && (
                <div
                  className={cn(
                    "flex flex-col gap-2.5 rounded-xl border",
                    "border-destructive/30 bg-destructive/10 p-3.5",
                    "text-xs text-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-2 font-semibold",
                      "text-destructive",
                    )}
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Emergency & Crisis Support Information</span>
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    If you are experiencing severe distress or crisis,
                    support is accessible. While your request will be
                    prioritized by automated triage, direct institutional
                    hotlines are provided below.
                  </p>
                  <div
                    className={cn(
                      "space-y-1.5 rounded-lg border",
                      "border-destructive/20 bg-background/80 p-2.5",
                      "text-[11px]",
                    )}
                  >
                    <a
                      href={CRISIS_CONTACTS.ncmhTelHref}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-lg px-2",
                        "transition-colors hover:bg-destructive/10",
                      )}
                    >
                      <Phone
                        className="h-3.5 w-3.5 shrink-0 text-destructive"
                      />
                      <span>
                        <strong>National Crisis Hotline (NCMH):</strong>{" "}
                        <span className="underline">
                          {CRISIS_CONTACTS.displayHotline}
                        </span>
                      </span>
                    </a>
                    <div className="flex min-h-11 items-center gap-2 px-2">
                      <Building2
                        className="h-3.5 w-3.5 shrink-0 text-destructive"
                      />
                      <span>
                        <strong>PUP-Taguig Guidance Office:</strong> Direct
                        in-person walk-in consultation available
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border",
                  "border-primary/20 bg-primary/5 p-3 text-xs",
                  "text-muted-foreground",
                )}
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="leading-relaxed">
                  <strong className="text-foreground">
                    Strict Confidentiality:
                  </strong>{" "}
                  Your consultation reason is restricted exclusively to your
                  guidance counselor. It is never included in attendance exports
                  or shared with academic faculty.
                </p>
              </div>
            </CardContent>
          </Card>



        </div>

        {/* Right Column: Sticky Booking Summary (4 cols) */}
        <div
          className={cn(
            "animate-fade-in-up space-y-4 lg:sticky lg:top-6 lg:col-span-4",
          )}
          style={{ animationDelay: "0.08s", animationFillMode: "both" }}
        >
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
              {/* Option 1: Primary Schedule */}
              <div
                className="rounded-xl border border-border/70 bg-muted/30 p-3"
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    "text-muted-foreground",
                  )}
                >
                  Option 1 (Primary Schedule)
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

              {/* Alternative Schedules Summary (Options 2 and 3) */}
              {(backupSchedules[0]?.date || backupSchedules[1]?.date) && (
                <div
                  className={cn(
                    "rounded-xl border border-border/70",
                    "bg-muted/30 p-3",
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      "text-muted-foreground",
                    )}
                  >
                    Alternative Options
                  </span>
                  <div className="mt-1.5 space-y-1 text-xs">
                    {backupSchedules[0]?.date &&
                      backupSchedules[0]?.timeSlot && (
                        <div
                          className={cn(
                            "flex items-center justify-between",
                            "text-muted-foreground",
                          )}
                        >
                          <span>
                            Opt 2:{" "}
                            {backupSchedules[0].date.toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[11px] text-foreground",
                            )}
                          >
                            {backupSchedules[0].timeSlot.time}
                          </span>
                        </div>
                      )}
                    {backupSchedules[1]?.date &&
                      backupSchedules[1]?.timeSlot && (
                        <div
                          className={cn(
                            "flex items-center justify-between",
                            "text-muted-foreground",
                          )}
                        >
                          <span>
                            Opt 3:{" "}
                            {backupSchedules[1].date.toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-[11px] text-foreground",
                            )}
                          >
                            {backupSchedules[1].timeSlot.time}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Counselor Preference Summary */}
              <div
                className="rounded-xl border border-border/70 bg-muted/30 p-3"
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    "text-muted-foreground",
                  )}
                >
                  Counselor Preference
                </span>
                <p className="mt-1 text-xs font-semibold text-foreground">
                  {selectedPreference || "NO PREFERENCE"}
                </p>
              </div>

              {/* Concern Category */}
              <div
                className="rounded-xl border border-border/70 bg-muted/30 p-3"
              >
                <span
                  className={cn(
                    "text-[11px] font-semibold",
                    "text-muted-foreground",
                  )}
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
                      Option 1 Date & Time slot selected
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
                        hasReason ? "text-foreground" : "text-muted-foreground",
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
                title="Shortcut: Ctrl + Enter"
                className={cn(
                  "min-h-11 w-full rounded-xl py-5 text-sm font-semibold",
                  "shadow-sm",
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

      {/* Counselor Selection Modal */}
      <CounselorPreferenceModal
        isOpen={isCounselorModalOpen}
        onClose={() => setIsCounselorModalOpen(false)}
        counselors={counselors}
        isLoading={isCounselorsLoading}
        selectedCounselorId={selectedCounselorId}
        selectedPreference={selectedPreference}
        onSelect={(id, label) => {
          setSelectedCounselorId(id);
          setSelectedPreference(label || "NO PREFERENCE");
        }}
      />
    </div>
  );
}

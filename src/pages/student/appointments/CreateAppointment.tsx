import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Phone,
  Building2,
  Info,
  FileText,
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
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from "@/components/ui/responsive-modal";
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
  getCounselorGenderStyle,
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

  const { data: rawCounselors, isLoading: isCounselorsLoading } =
    useCounselors();
  const counselors = useMemo(
    () => (Array.isArray(rawCounselors) ? rawCounselors : []),
    [rawCounselors],
  );
  const [selectedCounselorId, setSelectedCounselorId] = useState<
    string | undefined
  >(() => savedDraft.preferredCounselorId);
  const [selectedPreference, setSelectedPreference] = useState<string>(
    () => savedDraft.counselorPreference || "NO PREFERENCE",
  );
  const [isCounselorModalOpen, setIsCounselorModalOpen] = useState(false);
  const [isNoCounselorConfirmOpen, setIsNoCounselorConfirmOpen] =
    useState(false);

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

  const { data: rawCategories, isLoading: isCategoriesLoading } =
    useCategories();
  const categories = useMemo(
    () => (Array.isArray(rawCategories) ? rawCategories : []),
    [rawCategories],
  );
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

  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const selectedCounselor = counselors?.find(
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

  const executeSubmit = () => {
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

  const handleInitiateSubmit = () => {
    if (!isFormValid || isSubmitting) return;

    const hasSpecificCounselor =
      Boolean(selectedCounselorId) && selectedPreference !== "NO PREFERENCE";

    if (!hasSpecificCounselor) {
      setIsNoCounselorConfirmOpen(true);
      return;
    }

    executeSubmit();
  };

  useFormShortcuts({
    onSubmit: handleInitiateSubmit,
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

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl space-y-6 px-3.5 pb-24 sm:px-6 md:px-8",
        "lg:pb-12",
      )}
    >
      <AnimationStyles />

      {/* Schedule Context Banner */}
      <div
        className={cn(
          "animate-fade-in-up flex items-center justify-between gap-3",
          "rounded-xl border border-border/80 bg-muted/40 px-4 py-3 text-xs",
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Guidance Office consultations:{" "}
            <strong className="text-foreground">8:00 AM – 5:00 PM</strong>,
            weekdays only.
          </span>
        </div>
        <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
          PUP-Taguig Guidance & Counseling Office
        </span>
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
                    1. Preferred Consultation Schedules
                  </CardTitle>
                </div>
                {hasDraftProgress && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetDraft}
                    className={cn(
                      "h-8 gap-1.5 rounded-lg text-xs text-muted-foreground",
                      "hover:text-destructive",
                    )}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Draft
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Select your primary date and time slot (up to 2 backup options)
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {/* Option Selector Tabs (Mobile-friendly segmented dock) */}
              <div
                className={cn(
                  "grid grid-cols-3 gap-1.5 rounded-xl border",
                  "border-border/60 bg-muted/30 p-1 sm:flex sm:flex-wrap",
                  "sm:border-0 sm:border-b sm:bg-transparent sm:p-0 sm:pb-3",
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveScheduleOption(0)}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-1.5",
                    "rounded-lg px-2 py-2 text-center text-xs font-semibold",
                    "transition-all sm:rounded-xl sm:px-3.5",
                    activeScheduleOption === 0
                      ? cn(
                          "border border-primary/40 bg-background text-primary",
                          "shadow-sm sm:bg-primary/10",
                        )
                      : cn(
                          "border border-transparent text-muted-foreground",
                          "hover:bg-muted/60 hover:text-foreground",
                          "sm:border-border/70 sm:bg-muted/30",
                        ),
                  )}
                >
                  <span className="sm:hidden">1. Primary</span>
                  <span className="hidden sm:inline">Option 1 (Primary)</span>
                  {hasPrimarySchedule && (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveScheduleOption(1)}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-1.5",
                    "rounded-lg px-2 py-2 text-center text-xs font-semibold",
                    "transition-all sm:rounded-xl sm:px-3.5",
                    activeScheduleOption === 1
                      ? cn(
                          "border border-primary/40 bg-background text-primary",
                          "shadow-sm sm:bg-primary/10",
                        )
                      : cn(
                          "border border-transparent text-muted-foreground",
                          "hover:bg-muted/60 hover:text-foreground",
                          "sm:border-border/70 sm:bg-muted/30",
                        ),
                  )}
                >
                  <span className="sm:hidden">2. Backup</span>
                  <span className="hidden sm:inline">Option 2 (Backup)</span>
                  {backupSchedules[0]?.date &&
                    backupSchedules[0]?.timeSlot && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveScheduleOption(2)}
                  className={cn(
                    "flex min-h-11 items-center justify-center gap-1.5",
                    "rounded-lg px-2 py-2 text-center text-xs font-semibold",
                    "transition-all sm:rounded-xl sm:px-3.5",
                    activeScheduleOption === 2
                      ? cn(
                          "border border-primary/40 bg-background text-primary",
                          "shadow-sm sm:bg-primary/10",
                        )
                      : cn(
                          "border border-transparent text-muted-foreground",
                          "hover:bg-muted/60 hover:text-foreground",
                          "sm:border-border/70 sm:bg-muted/30",
                        ),
                  )}
                >
                  <span className="sm:hidden">3. Backup</span>
                  <span className="hidden sm:inline">Option 3 (Backup)</span>
                  {backupSchedules[1]?.date &&
                    backupSchedules[1]?.timeSlot && (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
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
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-semibold">
                  2. Consultation Details
                </CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">
                Specify your concern category, counselor preference, and reason
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

              {/* Counselor Preference */}
              <div className="space-y-1.5">
                <label
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    "text-foreground",
                  )}
                >
                  Counselor Preference
                </label>
                <button
                  type="button"
                  onClick={() => setIsCounselorModalOpen(true)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-3",
                    "rounded-xl border border-border/80 bg-background px-3.5",
                    "py-2.5 text-left transition-colors hover:bg-muted/40",
                    "focus-visible:outline-none focus-visible:ring-2",
                    "focus-visible:ring-primary",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {selectedCounselor ? (
                      <Avatar className="h-8 w-8 shrink-0 border border-border">
                        <AvatarImage
                          src={selectedCounselor.profilePicture}
                          alt={formatCounselorFullName(selectedCounselor)}
                        />
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {selectedCounselor.firstName.charAt(0)}
                          {selectedCounselor.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Users className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {selectedCounselor
                          ? formatCounselorFullName(selectedCounselor)
                          : "No Preference (Any Available Counselor)"}
                      </p>
                      {selectedCounselor?.position ? (
                        <p className="truncate text-[11px] text-muted-foreground">
                          {selectedCounselor.position}
                        </p>
                      ) : (
                        <p className="truncate text-[11px] text-muted-foreground">
                          Tap to select a specific counselor
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-primary">
                    {selectedCounselor ? "Change" : "Choose"}
                  </span>
                </button>
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
                  "Strictly confidential. Read only by your assigned " +
                  "guidance counselor."
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
                    immediate support is available. While the Guidance Office
                    prioritizes urgent concerns, direct hotlines and walk-in
                    options are provided below.
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
                  "text-xs font-bold uppercase tracking-wider",
                  "text-muted-foreground",
                )}
              >
                Appointment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {/* Structured Key-Value Breakdown */}
              <div className="divide-y divide-border/60 text-xs">
                {/* Counselor Preference */}
                <div className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Counselor Preference
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCounselorModalOpen(true)}
                      className={cn(
                        "text-[11px] font-semibold text-primary",
                        "hover:underline",
                      )}
                    >
                      {selectedCounselor ? "Change" : "Select"}
                    </button>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {selectedCounselor
                        ? formatCounselorFullName(selectedCounselor)
                        : "No Preference (Any Counselor)"}
                    </span>
                    {selectedCounselor?.gender && (
                      <Badge variant="outline" className="text-[10px]">
                        {selectedCounselor.gender}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Primary Slot */}
                <div className="py-2.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Primary Schedule
                  </span>
                  {formattedDate && selectedTime?.time ? (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {formattedDate}
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {selectedTime.time}
                      </Badge>
                    </div>
                  ) : (
                    <p className="mt-1 italic text-muted-foreground">
                      Select date & time slot
                    </p>
                  )}
                </div>

                {/* Alternative Slots (conditionally rendered) */}
                {(backupSchedules[0]?.date || backupSchedules[1]?.date) && (
                  <div className="space-y-1.5 py-2.5">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Alternative Options
                    </span>
                    {backupSchedules[0]?.date &&
                      backupSchedules[0]?.timeSlot && (
                        <div className="flex items-center justify-between text-muted-foreground">
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
                          <span className="font-mono text-foreground">
                            {backupSchedules[0].timeSlot.time}
                          </span>
                        </div>
                      )}
                    {backupSchedules[1]?.date &&
                      backupSchedules[1]?.timeSlot && (
                        <div className="flex items-center justify-between text-muted-foreground">
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
                          <span className="font-mono text-foreground">
                            {backupSchedules[1].timeSlot.time}
                          </span>
                        </div>
                      )}
                  </div>
                )}


                {/* Category */}
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Category
                  </span>
                  <span className="max-w-[180px] truncate font-semibold text-foreground">
                    {selectedCategory?.name || (
                      <span className="font-normal italic text-muted-foreground">
                        Not selected
                      </span>
                    )}
                  </span>
                </div>

                {/* Reason status */}
                <div className="flex items-center justify-between pt-2.5">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Reason
                  </span>
                  <span
                    className={cn(
                      "font-semibold",
                      hasReason ? "text-emerald-600" : "text-amber-500",
                    )}
                  >
                    {hasReason ? "Provided" : "Required"}
                  </span>
                </div>
              </div>

              {/* Requirement Checklist */}
              <div className="space-y-1.5 border-t border-border/60 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Submission Checklist
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {hasPrimarySchedule ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <span
                      className={
                        hasPrimarySchedule
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      Primary date & time slot
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasCategory ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <span
                      className={
                        hasCategory
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      Concern category
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasReason ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <span
                      className={
                        hasReason
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }
                    >
                      Reason for consultation
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <Button
                onClick={handleInitiateSubmit}
                disabled={!isFormValid || isSubmitting}
                className={cn(
                  "min-h-11 w-full rounded-xl py-3 text-sm font-semibold",
                  "shadow-sm",
                )}
              >
                {isSubmitting ? "Booking Appointment..." : "Book Appointment"}
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                Confirmation will be sent once reviewed by the guidance office.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Floating Action Dock (Hidden on lg+ screens) */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-border",
          "bg-background/95 p-3 backdrop-blur-md lg:hidden",
          "pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
        )}
      >
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {formattedDate && selectedTime?.time ? (
                `${formattedDate} • ${selectedTime.time}`
              ) : (
                <span className="text-muted-foreground">
                  Select date & time slot
                </span>
              )}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {selectedCounselor
                ? formatCounselorFullName(selectedCounselor)
                : "No Preference (Any Counselor)"}
              {selectedCategory ? ` • ${selectedCategory.name}` : ""}
            </p>
          </div>
          <Button
            onClick={handleInitiateSubmit}
            disabled={!isFormValid || isSubmitting}
            className={cn(
              "min-h-11 shrink-0 rounded-xl px-5 text-xs font-semibold",
              "shadow-sm",
            )}
          >
            {isSubmitting ? "Booking..." : "Book Appointment"}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal when No Counselor is Selected */}
      <ResponsiveModal
        open={isNoCounselorConfirmOpen}
        onOpenChange={(open) => !open && setIsNoCounselorConfirmOpen(false)}
      >
        <ResponsiveModalContent className="sm:max-w-md">
          <ResponsiveModalHeader className="text-left">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <ResponsiveModalTitle className="text-base font-semibold">
                No Counselor Selected
              </ResponsiveModalTitle>
            </div>
            <ResponsiveModalDescription
              className={cn(
                "pt-2 text-xs leading-relaxed text-muted-foreground",
              )}
            >
              You haven&apos;t chosen a preferred guidance counselor. If you
              proceed, the Guidance Office will automatically assign any
              available counselor for your consultation.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          <ResponsiveModalFooter
            className={cn(
              "flex-col-reverse gap-2 border-t border-border/60 pt-3",
              "sm:flex-row sm:justify-end",
            )}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsNoCounselorConfirmOpen(false);
                setIsCounselorModalOpen(true);
              }}
              className="min-h-11 w-full text-xs font-semibold sm:w-auto"
            >
              Choose a Counselor
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsNoCounselorConfirmOpen(false);
                executeSubmit();
              }}
              disabled={isSubmitting}
              className="min-h-11 w-full text-xs font-semibold sm:w-auto"
            >
              Continue Booking
            </Button>
          </ResponsiveModalFooter>
        </ResponsiveModalContent>
      </ResponsiveModal>

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

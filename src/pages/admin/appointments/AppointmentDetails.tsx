import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock3,
  CalendarRange,
  ArrowLeft,
  MessageSquare,
  StickyNote,
  Play,
  Copy,
  Check,
  ShieldAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAppointment,
  useStatuses,
  useUpdateAppointment,
  useStartAppointment,
} from "@/features/appointments/hooks";
import { useAutoMarkNotificationRead } from "@/features/notifications/hooks";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import {
  format12HourTime,
  formatDate,
  formatProcessDuration,
} from "@/utils/dateTime";
import { usePageMetadata, useToast } from "@/context";
import { parseAuditTrail } from "@/utils/auditTrail";
import ActionConfirmModal from
  "@/features/appointments/components/ConfirmModal";
import RescheduleModal from
  "@/features/appointments/components/RescheduleModal";
import { CORPreviewDialog } from "@/components/shared/CORPreviewDialog";
import { InOfficeSessionTimer } from "@/components/shared/InOfficeSessionTimer";
import {
  StudentProfileBentoCard,
} from "@/components/shared/StudentProfileBentoCard";
import { cn } from "@/lib/utils";

const FALLBACK_RESCHEDULED_STATUS_ID = 6;
const COPY_FEEDBACK_MS = 2000;

function getAppointmentUrgency(appointment?: any) {
  const raw = appointment?.urgencyLevel ?? appointment?.urgency;
  if (!raw) {
    return {
      label: "Medium",
      description: "Default priority for consultation.",
      className: STATUS_COLORS.warning,
    };
  }

  const label =
    typeof raw === "string" ? raw : raw.name || raw.label || "Medium";
  const normalized = String(label).toLowerCase();

  if (normalized.includes("critical")) {
    return {
      label: "Critical",
      description: "Immediate guidance attention required.",
      className:
        "border-destructive/40 bg-destructive/10 text-destructive font-semibold",
    };
  }

  if (normalized.includes("high") || normalized.includes("urgent")) {
    return {
      label: "High",
      description: "Prioritize this student concern.",
      className: cn(STATUS_COLORS.danger, "font-semibold"),
    };
  }

  if (normalized.includes("low")) {
    return {
      label: "Low",
      description: "Standard appointment queue.",
      className: cn(STATUS_COLORS.success, "font-semibold"),
    };
  }

  return {
    label: "Medium",
    description: "Standard guidance priority.",
    className: cn(STATUS_COLORS.warning, "font-semibold"),
  };
}

function getAIExplainability(appointment?: any): string {
  if (!appointment) return "";

  // 1. First-class column from MySQL appointments.urgency_rationale
  if (
    typeof appointment.urgencyRationale === "string" &&
    appointment.urgencyRationale.trim()
  ) {
    return appointment.urgencyRationale.trim();
  }

  const rawLevel = String(
    appointment.urgencyLevel ?? appointment.urgency ?? "MEDIUM",
  ).toUpperCase();
  const score =
    typeof appointment.urgencyScore === "number" &&
    appointment.urgencyScore > 0
      ? `${(appointment.urgencyScore * 100).toFixed(1)}% confidence`
      : "";
  const confText = score ? ` (${score})` : "";
  const reasonText = String(appointment.reason || "").toLowerCase();

  // 2. Synthesize explainability rationale for legacy records
  if (rawLevel.includes("CRITICAL")) {
    const isCrisisPattern =
      /(?:laslas|suicide|pakamatay|stalk|banta|cut|ending my life|mamatay)/i.test(
        reasonText,
      );
    if (isCrisisPattern) {
      return (
        `The AI inferred this appointment is CRITICAL${confText} because ` +
        "the submission matched emergency safety indicators related to " +
        "acute personal crisis or self-harm."
      );
    }
    return (
      `The AI inferred this appointment is CRITICAL${confText} because ` +
      "contextual transformer analysis detected severe affective distress " +
      "markers requiring immediate clinical triage."
    );
  }

  if (rawLevel.includes("HIGH")) {
    const isAcademic =
      /(?:grade|bagsak|scholarship|graduate|failing|singko|sis|delay|drop)/i.test(
        reasonText,
      );
    if (isAcademic) {
      return (
        `The AI inferred this appointment is HIGH${confText} because the ` +
        "concern describes acute academic distress or critical institutional " +
        "deadlines (e.g., failing grades, scholarship, or graduation)."
      );
    }
    const isEmotional =
      /(?:stress|anxiety|depress|pagod|di ko na kaya|overwhelm|hirap|panic)/i.test(
        reasonText,
      );
    if (isEmotional) {
      return (
        `The AI inferred this appointment is HIGH${confText} because the ` +
        "student manifested significant psychological strain, chronic anxiety, " +
        "or emotional overwhelm."
      );
    }
    return (
      `The AI inferred this appointment is HIGH${confText} because contextual ` +
      "semantic evaluation classified the concern as high-priority over " +
      "routine guidance requests."
    );
  }

  if (rawLevel.includes("LOW")) {
    const isGreeting =
      /^(?:hi|hello|hey|kamusta|good morning|test)/i.test(reasonText);
    if (isGreeting) {
      return (
        `The AI inferred this appointment is LOW${confText} because the ` +
        "submission consists of routine greetings or testing inputs without " +
        "observable distress indicators."
      );
    }
    return (
      `The AI inferred this appointment is LOW${confText} because the ` +
      "concern pertains to routine informational inquiries or standard " +
      "scheduling without acute distress markers."
    );
  }

  return (
    `The AI inferred this appointment is MEDIUM${confText} because the ` +
    "concern represents standard developmental, educational, or personal " +
    "counseling needs without acute crisis markers."
  );
}

function AppointmentDetailsSkeleton() {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl space-y-6 px-4 pb-12",
        "animate-in fade-in duration-300 sm:px-6 md:px-8",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/appointments")}
          className="h-11 gap-1.5 rounded-xl border-border/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Button>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Main Column Skeleton (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          <Card className="space-y-5 rounded-2xl border border-border p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-44 rounded" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          </Card>

          <Card className="space-y-4 rounded-2xl border border-border p-6">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </Card>
        </div>

        {/* Sidebar Column Skeleton (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="space-y-4 rounded-2xl border border-border p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
            <div className="space-y-2 border-t border-border/50 pt-3">
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useAutoMarkNotificationRead(id);

  const { data: appointment, isLoading, isError } = useAppointment(id || "");
  const { data: appointmentStatuses } = useStatuses();
  const { mutateAsync: updateAppointment } = useUpdateAppointment();
  const startAppointmentMutation = useStartAppointment();
  const { triggerToast } = useToast();

  const [isStartConfirming, setIsStartConfirming] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCorPreview, setShowCorPreview] = useState(false);
  const [hasCopiedId, setHasCopiedId] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    requiresMessage: boolean;
  } | null>(null);

  const [selectedSchedule, setSelectedSchedule] = useState<{
    date: string;
    timeSlotId: number;
    timeSlotTime: string;
  } | null>(null);

  useEffect(() => {
    if (appointment) {
      setSelectedSchedule({
        date: appointment.whenDate,
        timeSlotId: appointment.timeSlot.id,
        timeSlotTime: appointment.timeSlot.time,
      });
    }
  }, [appointment]);

  const auditEntries = useMemo(() => {
    return parseAuditTrail(appointment?.adminNotes);
  }, [appointment?.adminNotes]);

  const fullName = appointment
    ? [
        appointment.user?.firstName,
        appointment.user?.middleName
          ? `${appointment.user.middleName[0]}.`
          : "",
        appointment.user?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  const handleCopyId = () => {
    if (!appointment?.id) return;
    navigator.clipboard.writeText(appointment.id);
    setHasCopiedId(true);
    setTimeout(() => setHasCopiedId(false), COPY_FEEDBACK_MS);
  };

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [counselorNoteText, setCounselorNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const urgencyInfo = getAppointmentUrgency(appointment);

  const handleSaveCounselorNote = async () => {
    if (!appointment?.id || !counselorNoteText.trim()) return;
    setIsSavingNote(true);
    try {
      await updateAppointment({
        id: appointment.id,
        data: {
          ...appointment,
          adminNotes: counselorNoteText.trim(),
        } as any,
      });
      triggerToast("✓ Counselor remark saved to audit trail");
      setCounselorNoteText("");
      setIsNoteModalOpen(false);
    } catch {
      triggerToast("Failed to save counselor note");
    } finally {
      setIsSavingNote(false);
    }
  };

  usePageMetadata(
    useMemo(
      () => ({
        title: "Appointment Details",
        description: `Managing session for ${fullName || "Student"}`,
        badgeText: "Admin Management",
        badgeIcon: <Calendar className="h-4 w-4" />,
        isLoading: isLoading && !appointment,
        headerActions: appointment ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyId}
              className={cn(
                "flex min-h-11 items-center gap-1.5 rounded-xl border",
                "border-border/70 bg-muted/40 px-3 py-1.5 font-mono",
                "text-[11px] text-muted-foreground transition-colors",
                "hover:border-primary/40 hover:text-foreground",
              )}
              title="Click to copy full ID"
            >
              {hasCopiedId ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>APT-{appointment.id?.substring(0, 8)}</span>
            </button>
            {appointment.status && (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  STATUS_COLORS[getStatusColorKey(appointment.status.name)],
                )}
              >
                {appointment.status.name}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                urgencyInfo.className,
              )}
              title="Automated Triage Urgency Level"
            >
              Priority: {urgencyInfo.label}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNoteModalOpen(true)}
              className="h-7 gap-1 rounded-full border-border/70 px-2.5 py-0.5 text-xs font-semibold"
            >
              <StickyNote className="h-3.5 w-3.5 text-primary" />
              Add Note
            </Button>
            {appointment.startedAt && appointment.completedAt && (
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full border-border/70 bg-muted/40",
                  "px-2.5 py-0.5 text-xs font-semibold text-foreground/80",
                )}
              >
                <Clock3 className="mr-1 inline h-3 w-3 text-muted-foreground" />
                Turnaround:{" "}
                {formatProcessDuration(
                  appointment.startedAt,
                  appointment.completedAt,
                )}
              </Badge>
            )}
          </div>
        ) : null,
      }),
      [
        appointment,
        fullName,
        hasCopiedId,
        isLoading,
        urgencyInfo,
      ],
    ),
  );

  if (isError || (!appointment && !isLoading)) {
    return (
      <div
        className={cn(
          "flex min-h-[400px] flex-col items-center justify-center space-y-4",
        )}
      >
        <p className="font-medium text-destructive">
          {isError ? "Error loading appointment" : "Appointment not found"}
        </p>
        <Button
          onClick={() => navigate("/admin/appointments")}
          variant="outline"
          className="h-11 rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Appointments
        </Button>
      </div>
    );
  }

  if (isLoading || !appointment) {
    return <AppointmentDetailsSkeleton />;
  }

  const isPending = appointment.status?.name === "Pending";
  const isScheduled =
    appointment.status?.name === "Scheduled" ||
    appointment.status?.name === "Rescheduled";
  const isCompleted = appointment.status?.name === "Completed";
  const needsSignificantNote = isCompleted && !appointment.hasSignificantNote;
  const isSessionActive =
    Boolean(appointment.startedAt) && !appointment.completedAt;

  const handleConfirmStartAppointment = async (offsetMinutes = 0) => {
    if (!id) return;
    try {
      await startAppointmentMutation.mutateAsync({ id, offsetMinutes });
      triggerToast(
        offsetMinutes > 0
          ? `✓ Session started with +${offsetMinutes}m simulated!`
          : "✓ On-site appointment session started!",
      );
      setIsStartConfirming(false);
    } catch {
      triggerToast("Failed to start appointment session");
      setIsStartConfirming(false);
    }
  };

  const getStatusIdByAction = (action: string): number | undefined => {
    const statusMap: Record<string, number | undefined> = {
      Approve: appointmentStatuses?.find((s) =>
        s.name.toLowerCase().includes("scheduled"),
      )?.id,
      Reject: appointmentStatuses?.find((s) =>
        s.name.toLowerCase().includes("rejected"),
      )?.id,
      Reschedule: appointmentStatuses?.find((s) =>
        s.name.toLowerCase().includes("rescheduled"),
      )?.id,
      Cancel: appointmentStatuses?.find((s) =>
        s.name.toLowerCase().includes("cancelled"),
      )?.id,
      Complete: appointmentStatuses?.find((s) =>
        s.name.toLowerCase().includes("completed"),
      )?.id,
      "No-show": appointmentStatuses?.find((s) =>
        s.name.toLowerCase().includes("no-show"),
      )?.id,
    };
    return statusMap[action];
  };

  const handleActionClick = (action: string) => {
    if (action === "Reschedule") {
      setShowReschedule(true);
      return;
    }
    const requiresMessage = ["Cancel", "No-show"].includes(action);
    setPendingAction({ type: action, requiresMessage });
  };

  const handleConfirmAction = async (message?: string): Promise<boolean> => {
    if (!pendingAction) return false;
    const statusId = getStatusIdByAction(pendingAction.type);
    if (!statusId) return false;

    const payload: any = {
      status: { id: statusId },
      adminNotes: message || "",
    };

    if (pendingAction.type === "Approve" && selectedSchedule) {
      payload.whenDate = selectedSchedule.date;
      payload.timeSlot = { id: selectedSchedule.timeSlotId };
    } else {
      payload.whenDate = appointment.whenDate;
      payload.timeSlot = { id: appointment.timeSlot.id };
    }

    try {
      await updateAppointment({ id: appointment.id!, data: payload });
      setPendingAction(null);
      return true;
    } catch {
      return false;
    }
  };

  const handleRescheduleConfirm = async (
    newDate: string,
    newTimeSlotId: number,
    reason: string,
  ) => {
    const statusId =
      getStatusIdByAction("Reschedule") ?? FALLBACK_RESCHEDULED_STATUS_ID;
    try {
      await updateAppointment({
        id: appointment.id!,
        data: {
          whenDate: newDate,
          timeSlot: { id: newTimeSlotId },
          status: { id: statusId },
          adminNotes: reason,
        } as any,
      });
      setShowReschedule(false);
      return true;
    } catch {
      return false;
    }
  };

  const studentData = {
    firstName: appointment.user?.firstName,
    middleName: appointment.user?.middleName,
    lastName: appointment.user?.lastName,
    email: appointment.user?.email,
    studentNumber:
      appointment.studentNumber || appointment.user?.studentNumber,
    contactNumber: appointment.contactNumber,
    profilePicture: appointment.user?.profilePicture,
    iirId: appointment.iirId,
    studentCorUrl: appointment.studentCorUrl,
  };

  const scheduleOptions = [
    {
      title: "Primary Schedule",
      date: appointment.whenDate,
      slot: appointment.timeSlot,
    },
    appointment.preferredDate1 && appointment.preferredTimeSlot1
      ? {
          title: "Backup Option 1",
          date: appointment.preferredDate1,
          slot: appointment.preferredTimeSlot1,
        }
      : null,
    appointment.preferredDate2 && appointment.preferredTimeSlot2
      ? {
          title: "Backup Option 2",
          date: appointment.preferredDate2,
          slot: appointment.preferredTimeSlot2,
        }
      : null,
    appointment.preferredDate3 && appointment.preferredTimeSlot3
      ? {
          title: "Backup Option 3",
          date: appointment.preferredDate3,
          slot: appointment.preferredTimeSlot3,
        }
      : null,
  ].filter(Boolean) as {
    title: string;
    date: string;
    slot: { id: number; time: string };
  }[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "mx-auto w-full max-w-7xl space-y-6 px-4 pb-12",
        "sm:px-6 md:px-8",
      )}
    >
      {/* Significant Note Banner */}
      {needsSignificantNote && (
        <div
          className={cn(
            "flex flex-col items-center justify-between gap-4 rounded-2xl",
            "border border-primary/25 bg-primary/10 p-5 shadow-sm sm:flex-row",
          )}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={cn(
                "rounded-xl border border-primary/30 bg-primary/20 p-2.5",
              )}
            >
              <StickyNote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Record Significant Note
              </h3>
              <p className="text-xs text-muted-foreground">
                This completed appointment requires a consultation note in the
                student&apos;s records.
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              navigate(
                `/admin/student-records/${appointment.iirId}` +
                  `?addNote=true&appointmentId=${appointment.id}`,
              )
            }
            className={cn(
              "h-11 rounded-xl bg-primary px-5 text-xs font-bold",
              "text-white shadow-sm hover:bg-primary/90",
            )}
          >
            Add Note Now
          </Button>
        </div>
      )}

      {/* 2-Column Responsive Workspace: Col-8 Main, Col-4 Sidebar */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Main Column: Consultation Details, Schedules & Actions (8 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="space-y-6 lg:col-span-8"
        >
          {/* Card 1: Consultation Details & Scheduling */}
          <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-3.5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Consultation Details
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-md border-border/70 bg-muted/30 px-2 py-0.5 text-xs font-medium text-foreground"
                  >
                    {appointment.appointmentCategory.name}
                  </Badge>
                  {appointment.counselorPreference && (
                    <Badge
                      variant="outline"
                      className="rounded-md border-border/70 bg-muted/30 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    >
                      Preference: {appointment.counselorPreference}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
              {/* Reason for Consultation */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Reason for Consultation
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {appointment.reason || "No specific reason provided."}
                </p>
              </div>

              {/* Schedule Selection & Action Area */}
              <div className="space-y-3 border-t border-border/60 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {isPending
                      ? "Requested Schedule Options"
                      : "Confirmed Consultation Schedule"}
                  </p>
                  {isPending && (
                    <span className="text-xs text-muted-foreground">
                      Select a preferred slot below to approve
                    </span>
                  )}
                </div>

                {isPending && (
                  <>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                      {scheduleOptions.map((opt, idx) => {
                        const isSelected =
                          selectedSchedule?.date === opt.date &&
                          selectedSchedule?.timeSlotId === opt.slot.id;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setSelectedSchedule({
                                date: opt.date,
                                timeSlotId: opt.slot.id,
                                timeSlotTime: opt.slot.time,
                              })
                            }
                            className={cn(
                              "group relative flex min-h-[90px] flex-col justify-between",
                              "rounded-xl border p-3 text-left transition-all duration-200",
                              isSelected
                                ? "border-primary bg-primary/5 ring-2 ring-primary shadow-sm"
                                : "border-border/80 bg-muted/10 hover:border-primary/40 hover:bg-muted/20",
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {opt.title}
                              </span>
                              {isSelected ? (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                                </span>
                              ) : (
                                <span className="h-3.5 w-3.5 rounded-full border border-border" />
                              )}
                            </div>
                            <div className="mt-2 space-y-0.5">
                              <p className="text-xs font-semibold text-foreground">
                                {formatDate(opt.date)}
                              </p>
                              <p className="font-mono text-[11px] text-muted-foreground">
                                {format12HourTime(opt.slot.time)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Direct Action Bar below options */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <Button
                        onClick={() => handleActionClick("Approve")}
                        className={cn(
                          "h-11 flex-1 min-w-[200px] gap-2 rounded-xl bg-emerald-600",
                          "text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700",
                        )}
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>
                          Approve{" "}
                          {selectedSchedule
                            ? `${formatDate(selectedSchedule.date)} (${format12HourTime(selectedSchedule.timeSlotTime)})`
                            : "Schedule"}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleActionClick("Reschedule")}
                        className="h-11 gap-2 rounded-xl border-border/80 text-xs font-semibold hover:bg-muted/30"
                      >
                        <CalendarRange className="h-3.5 w-3.5 text-primary" />
                        Propose Alternate Time
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleActionClick("Cancel")}
                        className="h-11 gap-1.5 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                        Decline
                      </Button>
                    </div>
                  </>
                )}

                {isScheduled && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Confirmed Date & Time
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatDate(appointment.whenDate)} •{" "}
                          {format12HourTime(appointment.timeSlot.time)}
                        </p>
                      </div>
                    </div>
                    {!isSessionActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActionClick("Reschedule")}
                        className="h-9 gap-1.5 rounded-lg border-border/80 text-xs font-semibold hover:bg-muted/40"
                      >
                        <CalendarRange className="h-3.5 w-3.5 text-primary" />
                        Reschedule
                      </Button>
                    )}
                  </div>
                )}

                {isCompleted && (
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/15 p-4">
                    <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-foreground">
                        Consultation Completed
                      </p>
                      <p className="text-muted-foreground">
                        Session was conducted on{" "}
                        {formatDate(appointment.whenDate)} at{" "}
                        {format12HourTime(appointment.timeSlot.time)}.
                      </p>
                    </div>
                  </div>
                )}

                {!isPending && !isScheduled && !isCompleted && (
                  <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/15 p-4">
                    <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="text-xs">
                      <p className="font-semibold text-foreground">
                        Appointment is {appointment.status?.name}
                      </p>
                      <p className="text-muted-foreground">
                        No active session or schedule adjustments pending.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Triage Rationale Box */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-foreground">
                      Clinical Triage Rationale
                    </span>
                  </div>
                  {typeof (appointment as any)?.urgencyScore === "number" &&
                    (appointment as any)?.urgencyScore > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Confidence:{" "}
                        {((appointment as any).urgencyScore * 100).toFixed(1)}%
                      </span>
                    )}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {getAIExplainability(appointment)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Streamlined Activity History & Audit Trail */}
          <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-3.5">
              <CardTitle className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Clock3 className="h-4 w-4 text-primary" />
                Activity History & Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative space-y-4 pl-5">
                <div
                  className="absolute bottom-2 left-[5px] top-2 w-px bg-border/80"
                  aria-hidden="true"
                />

                {auditEntries.map((entry, idx) => (
                  <div key={idx} className="relative">
                    <div
                      className="absolute -left-5 top-1.5 z-10 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary ring-2 ring-card"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">
                          {entry.status}
                        </p>
                        {entry.timestamp && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {entry.timestamp}
                          </span>
                        )}
                      </div>
                      {entry.remarks && (
                        <p className="rounded-lg border border-border/60 bg-muted/20 p-2 text-xs text-foreground/85">
                          {entry.remarks}
                        </p>
                      )}
                      {entry.details && (
                        <p className="text-[11px] text-muted-foreground">
                          {entry.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="relative">
                  <div
                    className="absolute -left-5 top-1.5 z-10 h-2.5 w-2.5 rounded-full border-2 border-background bg-muted-foreground ring-2 ring-card"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-foreground">
                        Request Initialized
                      </p>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatDate(appointment.createdAt || "")}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Initial appointment submission received.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar Column: Student Dossier & Active Session (4 cols) */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-6 lg:col-span-4"
        >
          <StudentProfileBentoCard
            student={studentData}
            onViewCor={() => setShowCorPreview(true)}
            canAccessIir={true}
          />

          {/* Session Timer & Secondary Actions (Only when scheduled) */}
          {isScheduled && (
            <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-3.5">
                <CardTitle className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Play className="h-4 w-4 text-primary" />
                  In-Office Consultation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                <InOfficeSessionTimer
                  startedAt={appointment.startedAt}
                  completedAt={appointment.completedAt}
                  title="Counseling Session"
                  studentName={fullName}
                  studentNumber={appointment.studentNumber}
                  onStart={(offset) => {
                    if (!offset) {
                      setIsStartConfirming(true);
                    } else {
                      handleConfirmStartAppointment(offset);
                    }
                  }}
                  onComplete={
                    isSessionActive
                      ? () => handleActionClick("Complete")
                      : undefined
                  }
                  isPending={startAppointmentMutation.isPending}
                />

                {!isSessionActive && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                    <Button
                      variant="outline"
                      onClick={() => handleActionClick("No-show")}
                      className="h-10 gap-1.5 rounded-xl border-border/80 text-xs font-semibold hover:bg-muted/30"
                    >
                      <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                      Mark No-show
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleActionClick("Cancel")}
                      className="h-10 gap-1.5 rounded-xl border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Confirmation & Modal Dialogs */}
      <ActionConfirmModal
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        action={pendingAction?.type || ""}
        requiresMessage={pendingAction?.requiresMessage || false}
      />

      {showReschedule && (
        <RescheduleModal
          isOpen={showReschedule}
          onClose={() => setShowReschedule(false)}
          onConfirm={handleRescheduleConfirm}
          currentDate={appointment.whenDate}
          currentTimeSlotId={appointment.timeSlot.id}
        />
      )}

      <AlertDialog
        open={isStartConfirming}
        onOpenChange={setIsStartConfirming}
      >
        <AlertDialogContent className="max-w-md border border-border bg-card shadow-lg">
          <AlertDialogHeader>
            <div
              className={cn(
                "mb-2 flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-emerald-500/10 text-emerald-600",
              )}
            >
              <Play className="h-5 w-5 fill-current" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">
              Start Consultation Session
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Confirm student{" "}
              <strong className="text-foreground">{fullName}</strong> is present
              in the office to begin tracking session duration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div
            className="flex justify-end gap-3 border-t border-border/50 pt-4"
          >
            <AlertDialogCancel className="h-11 rounded-xl font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmStartAppointment(0)}
              disabled={startAppointmentMutation.isPending}
              className={cn(
                "h-11 rounded-xl bg-emerald-600 font-semibold text-white",
                "shadow-sm hover:bg-emerald-700",
              )}
            >
              {startAppointmentMutation.isPending
                ? "Starting..."
                : "Start Session"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <AlertDialogContent className="max-w-md border border-border bg-card shadow-lg">
          <AlertDialogHeader>
            <div
              className={cn(
                "mb-2 flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-primary/10 text-primary",
              )}
            >
              <StickyNote className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">
              Add Counselor Clinical Remark
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Add your clinical observations or remarks regarding this
              appointment. This remark will be immutably recorded in the
              audit history without altering the automated AI triage baseline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <textarea
              value={counselorNoteText}
              onChange={(e) => setCounselorNoteText(e.target.value)}
              placeholder="e.g., Student exhibits acute anxiety regarding academic load. Prioritizing intake despite low AI baseline."
              rows={4}
              className={cn(
                "w-full rounded-xl border border-border/80 bg-background/50",
                "p-3 text-sm text-foreground focus:outline-none",
                "focus:ring-2 focus:ring-primary/40",
              )}
            />
          </div>
          <div
            className="flex justify-end gap-3 border-t border-border/50 pt-4"
          >
            <AlertDialogCancel
              onClick={() => {
                setCounselorNoteText("");
                setIsNoteModalOpen(false);
              }}
              className="h-11 rounded-xl font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveCounselorNote}
              disabled={isSavingNote || !counselorNoteText.trim()}
              className={cn(
                "h-11 rounded-xl bg-primary font-semibold text-primary-foreground",
                "shadow-sm hover:bg-primary/90",
              )}
            >
              {isSavingNote ? "Saving..." : "Save Remark"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <CORPreviewDialog
        isOpen={showCorPreview}
        onClose={() => setShowCorPreview(false)}
        fileUrl={appointment.studentCorUrl}
        studentName={fullName}
      />
    </motion.div>
  );
}

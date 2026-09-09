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
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import {
  format12HourTime,
  formatDate,
  formatProcessDuration,
} from "@/utils/dateTime";
import { usePageMetadata, useToast } from "@/context";
import { parseAuditTrail } from "@/utils/auditTrail";
import ActionConfirmModal from "@/features/appointments/components/ConfirmModal";
import RescheduleModal from "@/features/appointments/components/RescheduleModal";
import { CORPreviewDialog } from "@/components/shared/CORPreviewDialog";
import { InOfficeSessionTimer } from "@/components/shared/InOfficeSessionTimer";
import { StudentProfileBentoCard } from "@/components/shared/StudentProfileBentoCard";
import { cn } from "@/lib/utils";

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
        "border-destructive/30 bg-destructive/15 text-destructive " +
        "font-extrabold animate-pulse",
    };
  }

  if (normalized.includes("high") || normalized.includes("urgent")) {
    return {
      label: "High",
      description: "Prioritize this student concern.",
      className: STATUS_COLORS.danger,
    };
  }

  if (normalized.includes("low")) {
    return {
      label: "Low",
      description: "Standard appointment queue.",
      className: STATUS_COLORS.success,
    };
  }

  return {
    label: "Medium",
    description: "Standard guidance priority.",
    className: STATUS_COLORS.warning,
  };
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
          className="h-9 gap-1.5 rounded-xl border-border/70"
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
        {/* Left Column Skeleton */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="space-y-4 rounded-2xl border border-border/70 p-5">
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
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
            <Skeleton className="h-9 w-full rounded-xl" />
          </Card>

          <Card className="space-y-3 rounded-2xl border border-border/70 p-5">
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-9 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1 rounded-xl" />
              <Skeleton className="h-9 flex-1 rounded-xl" />
            </div>
          </Card>
        </div>

        {/* Right Column Skeleton */}
        <div className="space-y-6 lg:col-span-8">
          <Card className="space-y-5 rounded-2xl border border-border/70 p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-44 rounded" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          </Card>

          <Card className="space-y-4 rounded-2xl border border-border/70 p-6">
            <Skeleton className="h-5 w-32 rounded" />
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AppointmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  const urgencyInfo = getAppointmentUrgency(appointment);

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
                "flex items-center gap-1.5 rounded-lg border border-border/70",
                "bg-muted/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground",
                "transition-colors hover:border-primary/40 hover:text-foreground",
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
                  "rounded-full px-3 py-1 text-[11px] font-bold shadow-sm",
                  STATUS_COLORS[getStatusColorKey(appointment.status.name)],
                )}
              >
                {appointment.status.name}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold shadow-sm",
                urgencyInfo.className,
              )}
            >
              {urgencyInfo.label} Urgency
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full border-border/70 bg-muted/40 px-3 py-1 text-[11px]",
                "font-medium text-foreground/80",
              )}
            >
              <Clock3 className="mr-1 inline h-3 w-3 text-muted-foreground" />
              Turnaround:{" "}
              {formatProcessDuration(
                appointment.startedAt,
                appointment.completedAt,
              )}
            </Badge>
          </div>
        ) : null,
      }),
      [appointment, fullName, hasCopiedId, isLoading, urgencyInfo],
    ),
  );

  if (isError || (!appointment && !isLoading)) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <p className="font-medium text-destructive">
          {isError ? "Error loading appointment" : "Appointment not found"}
        </p>
        <Button
          onClick={() => navigate("/admin/appointments")}
          variant="outline"
          className="rounded-xl"
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
    const requiresMessage = ["Reject", "Cancel", "No-show"].includes(action);
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
    try {
      await updateAppointment({
        id: appointment.id!,
        data: {
          whenDate: newDate,
          timeSlot: { id: newTimeSlotId },
          status: { id: 6 },
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
    studentNumber: appointment.studentNumber || appointment.user?.studentNumber,
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
            <div className="rounded-xl border border-primary/30 bg-primary/20 p-2.5">
              <StickyNote className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Record Significant Note
              </h3>
              <p className="text-xs text-muted-foreground">
                This completed appointment requires a consultation note in the
                student's records.
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              navigate(
                `/admin/student-records/${appointment.iirId}?addNote=true&appointmentId=${appointment.id}`,
              )
            }
            className="h-10 rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
          >
            Add Note Now
          </Button>
        </div>
      )}

      {/* 2-Column Sidebar Master-Detail Layout (Jakob's Law) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Dossier & Controls (Col-span 4) */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="space-y-6 lg:col-span-4"
        >
          <StudentProfileBentoCard
            student={studentData}
            onViewCor={() => setShowCorPreview(true)}
            canAccessIir={true}
          />

          {/* Administrative Controls Card */}
          <Card
            className={cn(
              "overflow-hidden rounded-2xl border border-border/70 bg-card/70",
              "shadow-sm backdrop-blur-xl",
            )}
          >
            <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-3.5">
              <CardTitle
                className={cn(
                  "flex items-center gap-2 text-xs font-bold uppercase",
                  "tracking-wider text-muted-foreground",
                )}
              >
                <CalendarRange className="h-4 w-4 text-primary" />
                Administrative Controls
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              {/* In-Office Session Timer */}
              {isScheduled && !appointment.startedAt && (
                <InOfficeSessionTimer
                  startedAt={null}
                  completedAt={null}
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
                  isPending={startAppointmentMutation.isPending}
                />
              )}

              {isSessionActive && (
                <InOfficeSessionTimer
                  startedAt={appointment.startedAt}
                  completedAt={appointment.completedAt}
                  title="Counseling Session"
                  studentName={fullName}
                  studentNumber={appointment.studentNumber}
                  onStart={(offset) => handleConfirmStartAppointment(offset)}
                  onComplete={() => handleActionClick("Complete")}
                  isPending={startAppointmentMutation.isPending}
                />
              )}

              {/* Lifecycle Actions */}
              {isPending && (
                <div className="space-y-2.5">
                  <Button
                    onClick={() => handleActionClick("Approve")}
                    className={cn(
                      "h-10 w-full gap-2 rounded-xl bg-emerald-600 font-bold text-white",
                      "shadow-sm transition-all hover:bg-emerald-700",
                    )}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Selected Schedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleActionClick("Reject")}
                    className={cn(
                      "h-9 w-full gap-2 rounded-xl border-destructive/30 text-xs",
                      "font-semibold text-destructive hover:bg-destructive/10",
                    )}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Consultation Request
                  </Button>
                </div>
              )}

              {isScheduled && !isSessionActive && (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => handleActionClick("Reschedule")}
                    className="h-9 gap-2 rounded-xl border-border/80 text-xs font-semibold"
                  >
                    <CalendarRange className="h-3.5 w-3.5 text-primary" />
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleActionClick("No-show")}
                    className="h-9 gap-2 rounded-xl border-border/80 text-xs font-semibold"
                  >
                    <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                    Mark No-show
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleActionClick("Cancel")}
                    className={cn(
                      "col-span-2 h-9 gap-2 rounded-xl border-destructive/30 text-xs",
                      "font-semibold text-destructive hover:bg-destructive/10",
                    )}
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    Cancel Appointment
                  </Button>
                </div>
              )}

              {isCompleted && (
                <div className="rounded-xl border border-dashed border-border/70 py-6 text-center">
                  <CheckCircle className="mx-auto h-7 w-7 text-emerald-600/80" />
                  <p className="mt-2 text-xs font-bold text-foreground/80">
                    Consultation Completed
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    All session actions have concluded.
                  </p>
                </div>
              )}

              {!isPending && !isScheduled && !isCompleted && (
                <div className="rounded-xl border border-dashed border-border/70 py-6 text-center">
                  <ShieldAlert className="mx-auto h-7 w-7 text-muted-foreground/60" />
                  <p className="mt-2 text-xs font-bold text-muted-foreground">
                    Appointment is {appointment.status?.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Context & Audit History (Col-span 8) */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-6 lg:col-span-8"
        >
          {/* Consultation Request Context Card */}
          <Card
            className={cn(
              "overflow-hidden rounded-2xl border border-border/70 bg-card/70",
              "shadow-sm backdrop-blur-xl",
            )}
          >
            <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-3.5">
              <div className="flex items-center justify-between">
                <CardTitle
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold uppercase",
                    "tracking-wider text-muted-foreground",
                  )}
                >
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Consultation Request Context
                </CardTitle>
                <Badge
                  variant="secondary"
                  className="rounded-lg border border-primary/20 bg-primary/10 text-xs font-bold text-primary"
                >
                  {appointment.appointmentCategory.name}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
              {/* Reason description box */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reason for Consultation
                </p>
                <div className="rounded-xl border bg-muted/10 p-4">
                  <p className="text-sm font-medium italic leading-relaxed text-foreground/90">
                    "{appointment.reason || "No specific reason provided."}"
                  </p>
                </div>
              </div>

              {/* Schedule options / Selected schedule */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {isPending
                      ? "Select Schedule Option to Approve"
                      : "Confirmed Consultation Schedule"}
                  </p>
                  {isPending && (
                    <span className="text-[10px] italic text-muted-foreground">
                      Click a slot to set approval target
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {scheduleOptions.map((opt, idx) => {
                    const isSelected =
                      selectedSchedule?.date === opt.date &&
                      selectedSchedule?.timeSlotId === opt.slot.id;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!isPending}
                        onClick={() =>
                          setSelectedSchedule({
                            date: opt.date,
                            timeSlotId: opt.slot.id,
                            timeSlotTime: opt.slot.time,
                          })
                        }
                        className={cn(
                          "group relative flex flex-col justify-between rounded-xl",
                          "border p-3.5 text-left transition-all duration-200",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                            : "border-border/80 bg-muted/10 hover:border-primary/30 hover:bg-muted/20",
                          !isPending && "cursor-default hover:border-border/80",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            {opt.title}
                          </span>
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div className="mt-2 space-y-0.5">
                          <p className="text-sm font-bold text-foreground">
                            {formatDate(opt.date)}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {format12HourTime(opt.slot.time)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Trail & History Card */}
          <Card
            className={cn(
              "overflow-hidden rounded-2xl border border-border/70 bg-card/70",
              "shadow-sm backdrop-blur-xl",
            )}
          >
            <CardHeader className="border-b border-border/50 bg-muted/20 px-5 py-3.5">
              <CardTitle
                className={cn(
                  "flex items-center gap-2 text-xs font-bold uppercase",
                  "tracking-wider text-muted-foreground",
                )}
              >
                <Clock3 className="h-4 w-4 text-primary" />
                Audit Trail & History
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              {auditEntries.map((entry, idx) => (
                <div
                  key={idx}
                  className="group flex items-start gap-3.5"
                >
                  <div className="relative mt-1">
                    <div
                      className={cn(
                        "relative z-10 h-3 w-3 shrink-0 rounded-full border-2",
                        entry.status.toUpperCase().includes("RESCHEDULED")
                          ? "border-amber-500 bg-background shadow-sm"
                          : entry.status.toUpperCase().includes("APPROVED") ||
                              entry.status.toUpperCase().includes("COMPLETED")
                            ? "border-emerald-500 bg-background shadow-sm"
                            : entry.status.toUpperCase().includes("REJECTED") ||
                                entry.status.toUpperCase().includes("CANCELLED")
                              ? "border-destructive bg-background shadow-sm"
                              : "border-primary bg-background shadow-sm",
                      )}
                    />
                    <div className="absolute left-1/2 top-3 h-full w-0.5 -translate-x-1/2 bg-border/60 group-last:hidden" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-foreground">
                        {entry.status}
                      </p>
                      {entry.timestamp && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {entry.timestamp}
                        </span>
                      )}
                    </div>
                    {entry.remarks && (
                      <p className="rounded-lg border bg-muted/20 p-2.5 text-xs text-foreground/85">
                        {entry.remarks}
                      </p>
                    )}
                    {entry.details && (
                      <p className="text-[11px] font-medium text-amber-600">
                        {entry.details}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              <div className="group flex items-start gap-3.5">
                <div className="relative mt-1">
                  <div className="relative z-10 h-3 w-3 shrink-0 rounded-full border-2 border-primary bg-background shadow-sm" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">
                      Request Initialized
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatDate(appointment.createdAt || "")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Initial appointment submission received.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
        <AlertDialogContent className="max-w-md rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-2xl">
          <AlertDialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
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
          <div className="flex justify-end gap-3 border-t border-border/50 pt-4">
            <AlertDialogCancel className="rounded-xl font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmStartAppointment(0)}
              disabled={startAppointmentMutation.isPending}
              className="rounded-xl bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              {startAppointmentMutation.isPending
                ? "Starting..."
                : "Start Session"}
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

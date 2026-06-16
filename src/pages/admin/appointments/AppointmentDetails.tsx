import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useAppointment,
  useStatuses,
  useUpdateAppointment,
} from "@/features/appointments/hooks";
import {
  User,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock3,
  CalendarRange,
  ShieldUser,
  ArrowLeft,
  Building2,
  Fingerprint,
  MessageSquare,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { format12HourTime, formatDate } from "@/utils/dateTime";
import { usePageMetadata } from "@/context";
import { parseAuditTrail } from "@/utils/auditTrail";
import ActionConfirmModal from "@/features/appointments/components/ConfirmModal";
import RescheduleModal from "@/features/appointments/components/RescheduleModal";
import { CORPreviewDialog } from "@/components/shared/CORPreviewDialog";
import { cn } from "@/lib/utils";

function getAppointmentUrgency(appointment?: any) {
  const raw = appointment?.urgencyLevel ?? appointment?.urgency;

  if (!raw) {
    return {
      label: "Medium",
      description: "Default priority when no urgency level is provided.",
      className:
        "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  const label =
    typeof raw === "string" ? raw : raw.name || raw.label || "Medium";
  const normalized = String(label).toLowerCase();

  if (normalized.includes("high") || normalized.includes("urgent")) {
    return {
      label: "High",
      description:
        "Prioritize this student concern during review and scheduling.",
      className:
        "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
    };
  }

  if (normalized.includes("low")) {
    return {
      label: "Low",
      description: "Can be handled through the regular appointment queue.",
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  return {
    label: "Medium",
    description: "Standard guidance priority for regular processing.",
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  };
}

export default function AppointmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: appointment, isLoading, isError } = useAppointment(id || "");
  const { data: appointmentStatuses } = useStatuses();
  const { mutateAsync: updateAppointment } = useUpdateAppointment();

  const auditEntries = useMemo(() => {
    return parseAuditTrail(appointment?.adminNotes);
  }, [appointment?.adminNotes]);

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

  const [pendingAction, setPendingAction] = useState<{
    type: string;
    requiresMessage: boolean;
  } | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCorPreview, setShowCorPreview] = useState(false);

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

  const initials = appointment?.user
    ? `${appointment.user.firstName[0]}${appointment.user.lastName[0]}`
    : "??";

  usePageMetadata(
    useMemo(
      () => ({
        title: "Appointment Details",
        description: `Managing session for ${fullName || "Student"}`,
        badgeText: "Admin Management",
        badgeIcon: <Calendar className="h-4 w-4" />,
        isLoading: isLoading && !appointment,
        headerActions: null,
      }),
      [appointment],
    ),
  );

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <p className="font-medium text-destructive">
          Error loading appointment
        </p>
        <Button
          onClick={() => navigate("/admin/appointments")}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>
    );
  }

  if (!appointment && !isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Appointment not found</p>
        <Button
          onClick={() => navigate("/admin/appointments")}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>
    );
  }

  if (!appointment) return null;

  const urgencyInfo = getAppointmentUrgency(appointment);

  const getAllowedActions = (statusName: string): string[] => {
    switch (statusName) {
      case "Pending":
        return ["Approve", "Reject"];
      case "Scheduled":
        return ["Reschedule", "Cancel", "Complete", "No-show"];
      case "Rescheduled":
        return ["Reschedule", "Cancel", "Complete", "No-show"];
      default:
        return [];
    }
  };

  const allowedActions = getAllowedActions(appointment.status?.name || "");

  const actionColor = (action: string): string => {
    switch (action) {
      case "Approve":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "Reject":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "Cancel":
        return "bg-orange-600 hover:bg-orange-700 text-white";
      case "Complete":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case "No-show":
        return "bg-gray-600 hover:bg-gray-700 text-white";
      case "Reschedule":
        return "bg-purple-600 hover:bg-purple-700 text-white";
      default:
        return "bg-primary hover:bg-primary/90 text-primary-foreground";
    }
  };

  const actionIcon = (action: string) => {
    switch (action) {
      case "Approve":
        return <CheckCircle className="h-4 w-4" />;
      case "Reject":
        return <XCircle className="h-4 w-4" />;
      case "Cancel":
        return <AlertCircle className="h-4 w-4" />;
      case "Complete":
        return <CheckCircle className="h-4 w-4" />;
      case "No-show":
        return <Clock3 className="h-4 w-4" />;
      case "Reschedule":
        return <CalendarRange className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleActionClick = (action: string) => {
    if (action === "Reschedule") {
      setShowReschedule(true);
      return;
    }
    const requiresMessage = ["Reject", "Cancel", "No-show"].includes(action);
    setPendingAction({ type: action, requiresMessage });
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

  const handleConfirmAction = async (message?: string): Promise<boolean> => {
    if (!pendingAction) return false;
    const statusId = getStatusIdByAction(pendingAction.type);
    if (!statusId) return false;

    const payload: any = { status: { id: statusId } };

    payload.adminNotes = message || "";

    if (pendingAction.type === "Approve" && selectedSchedule) {
      payload.whenDate = selectedSchedule.date;
      payload.timeSlot = { id: selectedSchedule.timeSlotId };
    }

    try {
      await updateAppointment({ id: appointment.id!, data: payload });
      setPendingAction(null);
      return true;
    } catch {
      return false;
    }
  };

  const isCompleted = appointment.status?.name === "Completed";
  const needsSignificantNote = isCompleted && !appointment.hasSignificantNote;

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
          status: { id: 6 }, // Rescheduled status ID
          adminNotes: reason,
        } as any,
      });
      setShowReschedule(false);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <>
      <div
        className={cn(
          "mx-auto flex w-full flex-col space-y-8 pb-12",
          "px-4 sm:px-6 md:px-8",
        )}
      >
        {needsSignificantNote && (
          <div
            className={cn(
              "animate-fade-in-up flex flex-col items-center",
              "justify-between gap-4 rounded-xl border border-primary/20",
              "bg-primary/10 p-6 shadow-md backdrop-blur-xl",
              "sm:flex-row",
            )}
            style={{ animationDelay: "0.05s", animationFillMode: "both" }}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-primary/30 bg-primary/20 p-3">
                <StickyNote className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-foreground">
                  Record Significant Note
                </h3>
                <p className="text-xs font-medium text-muted-foreground">
                  This completed appointment requires a significant note for the
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
              className={cn(
                "h-11 rounded-xl bg-primary px-6 font-bold text-white",
                "shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5",
                "hover:bg-primary/90 hover:shadow-xl",
              )}
            >
              Add Note Now
            </Button>
          </div>
        )}

        {/* Top Row: Identity & Information (Wave 1) */}
        <div
          className="animate-fade-in-up grid grid-cols-1 gap-6 lg:grid-cols-3"
          style={{ animationDelay: "0.10s", animationFillMode: "both" }}
        >
          {/* Identity Card */}
          <Card
            className={cn(
              "group relative overflow-hidden",
              "border-border bg-glass-bg shadow-md lg:col-span-1",
            )}
          >
            <CardContent
              className={cn(
                "relative z-10 flex flex-col items-center",
                "space-y-4 p-6 text-center",
              )}
            >
              <Avatar
                className={cn(
                  "relative z-10 h-20 w-20 border-2",
                  "border-border shadow-md",
                )}
              >
                <AvatarImage
                  src={appointment.user?.profilePicture}
                  className="object-cover"
                />
                <AvatarFallback className="bg-muted/50 text-2xl font-bold uppercase text-foreground/80">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h2 className="text-lg font-bold leading-tight tracking-tight text-foreground/90">
                  {fullName}
                </h2>
                <p className="text-xs font-medium italic text-muted-foreground">
                  {appointment.user?.email}
                </p>
              </div>

              <div className="grid w-full grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "group/btn w-full gap-2 rounded-xl border-primary/20",
                    "bg-primary/5 font-bold text-primary transition-all",
                    "duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-white",
                  )}
                  onClick={() =>
                    navigate(`/admin/student-records/${appointment.iirId}`)
                  }
                >
                  <User className="h-3.5 w-3.5" />
                  Access Record
                </Button>
                {appointment.studentCorUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "group/btn w-full gap-2 rounded-xl border-primary/20",
                      "bg-primary/5 font-bold text-primary transition-all",
                      "duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-white",
                    )}
                    onClick={() => setShowCorPreview(true)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View COR
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* General Information Card */}
          <Card className="border-border bg-glass-bg shadow-md lg:col-span-2">
            <CardHeader
              className={cn(
                "flex flex-row items-center justify-between",
                "border-b bg-muted/5 p-5 sm:p-6",
              )}
            >
              <CardTitle
                className={cn(
                  "flex items-center gap-2.5 text-lg font-bold",
                  "tracking-tight",
                )}
              >
                <ShieldUser className="h-5 w-5 text-primary" />
                Personal Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <div className="group space-y-2 transition-all duration-300">
                  <p
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      "text-muted-foreground/60 transition-colors",
                      "group-hover:text-primary",
                    )}
                  >
                    Student Number
                  </p>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-xl",
                      "border bg-muted/15 p-3 shadow-inner transition-all",
                      "group-hover:border-primary/20",
                    )}
                  >
                    <Fingerprint className="h-4 w-4 text-primary/60" />
                    <p className="text-base font-bold text-foreground/80">
                      {appointment?.studentNumber || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="group space-y-2 transition-all duration-300">
                  <p
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      "text-muted-foreground/60 transition-colors",
                      "group-hover:text-primary",
                    )}
                  >
                    Student email
                  </p>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-xl",
                      "border bg-muted/15 p-3 shadow-inner transition-all",
                      "group-hover:border-primary/20",
                    )}
                  >
                    <Building2 className="h-4 w-4 text-primary/60" />
                    <p className="truncate text-base font-bold text-foreground/80">
                      {appointment.user?.email || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="group space-y-2 transition-all duration-300">
                  <p
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      "text-muted-foreground/60 transition-colors",
                      "group-hover:text-primary",
                    )}
                  >
                    Urgency Level
                  </p>
                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-3",
                      "shadow-inner transition-all group-hover:border-primary/20",
                      urgencyInfo.className,
                    )}
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base font-bold">{urgencyInfo.label}</p>
                      <p className="mt-0.5 text-[11px] font-medium leading-4 opacity-80">
                        {urgencyInfo.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Row: Session Details & Actions (Wave 2) */}
        <div
          className="animate-fade-in-up grid grid-cols-1 gap-6 pb-12 lg:grid-cols-12"
          style={{ animationDelay: "0.15s", animationFillMode: "both" }}
        >
          {/* Left: Session Details (Col-span 8) */}
          <div className="space-y-6 lg:col-span-8">
            <Card className="h-full overflow-hidden border-border bg-glass-bg shadow-md">
              <CardHeader
                className={cn(
                  "flex flex-row items-center justify-between",
                  "border-b bg-muted/5 p-5 sm:p-6",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-2.5">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold tracking-tight">
                      Session Context
                    </CardTitle>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      ID: {appointment.id?.substring(0, 8)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {appointment?.status && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full border px-3 py-1 text-[10px] font-bold",
                        "shadow-sm",
                        STATUS_COLORS[
                          getStatusColorKey(appointment.status.name)
                        ],
                      )}
                    >
                      {appointment.status.name}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "rounded-full border border-primary/20 bg-primary/10 px-3",
                      "py-1 text-[10px] font-bold text-primary",
                    )}
                  >
                    {appointment.appointmentCategory.name}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full border px-3 py-1 text-[10px] font-bold",
                      "shadow-sm",
                      urgencyInfo.className,
                    )}
                  >
                    Urgency: {urgencyInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-5 sm:p-6">
                {/* Reason for Appointment Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg border border-primary/20 bg-primary/10 p-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                      Reason for Appointment
                    </h3>
                  </div>

                  <div
                    className={cn(
                      "rounded-xl border bg-muted/15 p-5 shadow-inner",
                    )}
                  >
                    <p className="text-sm font-medium italic leading-relaxed text-foreground/80">
                      "{appointment.reason || "No specific reason provided."}"
                    </p>
                  </div>
                </div>

                {/* Schedule Options */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "rounded-lg border border-primary/20",
                        "bg-primary/10 p-1.5",
                      )}
                    >
                      <CalendarRange className="h-4 w-4 text-primary" />
                    </div>
                    <h3
                      className={cn(
                        "text-xs font-bold uppercase",
                        "tracking-wider text-foreground/70",
                      )}
                    >
                      {appointment.status?.name === "Pending"
                        ? "Select Schedule Option to Approve"
                        : "Scheduled Date & Time"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Primary Option */}
                    <button
                      type="button"
                      disabled={appointment.status?.name !== "Pending"}
                      onClick={() =>
                        setSelectedSchedule({
                          date: appointment.whenDate,
                          timeSlotId: appointment.timeSlot.id,
                          timeSlotTime: appointment.timeSlot.time,
                        })
                      }
                      className={cn(
                        "group relative rounded-xl border p-4 text-left",
                        "transition-all",
                        selectedSchedule?.date === appointment.whenDate &&
                          selectedSchedule?.timeSlotId ===
                            appointment.timeSlot.id
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary hover:-translate-y-0.5"
                          : cn(
                              "border-border bg-muted/5",
                              "hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted/10",
                            ),
                        appointment.status?.name !== "Pending" &&
                          cn(
                            "cursor-default opacity-90",
                            "hover:translate-y-0 hover:border-border hover:bg-muted/5",
                          ),
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            "tracking-wider text-primary/80",
                          )}
                        >
                          Primary Schedule
                        </span>
                        {selectedSchedule?.date === appointment.whenDate &&
                          selectedSchedule?.timeSlotId ===
                            appointment.timeSlot.id && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                      </div>
                      <p className="mt-2 text-sm font-bold text-foreground">
                        {formatDate(appointment.whenDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format12HourTime(appointment.timeSlot.time)}
                      </p>
                    </button>

                    {/* Backup 1 */}
                    {appointment.preferredDate1 &&
                      appointment.preferredTimeSlot1 && (
                        <button
                          type="button"
                          disabled={appointment.status?.name !== "Pending"}
                          onClick={() =>
                            setSelectedSchedule({
                              date: appointment.preferredDate1!,
                              timeSlotId: appointment.preferredTimeSlot1!.id,
                              timeSlotTime:
                                appointment.preferredTimeSlot1!.time,
                            })
                          }
                          className={cn(
                            "group relative rounded-xl border p-4 text-left",
                            "transition-all",
                            selectedSchedule?.date ===
                              appointment.preferredDate1 &&
                              selectedSchedule?.timeSlotId ===
                                appointment.preferredTimeSlot1?.id
                              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary hover:-translate-y-0.5"
                              : cn(
                                  "border-border bg-muted/5",
                                  "hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted/10",
                                ),
                            appointment.status?.name !== "Pending" &&
                              cn(
                                "cursor-default opacity-90",
                                "hover:translate-y-0 hover:border-border hover:bg-muted/5",
                              ),
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase",
                                "tracking-wider text-muted-foreground/70",
                              )}
                            >
                              Backup Option 1
                            </span>
                            {selectedSchedule?.date ===
                              appointment.preferredDate1 &&
                              selectedSchedule?.timeSlotId ===
                                appointment.preferredTimeSlot1?.id && (
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full bg-primary",
                                  )}
                                />
                              )}
                          </div>
                          <p className="mt-2 text-sm font-bold text-foreground">
                            {formatDate(appointment.preferredDate1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format12HourTime(
                              appointment.preferredTimeSlot1.time,
                            )}
                          </p>
                        </button>
                      )}

                    {/* Backup 2 */}
                    {appointment.preferredDate2 &&
                      appointment.preferredTimeSlot2 && (
                        <button
                          type="button"
                          disabled={appointment.status?.name !== "Pending"}
                          onClick={() =>
                            setSelectedSchedule({
                              date: appointment.preferredDate2!,
                              timeSlotId: appointment.preferredTimeSlot2!.id,
                              timeSlotTime:
                                appointment.preferredTimeSlot2!.time,
                            })
                          }
                          className={cn(
                            "group relative rounded-xl border p-4 text-left",
                            "transition-all",
                            selectedSchedule?.date ===
                              appointment.preferredDate2 &&
                              selectedSchedule?.timeSlotId ===
                                appointment.preferredTimeSlot2?.id
                              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary hover:-translate-y-0.5"
                              : cn(
                                  "border-border bg-muted/5",
                                  "hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted/10",
                                ),
                            appointment.status?.name !== "Pending" &&
                              cn(
                                "cursor-default opacity-90",
                                "hover:translate-y-0 hover:border-border hover:bg-muted/5",
                              ),
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase",
                                "tracking-wider text-muted-foreground/70",
                              )}
                            >
                              Backup Option 2
                            </span>
                            {selectedSchedule?.date ===
                              appointment.preferredDate2 &&
                              selectedSchedule?.timeSlotId ===
                                appointment.preferredTimeSlot2?.id && (
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full bg-primary",
                                  )}
                                />
                              )}
                          </div>
                          <p className="mt-2 text-sm font-bold text-foreground">
                            {formatDate(appointment.preferredDate2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format12HourTime(
                              appointment.preferredTimeSlot2.time,
                            )}
                          </p>
                        </button>
                      )}

                    {/* Backup 3 */}
                    {appointment.preferredDate3 &&
                      appointment.preferredTimeSlot3 && (
                        <button
                          type="button"
                          disabled={appointment.status?.name !== "Pending"}
                          onClick={() =>
                            setSelectedSchedule({
                              date: appointment.preferredDate3!,
                              timeSlotId: appointment.preferredTimeSlot3!.id,
                              timeSlotTime:
                                appointment.preferredTimeSlot3!.time,
                            })
                          }
                          className={cn(
                            "group relative rounded-xl border p-4 text-left",
                            "transition-all",
                            selectedSchedule?.date ===
                              appointment.preferredDate3 &&
                              selectedSchedule?.timeSlotId ===
                                appointment.preferredTimeSlot3?.id
                              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary hover:-translate-y-0.5"
                              : cn(
                                  "border-border bg-muted/5",
                                  "hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted/10",
                                ),
                            appointment.status?.name !== "Pending" &&
                              cn(
                                "cursor-default opacity-90",
                                "hover:translate-y-0 hover:border-border hover:bg-muted/5",
                              ),
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase",
                                "tracking-wider text-muted-foreground/70",
                              )}
                            >
                              Backup Option 3
                            </span>
                            {selectedSchedule?.date ===
                              appointment.preferredDate3 &&
                              selectedSchedule?.timeSlotId ===
                                appointment.preferredTimeSlot3?.id && (
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full bg-primary",
                                  )}
                                />
                              )}
                          </div>
                          <p className="mt-2 text-sm font-bold text-foreground">
                            {formatDate(appointment.preferredDate3)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format12HourTime(
                              appointment.preferredTimeSlot3.time,
                            )}
                          </p>
                        </button>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Actions & Timeline (Col-span 4) */}
          <div className="space-y-6 lg:col-span-4">
            <Card className="overflow-hidden border-border bg-glass-bg shadow-md">
              <CardHeader className="border-b bg-muted/5 p-5">
                <CardTitle className="flex items-center gap-2.5 text-base font-bold tracking-tight">
                  <ShieldUser className="h-4 w-4 text-primary" />
                  Administrative Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {allowedActions.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {allowedActions.map((action) => (
                      <Button
                        key={action}
                        onClick={() => handleActionClick(action)}
                        className={cn(
                          actionColor(action),
                          "group/action h-11 w-full items-center justify-between",
                          "rounded-xl border border-white/10 px-4 shadow-sm",
                          "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {actionIcon(action)}
                          <span className="text-xs font-bold">{action}</span>
                        </div>
                        <ArrowLeft
                          className={cn(
                            "h-3.5 w-3.5 -translate-x-1.5 rotate-180 opacity-0",
                            "transition-all duration-300",
                            "group-hover/action:translate-x-0 group-hover/action:opacity-100",
                          )}
                        />
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "space-y-3 rounded-xl border border-dashed py-8 text-center",
                    )}
                  >
                    <div className="mx-auto w-fit rounded-full border border-primary/20 bg-primary/10 p-3">
                      <CheckCircle className="h-6 w-6 text-primary/60" />
                    </div>
                    <p className="text-xs font-bold italic text-muted-foreground/60">
                      All set! No pending tasks.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border bg-glass-bg shadow-md">
              <CardHeader className="border-b bg-muted/5 p-5">
                <CardTitle
                  className={cn(
                    "flex items-center gap-2 text-[10px] font-bold",
                    "uppercase tracking-wider text-muted-foreground",
                  )}
                >
                  <Clock3 className="h-3.5 w-3.5" />
                  Audit Trail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-5">
                {auditEntries.map((entry, idx) => (
                  <div
                    key={idx}
                    className="group flex items-start gap-4"
                  >
                    <div className="relative mt-1">
                      <div
                        className={cn(
                          "relative z-10 h-3.5 w-3.5 shrink-0",
                          "rounded-full border-2",
                          entry.status.toUpperCase().includes("RESCHEDULED")
                            ? "border-amber-500 bg-background shadow-sm"
                            : entry.status.toUpperCase().includes("APPROVED") ||
                                entry.status.toUpperCase().includes("COMPLETED")
                              ? "border-emerald-500 bg-background shadow-sm"
                              : entry.status
                                    .toUpperCase()
                                    .includes("REJECTED") ||
                                  entry.status
                                    .toUpperCase()
                                    .includes("CANCELLED")
                                ? "border-red-500 bg-background shadow-sm"
                                : "border-primary bg-background shadow-sm",
                        )}
                      />
                      <div
                        className={cn(
                          "absolute left-1/2 top-3.5 h-full w-0.5 bg-border",
                          "-translate-x-1/2 group-last:hidden",
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-foreground/80">
                        {entry.status}
                      </p>
                      {entry.timestamp && (
                        <p className="text-[10px] text-muted-foreground">
                          {entry.timestamp}
                        </p>
                      )}
                      {entry.remarks && (
                        <p
                          className={cn(
                            "text-xs text-muted-foreground",
                            "whitespace-pre-wrap",
                          )}
                        >
                          {entry.remarks}
                        </p>
                      )}
                      {entry.details && (
                        <p
                          className={cn(
                            "text-[11px] font-medium",
                            "text-amber-600 dark:text-amber-400",
                          )}
                        >
                          {entry.details}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="group flex items-start gap-4">
                  <div className="relative mt-1">
                    <div
                      className={cn(
                        "relative z-10 h-3.5 w-3.5 shrink-0",
                        "rounded-full border-2 border-primary",
                        "bg-background shadow-sm",
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground/80">
                      Request Initialized
                    </p>
                    <p
                      className={cn(
                        "w-fit rounded-full border bg-muted/30",
                        "px-2 py-0.5 text-[9px] font-bold",
                        "text-muted-foreground/60",
                      )}
                    >
                      {formatDate(appointment.createdAt || "")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <ActionConfirmModal
          isOpen={!!pendingAction}
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

        {/* COR Preview Modal */}
        <CORPreviewDialog
          isOpen={showCorPreview}
          onClose={() => setShowCorPreview(false)}
          fileUrl={appointment.studentCorUrl}
          studentName={fullName}
        />
      </div>
    </>
  );
}

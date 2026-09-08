import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useAppointment,
  useCancelAppointment,
} from "@/features/appointments/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  FileCheck,
  Info,
  MapPin,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { usePageMetadata } from "@/context";
import { AnimationStyles } from "@/components/ui/animations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/context";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { parseAuditTrail } from "@/utils/auditTrail";
import { format12HourTime } from "@/utils/dateTime";

const APPOINTMENT_PILL_CLASS =
  "inline-flex h-7 items-center rounded-full border px-3 text-[11px] " +
  "font-semibold leading-none";

function getAppointmentUrgency(appointment?: any) {
  const raw = appointment?.urgencyLevel ?? appointment?.urgency;

  if (!raw) {
    return {
      label: "Medium",
      description: "Default priority when no urgency level is provided.",
      className: STATUS_COLORS.warning,
    };
  }

  const label =
    typeof raw === "string" ? raw : raw.name || raw.label || "Medium";
  const normalized = String(label).toLowerCase();

  if (normalized.includes("critical")) {
    return {
      label: "Critical",
      description:
        "This appointment has a critical priority and " +
        "requires immediate attention.",
      className:
        "border-destructive/30 bg-destructive/15 text-destructive " +
        "font-extrabold animate-pulse",
    };
  }

  if (normalized.includes("high") || normalized.includes("urgent")) {
    return {
      label: "High",
      description:
        "This appointment should be prioritized by the Guidance Office.",
      className: "border-destructive/20 bg-destructive/10 text-destructive",
    };
  }

  if (normalized.includes("low")) {
    return {
      label: "Low",
      description:
        "This appointment can be handled through the regular queue.",
      className: STATUS_COLORS.success,
    };
  }

  return {
    label: "Medium",
    description: "This appointment has a standard guidance priority.",
    className: STATUS_COLORS.warning,
  };
}

export default function AppointmentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { triggerToast } = useToast();

  const { data: appointment, isLoading, isError } = useAppointment(id || "");
  const { mutate: cancelAppointment, isPending: isCancelling } =
    useCancelAppointment();

  const auditEntries = useMemo(() => {
    return parseAuditTrail(appointment?.adminNotes);
  }, [appointment?.adminNotes]);

  const getStatusColor = (statusName?: string) => {
    const key = getStatusColorKey(statusName);
    return STATUS_COLORS[key] || "bg-muted text-muted-foreground";
  };

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const pageHeaderActions = useMemo(
    () => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/student/appointments")}
        className={cn(
          "h-9 gap-1.5 rounded-xl border-border/80 text-xs font-semibold",
        )}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Appointments
      </Button>
    ),
    [navigate],
  );

  usePageMetadata(
    useMemo(
      () => ({
        title: "Appointment Details",
        description: "View and manage your scheduled counseling appointment.",
        badgeText: appointment?.status?.name || "Loading",
        badgeIcon:
          appointment?.status?.name === "Approved" ? (
            <FileCheck className="h-4 w-4" />
          ) : (
            <Calendar className="h-4 w-4" />
          ),
        headerActions: pageHeaderActions,
        isLoading: isLoading,
      }),
      [appointment?.status?.name, pageHeaderActions, isLoading],
    ),
  );

  const handleCancel = () => {
    if (!id || !cancelReason.trim()) return;

    cancelAppointment(
      { id, reason: cancelReason },
      {
        onSuccess: () => {
          triggerToast("Appointment cancelled successfully");
          setIsCancelModalOpen(false);
          navigate("/student/appointments");
        },
        onError: () => {
          triggerToast("Failed to cancel appointment");
        },
      },
    );
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Appointment not found</h2>
        <Button
          variant="link"
          onClick={() => navigate("/student/appointments")}
        >
          Back to list
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="rounded-2xl border border-border/70 bg-card p-6">
              <Skeleton className="h-20 w-full rounded-xl" />
              <div className="mt-6 grid grid-cols-2 gap-4">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            </Card>
          </div>
          <div>
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const isCancellable =
    appointment?.status?.name === "Pending" ||
    appointment?.status?.name === "Scheduled";
  const urgencyInfo = getAppointmentUrgency(appointment);

  const whenDate = appointment?.whenDate
    ? new Date(appointment.whenDate)
    : null;
  const monthStr = whenDate
    ? whenDate.toLocaleDateString("en-US", { month: "short" })
    : "—";
  const dayStr = whenDate
    ? whenDate.toLocaleDateString("en-US", { day: "numeric" })
    : "—";

  return (
    <>
      <AnimationStyles />
      <div className="mx-auto flex w-full max-w-7xl flex-col space-y-6 pb-12">
        {/* Event Pass Hero Header */}
        <div
          className={cn(
            "flex flex-col justify-between gap-4 rounded-2xl border",
            "border-border/80 bg-card p-5 shadow-sm sm:flex-row",
            "sm:items-center",
          )}
        >
          <div className="flex items-center gap-4">
            {/* Calendar Block */}
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 flex-col items-center",
                "justify-center rounded-2xl border border-primary/25",
                "bg-primary/5 text-primary shadow-sm",
              )}
            >
              <span className="text-xs font-bold uppercase tracking-wider">
                {monthStr}
              </span>
              <span className="text-2xl font-black leading-none">
                {dayStr}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-border/80 bg-muted/40 text-xs font-semibold",
                  )}
                >
                  {appointment?.appointmentCategory?.name || "General"}
                </Badge>

                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-0.5 text-[10px] font-bold uppercase",
                    "tracking-wider",
                    getStatusColor(appointment?.status?.name),
                  )}
                >
                  {appointment?.status?.name || "Unknown"}
                </Badge>

                <Badge
                  variant="outline"
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-semibold",
                    urgencyInfo.className,
                  )}
                >
                  {urgencyInfo.label} Urgency
                </Badge>
              </div>

              <h2
                className={cn(
                  "text-lg font-bold tracking-tight text-foreground",
                  "sm:text-xl",
                )}
              >
                {whenDate
                  ? format(whenDate, "EEEE, MMMM d, yyyy")
                  : "Date TBD"}
                <span className="font-normal text-muted-foreground"> at </span>
                <span className="font-mono text-primary">
                  {format12HourTime(
                    appointment?.timeSlot?.time || "",
                  ) || "TBD"}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:self-center">
            {isCancellable && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsCancelModalOpen(true)}
                disabled={isCancelling}
                className="h-9 rounded-xl font-semibold shadow-sm"
              >
                Cancel Appointment
              </Button>
            )}
          </div>
        </div>

        {/* 2-Column Balanced Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content (2 Cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Consultation Overview */}
            <Card
              className={cn(
                "rounded-2xl border border-border/80 bg-card shadow-sm",
              )}
            >
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle
                  className={cn(
                    "text-sm font-bold uppercase tracking-wider",
                    "text-muted-foreground",
                  )}
                >
                  Session Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-xl border",
                      "border-border/60 bg-muted/20 p-3.5",
                    )}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p
                        className={cn(
                          "text-[11px] font-semibold text-muted-foreground",
                        )}
                      >
                        Location / Venue
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs font-semibold text-foreground",
                        )}
                      >
                        Guidance Office (Academic Bldg)
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-xl border",
                      "border-border/60 bg-muted/20 p-3.5",
                    )}
                  >
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p
                        className={cn(
                          "text-[11px] font-semibold text-muted-foreground",
                        )}
                      >
                        Designated Slot
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 font-mono text-xs font-semibold",
                          "text-foreground",
                        )}
                      >
                        {format12HourTime(appointment?.timeSlot?.time || "")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      "text-muted-foreground",
                    )}
                  >
                    My Concern / Reason
                  </p>
                  <div
                    className={cn(
                      "rounded-xl border border-border/70 bg-muted/30 p-4",
                    )}
                  >
                    <p
                      className={cn(
                        "whitespace-pre-wrap text-sm leading-relaxed",
                        "text-foreground/90",
                      )}
                    >
                      "{appointment?.reason}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Audit Trail / Remarks */}
            {auditEntries.length > 0 && (
              <Card
                className={cn(
                  "rounded-2xl border border-border/80 bg-card shadow-sm",
                )}
              >
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold uppercase",
                      "tracking-wider text-muted-foreground",
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Counselor Remarks & Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-5">
                  {auditEntries.map((entry, idx) => (
                    <div key={idx} className="group flex items-start gap-4">
                      <div className="relative mt-1">
                        <div
                          className={cn(
                            "relative z-10 h-3.5 w-3.5 shrink-0 rounded-full",
                            "border-2",
                            entry.status.toUpperCase().includes("PENDING")
                              ? "border-amber-500 bg-background"
                              : entry.status
                                    .toUpperCase()
                                    .includes("APPROVED") ||
                                  entry.status
                                    .toUpperCase()
                                    .includes("COMPLETED") ||
                                  entry.status
                                    .toUpperCase()
                                    .includes("SCHEDULED")
                                ? "border-emerald-500 bg-background"
                                : entry.status
                                      .toUpperCase()
                                      .includes("REJECTED") ||
                                    entry.status
                                      .toUpperCase()
                                      .includes("CANCELLED")
                                  ? "border-red-500 bg-background"
                                  : "border-primary bg-background",
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
                        <p className="text-xs font-bold text-foreground">
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
                              "whitespace-pre-wrap text-xs leading-relaxed",
                              "text-muted-foreground",
                            )}
                          >
                            {entry.remarks}
                          </p>
                        )}
                        {entry.details && (
                          <p
                            className={cn(
                              "text-[10px] italic text-muted-foreground",
                            )}
                          >
                            {entry.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (1 Col) */}
          <div className="space-y-6">
            {/* Student Guidelines Card */}
            <Card
              className={cn(
                "rounded-2xl border border-border/80 bg-card shadow-sm",
              )}
            >
              <CardHeader className="border-b border-border/60 pb-3">
                <CardTitle
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold uppercase",
                    "tracking-wider text-muted-foreground",
                  )}
                >
                  <Info className="h-3.5 w-3.5" />
                  Appointment Reminders
                </CardTitle>
              </CardHeader>
              <CardContent
                className={cn(
                  "space-y-3 pt-4 text-xs leading-relaxed",
                  "text-muted-foreground",
                )}
              >
                <p>
                  • Please arrive at the Guidance Office at least 10 minutes
                  before your scheduled time.
                </p>
                <p>
                  • Bring your School ID and valid Certificate of Registration
                  (COR) for identification.
                </p>
                <p>
                  • If you cannot attend, please cancel your schedule early so
                  other students in need can take the slot.
                </p>
              </CardContent>
            </Card>

            {/* Reference Metadata Card */}
            <Card
              className={cn(
                "rounded-2xl border border-border/80 bg-card p-4 shadow-sm",
              )}
            >
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-2 py-0.5 text-[10px] font-bold uppercase",
                      "tracking-wider",
                      getStatusColor(appointment?.status?.name),
                    )}
                  >
                    {appointment?.status?.name || "Unknown"}
                  </Badge>
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between border-t",
                    "border-border/50 pt-2",
                  )}
                >
                  <span className="text-muted-foreground">Requested On</span>
                  <span className="font-medium text-foreground">
                    {appointment?.createdAt
                      ? format(new Date(appointment.createdAt), "MMM d, yyyy")
                      : "—"}
                  </span>
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between border-t",
                    "border-border/50 pt-2",
                  )}
                >
                  <span className="text-muted-foreground">Reference ID</span>
                  <span
                    className={cn(
                      "font-mono text-[11px] font-bold text-foreground",
                    )}
                  >
                    #{appointment?.id}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling your appointment. This
              helps our counselors understand your situation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Cancellation</Label>
              <Textarea
                id="reason"
                placeholder={
                  "e.g., Class conflict, feeling better, urgent " +
                  "schedule change..."
                }
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-[10px] italic text-muted-foreground">
                * This reason will be recorded in your guidance audit trail.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
            >
              Go Back
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={!cancelReason.trim() || isCancelling}
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


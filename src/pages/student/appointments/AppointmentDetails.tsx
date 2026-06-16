import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useAppointment,
  useCancelAppointment,
} from "@/features/appointments/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  FileCheck,
  AlertCircle,
  MessageSquare,
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
import { useToast } from "@/context";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { parseAuditTrail } from "@/utils/auditTrail";

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
        "This appointment should be prioritized by the Guidance Office.",
      className:
        "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
    };
  }

  if (normalized.includes("low")) {
    return {
      label: "Low",
      description: "This appointment can be handled through the regular queue.",
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    };
  }

  return {
    label: "Medium",
    description: "This appointment has a standard guidance priority.",
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
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
        isLoading: isLoading,
      }),
      [appointment?.status?.name, isLoading],
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
        onError: (error: any) => {
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
      <div className="animate-pulse space-y-6 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left Column Skeleton */}
          <div className="space-y-6 md:col-span-2">
            <Card className="border-0 bg-card/60 shadow-lg">
              <CardHeader className="border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg bg-slate-200/50",
                        "dark:bg-slate-700/50",
                      )}
                    />
                    <div
                      className={cn(
                        "h-6 w-48 rounded bg-slate-200/50",
                        "dark:bg-slate-700/50",
                      )}
                    />
                  </div>
                  <div
                    className={cn(
                      "h-6 w-20 rounded-full bg-slate-200/50",
                      "dark:bg-slate-700/50",
                    )}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="space-y-2"
                    >
                      <div
                        className={cn(
                          "h-3 w-16 rounded bg-slate-200/50",
                          "dark:bg-slate-700/50",
                        )}
                      />
                      <div
                        className={cn(
                          "h-5 w-32 rounded bg-slate-200/50",
                          "dark:bg-slate-700/50",
                        )}
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-2 border-t border-border/40 pt-4">
                  <div
                    className={cn(
                      "h-3 w-28 rounded bg-slate-200/50",
                      "dark:bg-slate-700/50",
                    )}
                  />
                  <div
                    className={cn(
                      "h-16 w-full rounded-lg bg-slate-200/50",
                      "dark:bg-slate-700/50",
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Right Column Skeleton */}
          <div className="space-y-6">
            <Card className="border-0 bg-glass-bg shadow-md">
              <CardHeader className="border-b border-border/40 pb-3">
                <div
                  className={cn(
                    "h-4 w-24 rounded bg-slate-200/50",
                    "dark:bg-slate-700/50",
                  )}
                />
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div
                  className={cn(
                    "h-16 w-full rounded bg-slate-200/50",
                    "dark:bg-slate-700/50",
                  )}
                />
                <div
                  className={cn(
                    "h-8 w-full rounded bg-slate-200/50",
                    "dark:bg-slate-700/50",
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  const isCancellable =
    appointment?.status?.name === "Pending" ||
    appointment?.status?.name === "Scheduled";
  const urgencyInfo = getAppointmentUrgency(appointment);

  return (
    <>
      <AnimationStyles />
      <div className="min-h-full bg-background">
        <div className="max-w-full">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Left Column: Primary Details */}
            <div className="space-y-6 md:col-span-2">
              <Card className="border-0 bg-card/60 shadow-lg backdrop-blur-md">
                <CardHeader className="border-b border-border/60 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">
                        Appointment Information
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-3 py-1",
                        getStatusColor(appointment?.status?.name),
                      )}
                    >
                      {appointment?.status?.name}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("px-3 py-1", urgencyInfo.className)}
                    >
                      Urgency: {urgencyInfo.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Date
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {appointment?.whenDate
                            ? format(
                                new Date(appointment.whenDate),
                                "MMMM d, yyyy",
                              )
                            : "---"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Time
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {appointment?.timeSlot.time || "---"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Category
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {appointment?.appointmentCategory.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Urgency Level
                      </p>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <Badge
                          variant="outline"
                          className={cn("px-3 py-1", urgencyInfo.className)}
                        >
                          {urgencyInfo.label}
                        </Badge>
                      </div>
                      <p className="text-[11px] leading-5 text-muted-foreground">
                        {urgencyInfo.description}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Location
                      </p>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          Office of the Guidance Counselor (Academic Bldg)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      My Reason / Concern
                    </p>
                    <div className="rounded-lg border border-border/40 bg-muted/50 p-4">
                      <p className="whitespace-pre-wrap text-sm italic leading-relaxed">
                        "{appointment?.reason}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {auditEntries.length > 0 && (
                <Card className="border-border bg-glass-bg shadow-md">
                  <CardHeader className="border-b bg-muted/5 p-5">
                    <CardTitle
                      className={cn(
                        "flex items-center gap-2 text-[10px] font-bold",
                        "uppercase tracking-wider text-muted-foreground",
                      )}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Counselor Remarks / Audit Trail
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
                              entry.status.toUpperCase().includes("PENDING")
                                ? "border-amber-500 bg-background shadow-sm"
                                : entry.status
                                      .toUpperCase()
                                      .includes("APPROVED") ||
                                    entry.status
                                      .toUpperCase()
                                      .includes("COMPLETED") ||
                                    entry.status
                                      .toUpperCase()
                                      .includes("SCHEDULED")
                                  ? "border-emerald-500 bg-background shadow-sm"
                                  : entry.status
                                        .toUpperCase()
                                        .includes("REJECTED") ||
                                      entry.status
                                        .toUpperCase()
                                        .includes("CANCELLED") ||
                                      entry.status
                                        .toUpperCase()
                                        .includes("CANCELED")
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
                            <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                              {entry.remarks}
                            </p>
                          )}
                          {entry.details && (
                            <p className="text-[10px] italic text-muted-foreground">
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

            {/* Right Column: Actions & Metadata */}
            <div className="space-y-6">
              <Card className="border-0 bg-glass-bg shadow-md">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-sm font-semibold uppercase">
                    Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {isCancellable ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Changed your mind? You can cancel your appointment if it
                        is still pending or scheduled.
                      </p>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setIsCancelModalOpen(true)}
                        disabled={isCancelling}
                      >
                        {isCancelling ? "Processing..." : "Cancel Appointment"}
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex items-start gap-2 rounded-lg border border-blue-100/50",
                        "bg-blue-50/50 p-3 dark:border-blue-900/30 dark:bg-blue-950/10",
                      )}
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        This appointment is already{" "}
                        {appointment?.status?.name?.toLowerCase()} and cannot be
                        modified.
                      </p>
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-center text-[10px] text-muted-foreground">
                      ID: {appointment?.id}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={isCancelModalOpen}
        onOpenChange={setIsCancelModalOpen}
      >
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
                placeholder="e.g., I have a class conflict, I'm feeling better, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-[10px] italic text-muted-foreground">
                * This reason will be shared with the Guidance Office.
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

import { useState } from "react";
import { Appointment, AppointmentStatus } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Clock,
  Tag,
  User,
  Mail,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock3,
  CalendarRange,
  ShieldUser,
  ExternalLink,
} from "lucide-react";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import ActionConfirmModal from "./ConfirmModal";
import RescheduleModal from "./RescheduleModal";
import { cn } from "@/lib/utils";
import { CORPreviewDialog } from "@/components/shared/CORPreviewDialog";
import { format12HourTime, formatDate } from "@/utils";

interface ViewModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  statuses: AppointmentStatus[]; // all possible statuses
  onStatusAction: (
    appointment: Appointment,
    action: string,
    message?: string,
  ) => Promise<boolean>;
  onReschedule: (
    appointment: Appointment,
    newDate: string,
    newTimeSlotId: number,
  ) => Promise<boolean>;
  hasActions?: boolean; // whether to show action buttons
}

export default function ViewModal({
  appointment,
  isOpen,
  onClose,
  statuses,
  onStatusAction,
  onReschedule,
  hasActions = true,
}: ViewModalProps) {
  const [pendingAction, setPendingAction] = useState<{
    type: string;
    requiresMessage: boolean;
  } | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCorPreview, setShowCorPreview] = useState(false);

  if (!appointment) return null;

  const fullName = [
    appointment.user?.firstName,
    appointment.user?.middleName ? `${appointment.user.middleName[0]}.` : "",
    appointment.user?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  // Determine allowed actions based on current status
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

  // Map action to button color
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

  // Map action to icon
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

  const handleConfirmAction = async (message?: string): Promise<boolean> => {
    if (!pendingAction) return false;

    try {
      const success = await onStatusAction(
        appointment,
        pendingAction.type,
        message,
      );
      setPendingAction(null);
      return success;
    } catch (error) {
      console.error("Action failed:", error);
      return false;
    }
  };

  const handleRescheduleConfirm = async (
    newDate: string,
    newTimeSlotId: number,
  ) => {
    const isSuccess = await onReschedule(appointment, newDate, newTimeSlotId);
    setShowReschedule(!isSuccess);
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={onClose}
      >
        <DialogContent className="animate-in fade-in zoom-in-95 duration-200 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <Calendar className="h-5 w-5 text-primary" />
              Appointment Details
            </DialogTitle>
            {/* Timestamps */}
            {(appointment.createdAt || appointment.updatedAt) && (
              <div className="space-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
                {appointment.updatedAt &&
                appointment.updatedAt !== appointment.createdAt ? (
                  <p>
                    Last updated: {formatDate(appointment.updatedAt)} at{" "}
                    {format12HourTime(appointment.updatedAt)}
                  </p>
                ) : (
                  <p>
                    Created: {formatDate(appointment.createdAt || "")} at{" "}
                    {format12HourTime(appointment.createdAt || "")}
                  </p>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="grid gap-6">
            {/* Status Badge */}
            <div className="flex justify-start">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition-all duration-200 hover:scale-105 ${
                  STATUS_COLORS[getStatusColorKey(appointment.status?.name)]
                }`}
              >
                {appointment.status?.name}
              </span>
            </div>

            {/* Two-column layout for main info */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Student Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium uppercase text-muted-foreground">
                  Student
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{fullName}</span>
                  </div>
                  {appointment.user?.email && (
                    <div className="flex items-center gap-2 text-foreground">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.user.email}</span>
                    </div>
                  )}
                  {appointment.studentCorUrl && (
                    <div className="mt-2 border-t border-border/50 pt-2">
                      <button
                        onClick={() => setShowCorPreview(true)}
                        className="group flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        <FileText className="h-4 w-4" />
                        <span>View Student COR</span>
                        <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium uppercase text-muted-foreground">
                  Schedule
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-foreground">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(appointment.whenDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format12HourTime(appointment.timeSlot.time)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category & Reason */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium uppercase text-muted-foreground">
                Details
              </h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-foreground md:grid-cols-2">
                {/* Category Column */}
                <div className="flex items-start gap-2">
                  <Tag className="mt-1 size-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Category
                    </span>
                    <span className="w-fit rounded-md bg-muted px-2 py-0.5 text-sm">
                      {appointment.appointmentCategory.name}
                    </span>
                  </div>
                </div>

                {/* Reason Column - Full text display */}
                <div className="flex items-start gap-2">
                  <FileText className="mt-1 size-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Reason for Visit
                    </span>
                    <span
                      className={cn(
                        "max-h-[150px] overflow-y-auto whitespace-pre-wrap rounded-md",
                        "border border-border bg-muted/50 px-3 py-2 text-sm",
                        "leading-relaxed shadow-sm",
                      )}
                    >
                      {appointment.reason || "No reason provided"}
                    </span>
                  </div>
                </div>

                {/* Admin Notes - Spanning full width for better readability */}
                {appointment.adminNotes && (
                  <div className="col-span-full mt-2 flex items-start gap-2 border-t border-border/50 pt-4">
                    <ShieldUser className="mt-1 size-4 flex-shrink-0 text-notice-foreground" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        Admin Remarks
                      </span>
                      <p
                        className={cn(
                          "rounded-md border-l-2 border-notice-foreground",
                          "bg-notice-background/20 p-3 text-sm italic",
                        )}
                      >
                        {appointment.adminNotes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {hasActions && allowedActions.length > 0 && (
              <div className="border-t border-border pt-4">
                <div className="flex flex-wrap gap-2">
                  {allowedActions.map((action) => (
                    <Button
                      key={action}
                      onClick={() => handleActionClick(action)}
                      className={`${actionColor(action)} gap-2 transition-all duration-200 hover:scale-105`}
                      size="sm"
                    >
                      {actionIcon(action)}
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="transition-all duration-200 hover:scale-105"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal for actions that may require a message */}
      {pendingAction && (
        <ActionConfirmModal
          isOpen={!!pendingAction}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirmAction}
          action={pendingAction.type}
          requiresMessage={pendingAction.requiresMessage}
        />
      )}

      {/* Reschedule Modal */}
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
    </>
  );
}

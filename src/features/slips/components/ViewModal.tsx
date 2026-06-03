import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  CheckCircle2,
  Ban,
  RefreshCw,
  Clock,
  ExternalLink,
  FileText,
  Ticket,
  ShieldCheck,
} from "lucide-react";
import type { Slip } from "../types";
import { AttachmentsGrid } from "./AttachmentsGrid";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { useGetSlipAttachments } from "../hooks";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CORPreviewDialog } from "@/components/shared/CORPreviewDialog";

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: Slip | null;
  isAdmin?: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onForRevision: (id: string, reason: string) => void;
  isLoading?: boolean;
}

type ActionType = "approve" | "reject" | "revision" | null;

export function ViewModal({
  isOpen,
  onClose,
  slip,
  isAdmin = false,
  onApprove,
  onReject,
  onForRevision,
  isLoading = false,
}: ViewModalProps) {
  const [actionType, setActionType] = useState<ActionType>(null);
  const [reason, setReason] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showCorPreview, setShowCorPreview] = useState(false);
  const { data: attachments } = useGetSlipAttachments(slip?.id || "");

  if (!slip) return null;

  const handleActionConfirm = () => {
    if (actionType === "approve") {
      onApprove(slip.id!);
    } else if (actionType === "reject") {
      if (!reason.trim()) {
        alert("Please provide a reason for rejection");
        return;
      }
      onReject(slip.id!, reason);
    } else if (actionType === "revision") {
      if (!reason.trim()) {
        alert("Please provide revision notes");
        return;
      }
      onForRevision(slip.id!, reason);
    }
    handleCloseModal();
  };

  const handleActionClick = (type: ActionType) => {
    setActionType(type);
    setIsConfirming(true);
  };

  const handleCloseModal = () => {
    setActionType(null);
    setReason("");
    setIsConfirming(false);
    onClose();
  };

  const getStatusColor = (statusName?: string) => {
    const key = getStatusColorKey(statusName);
    return STATUS_COLORS[key] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (statusName?: string) => {
    const key = getStatusColorKey(statusName);
    switch (key) {
      case "success":
        return <CheckCircle2 className="h-4 w-4" />;
      case "danger":
        return <Ban className="h-4 w-4" />;
      case "warning":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const isPending =
    slip.status?.name?.toLowerCase() === "pending" ||
    slip.status?.name?.toLowerCase() === "for revision";

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={handleCloseModal}
      >
        <DialogContent
          className={cn(
            "animate-in zoom-in-95 fade-in flex max-h-[90vh] w-[95vw]",
            "max-w-5xl flex-col overflow-y-auto duration-200 sm:w-full",
            "md:overflow-hidden",
          )}
        >
          <DialogHeader>
            <DialogTitle>Excuse Slip Details</DialogTitle>
            <DialogDescription>
              Review and manage excuse slip submission
            </DialogDescription>
          </DialogHeader>

          <div
            className={cn(
              "animate-in fade-in grid flex-1 grid-cols-1 gap-6",
              "overflow-hidden duration-300 lg:grid-cols-3",
            )}
          >
            {/* Left Column - Details */}
            <div className="space-y-6 overflow-y-auto pr-4 lg:col-span-2">
              {/* Student Info Card */}
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Student Name
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {/* @ts-ignore */}
                        {slip.user?.firstName} {slip.user?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Status
                      </p>
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full",
                          "px-3 py-1 text-sm font-medium mt-1",
                          getStatusColor(slip.status?.name),
                        )}
                      >
                        {getStatusIcon(slip.status?.name)}
                        {slip.status?.name}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Date of Absence
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {new Date(slip.dateOfAbsence).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Date Needed
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {new Date(slip.dateNeeded).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Submitted
                      </p>
                      <p className="mt-1 text-lg font-semibold text-foreground">
                        {new Date(slip.createdAt || "").toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                  </div>
                  {slip.studentCorUrl && (
                    <div className="mt-6 border-t border-border/50 pt-4">
                      <button
                        onClick={() => setShowCorPreview(true)}
                        className="group flex w-fit items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
                      >
                        <FileText className="h-4 w-4" />
                        <span>View Verified Student COR</span>
                        <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ticket Information Card */}
              {slip.ticket && (
                <Card
                  className={cn(
                    "border-2 border-dashed transition-all duration-200 hover:shadow-md",
                    slip.ticket.isVerified
                      ? "border-success-foreground bg-success-background/10"
                      : "border-primary/50 bg-primary/5",
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "rounded-lg p-2",
                            slip.ticket.isVerified
                              ? "bg-success-background text-success-foreground"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          <Ticket className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Admission Slip Ticket Code
                          </p>
                          <p className="font-mono text-2xl font-bold text-foreground">
                            {slip.ticket.ticketCode}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">
                          Verification Status
                        </p>
                        <div
                          className={cn(
                            "mt-1 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-tight",
                            slip.ticket.isVerified
                              ? "bg-success-background text-success-foreground"
                              : "bg-warning-background text-warning-foreground",
                          )}
                        >
                          {slip.ticket.isVerified ? (
                            <>
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Claimed
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5" />
                              Pending Claim
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {slip.ticket.isVerified && slip.ticket.verifiedAt && (
                      <p className="mt-3 text-xs italic text-muted-foreground">
                        Verified on{" "}
                        {new Date(slip.ticket.verifiedAt).toLocaleString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Reason Card */}
              <Card className="transition-all duration-200 hover:shadow-md">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Reason for Absence
                  </p>
                  <p className="mt-2 text-foreground">{slip.reason}</p>
                </CardContent>
              </Card>

              {/* Admin Notes Card (if exists) */}
              {slip.adminNotes && (
                <Card
                  className={cn(
                    "border-0 border-l-4 border-info-foreground bg-muted/20",
                    "transition-all duration-200 hover:shadow-sm",
                  )}
                >
                  <CardContent className="pt-6">
                    <p className="text-sm font-medium text-info-foreground">
                      Admin Notes
                    </p>
                    <p className="mt-2 text-info-foreground">
                      {slip.adminNotes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Admin Actions */}
              {isAdmin && isPending && (
                <div className="flex gap-3 border-t pt-4">
                  <Button
                    onClick={() => handleActionClick("approve")}
                    disabled={isLoading}
                    className={cn(
                      "gap-2 bg-green-600 transition-all duration-200",
                      "hover:scale-105 hover:bg-green-700",
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleActionClick("revision")}
                    disabled={isLoading}
                    variant="outline"
                    className="gap-2 transition-all duration-200 hover:scale-105"
                  >
                    <RefreshCw className="h-4 w-4" />
                    For Revision
                  </Button>
                  <Button
                    onClick={() => handleActionClick("reject")}
                    disabled={isLoading}
                    variant="destructive"
                    className="gap-2 transition-all duration-200 hover:scale-105"
                  >
                    <Ban className="h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column - Attachments (Scrollable) */}
            <div className="overflow-y-auto lg:col-span-1">
              {attachments && attachments.length > 0 && (
                <Card className="h-fit transition-all duration-200 hover:shadow-md">
                  <CardContent className="pt-6">
                    <p className="mb-4 text-sm font-medium text-muted-foreground">
                      Attachments
                    </p>
                    <AttachmentsGrid
                      slipId={slip.id || ""}
                      files={attachments}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={isConfirming}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
            setReason("");
          }
          setIsConfirming(open);
        }}
      >
        <AlertDialogContent className="animate-in fade-in zoom-in-95 duration-200">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve"
                ? "Approve Excuse Slip"
                : actionType === "reject"
                  ? "Reject Excuse Slip"
                  : "Send for Revision"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? "Are you sure you want to approve this excuse slip?"
                : "Please provide a reason for this action."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(actionType === "reject" || actionType === "revision") && (
            <div className="py-4">
              <Textarea
                placeholder={
                  actionType === "reject"
                    ? "Reason for rejection..."
                    : "Revision notes for student..."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-24"
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActionConfirm}
              disabled={isLoading}
              className={
                actionType === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : actionType === "revision"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
              }
            >
              {actionType === "approve" ? "Approve" : "Confirm"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* COR Preview Modal */}
      <CORPreviewDialog
        isOpen={showCorPreview}
        onClose={() => setShowCorPreview(false)}
        fileUrl={slip.studentCorUrl}
        studentName={`${slip.user?.firstName} ${slip.user?.lastName}`}
      />
    </>
  );
}

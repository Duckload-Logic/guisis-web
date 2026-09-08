import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle2,
  Ban,
  RefreshCw,
  Clock,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Clock3,
  Ticket,
  StickyNote,
  ShieldCheck,
  Copy,
  Check,
  ShieldAlert,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetSlipById,
  useUpdateSlipStatus,
  useGetSlipAttachments,
  useClaimTicket,
  useStartSlip,
} from "@/features/slips/hooks";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { AttachmentsGrid } from "@/features/slips/components/AttachmentsGrid";
import { usePageMetadata, useToast } from "@/context";
import { CORPreviewDialog } from "@/components/shared/CORPreviewDialog";
import { InOfficeSessionTimer } from "@/components/shared/InOfficeSessionTimer";
import { StudentProfileBentoCard } from "@/components/shared/StudentProfileBentoCard";
import { parseAuditTrail } from "@/utils/auditTrail";
import { formatProcessDuration, formatDate } from "@/utils/dateTime";
import { cn } from "@/lib/utils";

type ActionType = "approve" | "reject" | "revision" | null;

export default function SlipDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isAssistant = location.pathname.startsWith("/assistant");
  const slipsBasePath = isAssistant ? "/assistant/slips" : "/admin/slips";

  const { data: slip, isLoading, isError, refetch } = useGetSlipById(id || "");
  const { data: attachments } = useGetSlipAttachments(id || "");
  const { mutate: updateSlipStatus, isPending: isUpdatingStatus } =
    useUpdateSlipStatus();

  const [actionType, setActionType] = useState<ActionType>(null);
  const [reason, setReason] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isVerifyConfirming, setIsVerifyConfirming] = useState(false);
  const [showCorPreview, setShowCorPreview] = useState(false);
  const [hasCopiedId, setHasCopiedId] = useState(false);

  const claimTicketMutation = useClaimTicket();
  const startSlipMutation = useStartSlip();
  const isClaiming = claimTicketMutation.isPending;
  const { triggerToast } = useToast();

  const handleStartSession = async (offsetMinutes = 0) => {
    if (!id) return;
    try {
      await startSlipMutation.mutateAsync({ id, offsetMinutes });
      triggerToast(
        offsetMinutes > 0
          ? `✓ Session started with +${offsetMinutes}m simulated!`
          : "✓ In-office validation session started!",
      );
      refetch();
    } catch (error: any) {
      triggerToast(error.message || "Failed to start session");
    }
  };

  const handleVerifyTicket = () => {
    if (!slip?.ticket?.ticketCode) return;
    setIsVerifyConfirming(true);
  };

  const handleConfirmVerifyTicket = async () => {
    if (!slip?.ticket?.ticketCode) return;
    try {
      await claimTicketMutation.mutateAsync(slip.ticket.ticketCode);
      triggerToast("✓ Process started & ticket verified successfully!");
      setIsVerifyConfirming(false);
      refetch();
    } catch (error: any) {
      triggerToast(error.message || "Failed to verify ticket");
      setIsVerifyConfirming(false);
    }
  };

  const auditEntries = useMemo(() => {
    return parseAuditTrail(slip?.adminNotes);
  }, [slip?.adminNotes]);

  const fullName = slip
    ? [
        slip.user?.firstName,
        slip.user?.middleName ? `${slip.user.middleName[0]}.` : "",
        slip.user?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  usePageMetadata({
    title: "Admission Slip Details",
    description: `Reviewing submission for ${fullName || "Student"}`,
    badgeText: isAssistant ? "Assistant Review" : "Admin Management",
    badgeIcon: <Clock3 className="h-4 w-4" />,
    isLoading: isLoading && !slip,
    headerActions: null,
  });

  if (isError || (!slip && !isLoading)) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <p className="font-medium text-destructive">
          {isError
            ? "Error loading admission slip"
            : "Admission slip not found"}
        </p>
        <Button
          onClick={() => navigate(slipsBasePath)}
          variant="outline"
          className="rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>
    );
  }

  if (!slip) return null;

  const handleCopyId = () => {
    if (!slip.id) return;
    navigator.clipboard.writeText(slip.id);
    setHasCopiedId(true);
    setTimeout(() => setHasCopiedId(false), 2000);
  };

  const handleActionClick = (type: ActionType) => {
    setActionType(type);
    setIsConfirming(true);
  };

  const handleActionConfirm = () => {
    if (!actionType || !slip.id) return;

    const status =
      actionType === "approve"
        ? "Approved"
        : actionType === "reject"
          ? "Rejected"
          : "For Revision";

    if (
      (actionType === "reject" || actionType === "revision") &&
      !reason.trim()
    ) {
      return;
    }

    updateSlipStatus(
      { id: slip.id, status, adminNotes: reason },
      {
        onSuccess: () => {
          refetch();
          setIsConfirming(false);
          setActionType(null);
          setReason("");
        },
      },
    );
  };

  const isPending =
    slip.status?.name?.toLowerCase() === "pending" ||
    slip.status?.name?.toLowerCase() === "for revision";
  const isApproved = slip.status?.name?.toLowerCase() === "approved";
  const needsSignificantNote =
    Boolean(slip.ticket?.isVerified) && !slip.hasSignificantNote;

  const studentData = {
    firstName: slip.user?.firstName,
    middleName: slip.user?.middleName,
    lastName: slip.user?.lastName,
    email: slip.user?.email,
    studentNumber: slip.studentNumber || slip.user?.studentNumber,
    contactNumber: slip.contactNumber || slip.user?.contactNumber,
    profilePicture: slip.user?.profilePicture,
    iirId: slip.iirId,
    studentCorUrl: slip.studentCorUrl,
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-12 sm:px-6 md:px-8">
      {/* Top Navigation & Context Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(slipsBasePath)}
            className="h-9 w-9 rounded-xl p-0 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Admission Slip Details
              </h1>
              {slip.id && (
                <button
                  type="button"
                  onClick={handleCopyId}
                  className={cn(
                    "flex items-center gap-1 rounded-md border border-border/70",
                    "bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground",
                    "transition-colors hover:border-primary/40 hover:text-foreground",
                  )}
                  title="Click to copy full ID"
                >
                  {hasCopiedId ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>SLIP-{slip.id.substring(0, 8)}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted {formatDate(slip.createdAt || "")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {slip.status && (
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold shadow-sm",
                STATUS_COLORS[getStatusColorKey(slip.status.name)],
              )}
            >
              {slip.status.name}
            </Badge>
          )}
          {slip.category && (
            <Badge
              variant="secondary"
              className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary"
            >
              {slip.category.name}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              "rounded-full border-border/70 bg-muted/40 px-3 py-1 text-[11px]",
              "font-medium text-foreground/80",
            )}
          >
            <Clock3 className="mr-1 inline h-3 w-3 text-muted-foreground" />
            Turnaround:{" "}
            {formatProcessDuration(slip.startedAt, slip.completedAt)}
          </Badge>
        </div>
      </div>

      {/* Significant Note Banner */}
      {needsSignificantNote && !isAssistant && (
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
                This verified admission slip requires an incident record in the
                student's file.
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              navigate(
                `/admin/student-records/${slip.iirId}?addNote=true&admissionSlipId=${slip.id}`,
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
        {/* Left Column: Dossier & Administrative Controls (Col-span 4) */}
        <div className="space-y-6 lg:col-span-4">
          <StudentProfileBentoCard
            student={studentData}
            onViewCor={() => setShowCorPreview(true)}
            canAccessIir={!isAssistant}
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
                <ShieldCheck className="h-4 w-4 text-primary" />
                Administrative Controls
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-5">
              {/* Online Evaluation: Pending or For Revision */}
              {isPending && (
                <div className="space-y-2.5">
                  <Button
                    onClick={() => handleActionClick("approve")}
                    disabled={isUpdatingStatus}
                    className={cn(
                      "h-10 w-full gap-2 rounded-xl bg-emerald-600 font-bold text-white",
                      "shadow-sm transition-all hover:bg-emerald-700",
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Admission Slip
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleActionClick("revision")}
                    disabled={isUpdatingStatus}
                    className="h-9 w-full gap-2 rounded-xl border-blue-500/30 text-xs font-semibold text-blue-600 hover:bg-blue-500/10"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Request Revision
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleActionClick("reject")}
                    disabled={isUpdatingStatus}
                    className="h-9 w-full gap-2 rounded-xl border-destructive/30 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Reject Slip
                  </Button>
                </div>
              )}

              {/* Physical Claiming Workflow: Approved */}
              {isApproved && (
                <div className="space-y-4">
                  {slip.ticket && (
                    <div
                      className={cn(
                        "rounded-xl border border-dashed p-3.5 transition-all",
                        slip.ticket.isVerified
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : "border-primary/40 bg-primary/5",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "rounded-lg p-1.5 text-white",
                              slip.ticket.isVerified
                                ? "bg-emerald-600"
                                : "bg-primary",
                            )}
                          >
                            <Ticket className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">
                              Claim Ticket
                            </p>
                            <p className="font-mono text-base font-bold text-foreground">
                              {slip.ticket.ticketCode}
                            </p>
                          </div>
                        </div>

                        <Badge
                          variant={
                            slip.ticket.isVerified ? "default" : "outline"
                          }
                          className={cn(
                            "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase",
                            slip.ticket.isVerified &&
                              "bg-emerald-600 text-white",
                          )}
                        >
                          {slip.ticket.isVerified ? "Claimed" : "Pending Claim"}
                        </Badge>
                      </div>

                      {!slip.ticket.isVerified && !slip.startedAt && (
                        <Button
                          onClick={handleVerifyTicket}
                          disabled={isClaiming}
                          className="mt-3.5 h-9 w-full gap-2 rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                        >
                          {isClaiming ? (
                            <Clock3 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                          Verify & Claim Ticket
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Active In-Office Claiming Session */}
                  {slip.startedAt && !slip.ticket?.isVerified && (
                    <InOfficeSessionTimer
                      startedAt={slip.startedAt}
                      completedAt={slip.completedAt}
                      title="In-Office Claiming Session"
                      subtitle="Student is claiming physical admission slip"
                      studentName={fullName}
                      studentNumber={slip.studentNumber}
                      onStart={(offset) => handleStartSession(offset)}
                      onComplete={handleVerifyTicket}
                      isPending={startSlipMutation.isPending || isClaiming}
                    />
                  )}

                  {/* Ready to Start In-Office Claiming */}
                  {!slip.startedAt && !slip.ticket?.isVerified && (
                    <InOfficeSessionTimer
                      startedAt={null}
                      completedAt={null}
                      title="In-Office Claiming Session"
                      subtitle="Student is claiming physical admission slip"
                      studentName={fullName}
                      studentNumber={slip.studentNumber}
                      onStart={(offset) => handleStartSession(offset)}
                      isPending={startSlipMutation.isPending}
                    />
                  )}

                  {/* Claiming Completed (Only shown when ticket is verified!) */}
                  {slip.ticket?.isVerified && (
                    <InOfficeSessionTimer
                      startedAt={slip.startedAt}
                      completedAt={slip.completedAt}
                      title="In-Office Claiming Session"
                      studentName={fullName}
                      studentNumber={slip.studentNumber}
                    />
                  )}
                </div>
              )}

              {/* Processed state */}
              {!isPending && !isApproved && (
                <div className="rounded-xl border border-dashed border-border/70 py-6 text-center">
                  <ShieldAlert className="mx-auto h-7 w-7 text-muted-foreground/60" />
                  <p className="mt-2 text-xs font-bold text-muted-foreground">
                    Processed as {slip.status?.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Submission Context & Audit History (Col-span 8) */}
        <div className="space-y-6 lg:col-span-8">
          {/* Submission Context Card */}
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
                  Submission Context
                </CardTitle>
                <span className="font-mono text-xs text-muted-foreground">
                  Category: {slip.category?.name || "General"}
                </span>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
              {/* Reason for absence blockquote */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reason for Absence
                </p>
                <div className="rounded-xl border bg-muted/10 p-4">
                  <p className="text-sm font-medium italic leading-relaxed text-foreground/90">
                    "{slip.reason || "No specific reason provided."}"
                  </p>
                </div>
              </div>

              {/* Date Info Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1 rounded-xl border bg-muted/10 p-3.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Date of Absence
                    </span>
                  </div>
                  <p className="text-base font-bold text-foreground">
                    {formatDate(slip.dateOfAbsence)}
                  </p>
                </div>

                <div className="space-y-1 rounded-xl border bg-muted/10 p-3.5">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Date Needed
                    </span>
                  </div>
                  <p className="text-base font-bold text-foreground">
                    {formatDate(slip.dateNeeded)}
                  </p>
                </div>
              </div>

              {/* Supporting Attachments Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Supporting Documents
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/5 p-3.5">
                  {attachments && attachments.length > 0 ? (
                    <AttachmentsGrid
                      slipId={slip.id || ""}
                      files={attachments}
                    />
                  ) : (
                    <p className="py-3 text-center text-xs italic text-muted-foreground">
                      No documents attached to this submission.
                    </p>
                  )}
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
              {auditEntries.map((entry: any, idx: number) => (
                <div
                  key={idx}
                  className="group flex items-start gap-3.5"
                >
                  <div className="relative mt-1">
                    <div
                      className={cn(
                        "relative z-10 h-3 w-3 shrink-0 rounded-full border-2",
                        entry.status.toUpperCase().includes("PENDING")
                          ? "border-amber-500 bg-background shadow-sm"
                          : entry.status.toUpperCase().includes("APPROVED") ||
                              entry.status.toUpperCase().includes("COMPLETED")
                            ? "border-emerald-500 bg-background shadow-sm"
                            : entry.status.toUpperCase().includes("REJECTED") ||
                                entry.status.toUpperCase().includes("REVISION")
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
                      Submission Received
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatDate(slip.createdAt || "")}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Initial admission slip application logged.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve / Reject / Revision Dialog */}
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
        <AlertDialogContent className="max-w-md rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              {actionType === "approve"
                ? "Approve Admission Slip"
                : actionType === "reject"
                  ? "Reject Admission Slip"
                  : "Send for Revision"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              {actionType === "approve"
                ? "Are you sure you want to approve this admission slip? Student will be notified."
                : `Please provide a reason for this ${actionType === "reject" ? "rejection" : "revision"}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(actionType === "reject" || actionType === "revision") && (
            <div className="py-3">
              <Textarea
                placeholder={
                  actionType === "reject"
                    ? "Reason for rejection..."
                    : "Revision notes for student..."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-28 rounded-xl border-border bg-muted/20 text-xs focus:ring-primary/20"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border/50 pt-4">
            <AlertDialogCancel className="rounded-xl font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActionConfirm}
              disabled={
                isUpdatingStatus ||
                ((actionType === "reject" || actionType === "revision") &&
                  !reason.trim())
              }
              className={cn(
                "rounded-xl px-5 font-semibold text-white shadow-sm",
                actionType === "reject"
                  ? "bg-destructive hover:bg-destructive/90"
                  : actionType === "revision"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-emerald-600 hover:bg-emerald-700",
              )}
            >
              {actionType === "approve" ? "Confirm Approval" : "Submit Action"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify & Start In-Office Claim Dialog */}
      <AlertDialog
        open={isVerifyConfirming}
        onOpenChange={setIsVerifyConfirming}
      >
        <AlertDialogContent className="max-w-md rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-2xl">
          <AlertDialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <AlertDialogTitle className="text-xl font-bold">
              Start Claiming Process
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Confirm student{" "}
              <strong className="text-foreground">{fullName}</strong> is present
              in the office to claim ticket{" "}
              <span className="font-mono font-bold text-foreground">
                SLIP-{slip.ticket?.ticketCode}
              </span>
              ? This will start tracking process duration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 border-t border-border/50 pt-4">
            <AlertDialogCancel className="rounded-xl font-semibold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmVerifyTicket}
              disabled={isClaiming}
              className="rounded-xl bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              {isClaiming ? "Starting..." : "Start Process & Verify"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* COR Preview Modal */}
      <CORPreviewDialog
        isOpen={showCorPreview}
        onClose={() => setShowCorPreview(false)}
        fileUrl={slip.studentCorUrl}
        studentName={fullName}
      />
    </div>
  );
}

import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  useGetSlipById,
  useUpdateSlipStatus,
  useGetSlipAttachments,
  useClaimTicket,
} from "@/features/slips/hooks";
import {
  CheckCircle2,
  Ban,
  RefreshCw,
  Clock,
  ArrowLeft,
  FileText,
  Calendar,
  User,
  ShieldUser,
  Fingerprint,
  Building2,
  MessageSquare,
  Clock3,
  Ticket,
  StickyNote,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { AttachmentsGrid } from "@/features/slips/components/AttachmentsGrid";
import { usePageMetadata, useToast } from "@/context";
import { CORPreviewDialog } from "@/components/shared/CORPreviewDialog";
import { cn } from "@/lib/utils";
import { parseAuditTrail } from "@/utils/auditTrail";
import { formatProcessDuration } from "@/utils/dateTime";

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
  const [showCorPreview, setShowCorPreview] = useState(false);

  const claimTicketMutation = useClaimTicket();
  const isClaiming = claimTicketMutation.isPending;
  const { triggerToast } = useToast();

  const handleVerifyTicket = async () => {
    if (!slip.ticket?.ticketCode) return;
    try {
      await claimTicketMutation.mutateAsync(slip.ticket.ticketCode);
      triggerToast("✓ Ticket verified successfully!");
      refetch();
    } catch (error: any) {
      triggerToast(error.message || "Failed to verify ticket");
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

  const initials = slip?.user
    ? `${slip.user.firstName[0]}${slip.user.lastName[0]}`
    : "??";

  const displayStudentNumber =
    slip?.studentNumber || slip?.user?.studentNumber || "N/A";

  usePageMetadata({
    title: "Admission Slip Details",
    description: `Reviewing submission for ${fullName || "Student"}`,
    badgeText: "Admin Management",
    badgeIcon: <FileText className="h-4 w-4" />,
    isLoading: isLoading && !slip,
    headerActions: null,
  });

  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <p className="font-medium text-destructive">
          Error loading admission slip
        </p>
        <Button
          onClick={() => navigate(slipsBasePath)}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>
    );
  }

  if (!slip && !isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground">Admission slip not found</p>
        <Button
          onClick={() => navigate(slipsBasePath)}
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
      </div>
    );
  }

  if (!slip) return null;

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
      return; // Handled by UI validation in real scenario
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

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const needsSignificantNote =
    slip.ticket?.isVerified && !slip.hasSignificantNote;

  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-6 duration-700",
        "mx-auto w-full max-w-5xl space-y-6 px-4 pb-12",
        "sm:px-6 md:px-8",
      )}
    >
      {needsSignificantNote && (
        <div
          className={cn(
            "animate-in zoom-in-95 flex flex-col items-center",
            "justify-between gap-4 rounded-xl border border-primary/20",
            "bg-primary/10 p-6 shadow-md backdrop-blur-xl duration-500",
            "sm:flex-row",
          )}
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "rounded-2xl border border-primary/30",
                "bg-primary/20 p-3",
              )}
            >
              <StickyNote className="h-6 w-6 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold tracking-tight text-foreground">
                Record Significant Note
              </h3>
              <p className="text-xs font-medium text-muted-foreground">
                This verified admission slip requires a significant note for the
                student's records.
              </p>
            </div>
          </div>
          <Button
            onClick={() =>
              navigate(
                `/admin/student-records/${slip.iirId}` +
                  `?addNote=true&admissionSlipId=${slip.id}`,
              )
            }
            className={cn(
              "h-11 rounded-xl bg-primary px-6 font-bold text-white",
              "shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]",
              "hover:bg-primary/90",
            )}
          >
            Add Note Now
          </Button>
        </div>
      )}
      {/* Top Row: Identity & Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                src={slip.user?.profilePicture}
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
                {displayStudentNumber}
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-2">
              {!isAssistant && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "group/btn w-full gap-2 rounded-xl border-primary/20",
                    "bg-primary/5 font-bold text-primary transition-all",
                    "duration-300 hover:bg-primary hover:text-white",
                  )}
                  onClick={() => navigate(`/admin/student-records/${slip.iirId}`)}
                >
                  <User className="h-3.5 w-3.5" />
                  Access Record
                </Button>
              )}
              {slip.studentCorUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "group/btn w-full gap-2 rounded-xl border-primary/20",
                    "bg-primary/5 font-bold text-primary transition-all",
                    "duration-300 hover:bg-primary hover:text-white",
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
              Submission Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                    {displayStudentNumber}
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
                  Admission Slip ID
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
                    {slip.id || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Row: Submission Details & Actions */}
      <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-12">
        {/* Left: Submission Details (Col-span 8) */}
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
                    Submission Context
                  </CardTitle>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    ID: {slip.id?.substring(0, 8)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {slip.category && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full border px-3 py-1 text-[10px] font-bold",
                      "shadow-sm border-white/45 bg-white/40",
                      "dark:border-white/10 dark:bg-white/[0.05]",
                    )}
                  >
                    {slip.category.name}
                  </Badge>
                )}
                {slip.status && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-full border px-3 py-1 text-[10px] font-bold",
                      "shadow-sm",
                      STATUS_COLORS[getStatusColorKey(slip.status.name)],
                    )}
                  >
                    {slip.status.name}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[10px] font-bold text-blue-600 dark:text-blue-400"
                >
                  <Clock3 className="mr-1 inline h-3 w-3" />
                  Turnaround: {formatProcessDuration(slip.startedAt, slip.completedAt)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-5 sm:p-6">
              {/* Reason for Absence Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    Reason for Absence
                  </h3>
                </div>

                <div
                  className={cn(
                    "rounded-xl border bg-muted/15 p-5 shadow-inner",
                  )}
                >
                  <p className="text-sm font-medium italic leading-relaxed text-foreground/80">
                    "{slip.reason || "No specific reason provided."}"
                  </p>
                </div>
              </div>

              {/* Date Info Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div
                  className={cn(
                    "group relative space-y-2 rounded-xl border bg-muted/5 p-4",
                    "transition-all duration-300 hover:border-primary/30",
                  )}
                >
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <Calendar className="h-4 w-4 text-primary/60" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground/60">
                      Date of Absence
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground/90">
                    {formatDateShort(slip.dateOfAbsence)}
                  </p>
                </div>
                <div
                  className={cn(
                    "group relative space-y-2 rounded-xl border bg-muted/5 p-4",
                    "transition-all duration-300 hover:border-primary/30",
                  )}
                >
                  <div className="flex items-center gap-2 text-muted-foreground/70">
                    <Clock className="h-4 w-4 text-primary/60" />
                    <span className="text-[10px] font-bold uppercase text-muted-foreground/60">
                      Date Needed
                    </span>
                  </div>
                  <p className="text-lg font-bold text-foreground/90">
                    {formatDateShort(slip.dateNeeded)}
                  </p>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-1.5">
                    <ShieldUser className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    Supporting Documents
                  </h3>
                </div>
                <div className="rounded-xl border bg-muted/5 p-4 shadow-inner sm:p-5">
                  {attachments && attachments.length > 0 ? (
                    <AttachmentsGrid
                      slipId={slip.id || ""}
                      files={attachments}
                    />
                  ) : (
                    <p className="py-6 text-center text-xs italic text-muted-foreground">
                      No attachments provided
                    </p>
                  )}
                </div>
              </div>

              {slip.adminNotes && (
                <div className="border-t border-border/50 pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-1.5">
                      <ShieldUser className="h-4 w-4 text-orange-500" />
                    </div>
                    <h3 className="text-xs font-bold uppercase text-orange-500">
                      Counselor Remarks
                    </h3>
                  </div>
                  <div
                    className={cn(
                      "rounded-xl border border-orange-500/10 bg-orange-500/[0.02]",
                      "p-5 shadow-inner",
                    )}
                  >
                    <p className="text-sm italic leading-relaxed text-foreground/80">
                      {slip.adminNotes}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Actions & History (Col-span 4) */}
        <div className="space-y-6 lg:col-span-4">
          <Card className="overflow-hidden border-border bg-glass-bg shadow-md">
            <CardHeader className="border-b bg-muted/5 p-5">
              <CardTitle className="flex items-center gap-2.5 text-base font-bold tracking-tight">
                <ShieldUser className="h-4 w-4 text-primary" />
                Administrative Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {slip.ticket && (
                <div
                  className={cn(
                    "mb-4 rounded-xl border border-dashed p-4 transition-all duration-300",
                    slip.ticket.isVerified
                      ? "border-green-500/50 bg-green-500/5"
                      : "border-primary/50 bg-primary/5",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "rounded-lg p-2 text-white",
                        slip.ticket.isVerified ? "bg-green-500" : "bg-primary",
                      )}
                    >
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Admission Slip Ticket
                      </p>
                      <p className="font-mono text-lg font-bold tracking-tighter text-foreground">
                        {slip.ticket.ticketCode}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/20 pt-3">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">
                      Status
                    </span>
                    <Badge
                      variant={slip.ticket.isVerified ? "default" : "outline"}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase",
                        slip.ticket.isVerified &&
                          "bg-green-600 hover:bg-green-700",
                      )}
                    >
                      {slip.ticket.isVerified ? "Claimed" : "Pending Claim"}
                    </Badge>
                  </div>

                  {!slip.ticket.isVerified && (
                    <Button
                      onClick={handleVerifyTicket}
                      disabled={isClaiming}
                      className={cn(
                        "mt-4 w-full gap-2 rounded-xl bg-green-600",
                        "font-semibold text-white shadow-md",
                        "transition-all hover:bg-green-700",
                        "hover:scale-[1.01] active:scale-95",
                      )}
                    >
                      {isClaiming ? (
                        <Clock3 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Verify Ticket
                    </Button>
                  )}
                </div>
              )}
              {isPending ? (
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => handleActionClick("approve")}
                    disabled={isUpdatingStatus}
                    className={cn(
                      "group/action h-11 w-full items-center justify-between",
                      "rounded-xl border border-white/10 bg-green-600 px-4",
                      "text-white shadow-sm transition-all duration-300",
                      "hover:scale-[1.02] hover:bg-green-700 hover:shadow-md",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-bold">Approve Slip</span>
                    </div>
                    <ArrowLeft
                      className={cn(
                        "h-3.5 w-3.5 -translate-x-1.5 rotate-180 opacity-0",
                        "transition-all duration-300",
                        "group-hover/action:translate-x-0 group-hover/action:opacity-100",
                      )}
                    />
                  </Button>

                  <Button
                    onClick={() => handleActionClick("revision")}
                    disabled={isUpdatingStatus}
                    className={cn(
                      "group/action h-11 w-full items-center justify-between",
                      "rounded-xl border border-white/10 bg-blue-600 px-4",
                      "text-white shadow-sm transition-all duration-300",
                      "hover:scale-[1.02] hover:bg-blue-700 hover:shadow-md",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-4 w-4" />
                      <span className="text-xs font-bold">
                        Request Revision
                      </span>
                    </div>
                    <ArrowLeft
                      className={cn(
                        "h-3.5 w-3.5 -translate-x-1.5 rotate-180 opacity-0",
                        "transition-all duration-300",
                        "group-hover/action:translate-x-0 group-hover/action:opacity-100",
                      )}
                    />
                  </Button>

                  <Button
                    onClick={() => handleActionClick("reject")}
                    disabled={isUpdatingStatus}
                    className={cn(
                      "group/action h-11 w-full items-center justify-between",
                      "rounded-xl border border-white/10 bg-red-600 px-4 text-white",
                      "shadow-sm transition-all duration-300 hover:scale-[1.02]",
                      "hover:bg-red-700 hover:shadow-md",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Ban className="h-4 w-4" />
                      <span className="text-xs font-bold">Reject Slip</span>
                    </div>
                    <ArrowLeft
                      className={cn(
                        "h-3.5 w-3.5 -translate-x-1.5 rotate-180 opacity-0",
                        "transition-all duration-300",
                        "group-hover/action:translate-x-0 group-hover/action:opacity-100",
                      )}
                    />
                  </Button>
                </div>
              ) : (
                <div
                  className={cn(
                    "space-y-3 rounded-xl border border-dashed py-8 text-center",
                  )}
                >
                  <div className="mx-auto w-fit rounded-full border border-primary/20 bg-primary/10 p-3">
                    <CheckCircle2 className="h-6 w-6 text-primary/60" />
                  </div>
                  <p className="text-xs font-bold italic text-muted-foreground/60">
                    Processed as {slip.status?.name}
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
              {auditEntries.map((entry: any, idx: number) => (
                <div key={idx} className="group flex items-start gap-4">
                  <div className="relative mt-1">
                    <div
                      className={cn(
                        "relative z-10 h-3.5 w-3.5 shrink-0",
                        "rounded-full border-2",
                        entry.status.toUpperCase().includes("PENDING")
                          ? "border-amber-500 bg-background shadow-sm"
                          : entry.status.toUpperCase().includes("APPROVED") ||
                            entry.status.toUpperCase().includes("COMPLETED")
                          ? "border-emerald-500 bg-background shadow-sm"
                          : entry.status.toUpperCase().includes("REJECTED") ||
                            entry.status.toUpperCase().includes("REVISION")
                          ? "border-red-500 bg-background shadow-sm"
                          : "border-primary bg-background shadow-sm"
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
                          "whitespace-pre-wrap"
                        )}
                      >
                        {entry.remarks}
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
                    Submission Received
                  </p>
                  <p
                    className={cn(
                      "w-fit rounded-full border bg-muted/30",
                      "px-2 py-0.5 text-[9px] font-bold",
                      "text-muted-foreground/60",
                    )}
                  >
                    {formatDateShort(slip.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
        <AlertDialogContent
          className={cn(
            "animate-in zoom-in-95 fade-in rounded-2xl border",
            "border-border bg-card shadow-2xl backdrop-blur-2xl",
            "duration-200",
          )}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              {actionType === "approve"
                ? "Approve Admission Slip"
                : actionType === "reject"
                  ? "Reject Admission Slip"
                  : "Send for Revision"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
              {actionType === "approve"
                ? "Are you sure you want to approve this admission slip? Student will be notified."
                : `Please provide a detailed reason for this ${actionType === "reject" ? "rejection" : "revision"}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(actionType === "reject" || actionType === "revision") && (
            <div className="py-6">
              <Textarea
                placeholder={
                  actionType === "reject"
                    ? "Reason for rejection..."
                    : "Revision notes for student..."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={cn(
                  "min-h-36 rounded-2xl border-border bg-muted/15 italic",
                  "placeholder:text-muted-foreground/45 focus:ring-primary/20",
                )}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border/50 pt-6">
            <AlertDialogCancel className="rounded-xl border-border px-6 font-bold transition-all hover:bg-muted/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleActionConfirm}
              disabled={isUpdatingStatus}
              className={cn(
                "rounded-xl px-8 font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                actionType === "reject"
                  ? "bg-red-600 hover:bg-red-700"
                  : actionType === "revision"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700",
              )}
            >
              {actionType === "approve" ? "Confirm Approval" : "Submit Action"}
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

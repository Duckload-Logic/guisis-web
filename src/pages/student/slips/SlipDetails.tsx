import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useGetSlipById, useGetSlipAttachments } from "@/features/slips/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  FileCheck,
  FileText,
  Info,
  MessageSquare,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import { usePageMetadata } from "@/context";
import { AnimationStyles } from "@/components/ui/animations";
import { AttachmentsGrid } from "@/features/slips/components/AttachmentsGrid";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import { parseAuditTrail } from "@/utils/auditTrail";
import { formatDate } from "@/utils";

export default function SlipDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: slip, isLoading, isError } = useGetSlipById(id || "");
  const { data: attachments = [] } = useGetSlipAttachments(id || "");

  const auditEntries = useMemo(() => {
    return parseAuditTrail(slip?.adminNotes);
  }, [slip?.adminNotes]);

  const getStatusColor = (statusName?: string) => {
    const key = getStatusColorKey(statusName);
    return STATUS_COLORS[key] || "bg-muted text-muted-foreground";
  };

  const pageHeaderActions = useMemo(
    () => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/student/slips")}
        className={cn(
          "h-9 gap-1.5 rounded-xl border-border/80 text-xs font-semibold",
        )}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Slips
      </Button>
    ),
    [navigate],
  );

  usePageMetadata(
    useMemo(
      () => ({
        title: "Admission Slip Details",
        description:
          "Detailed view of your submitted slip and counselor feedback.",
        badgeText: slip?.status?.name || "Loading",
        badgeIcon: <FileCheck className="h-4 w-4" />,
        headerActions: pageHeaderActions,
        isLoading: isLoading,
      }),
      [slip?.status?.name, pageHeaderActions, isLoading],
    ),
  );

  const handleEdit = () => {
    if (!id) return;
    navigate(`/student/slips/edit/${id}`);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Admission slip not found</h2>
        <Button
          variant="link"
          onClick={() => navigate("/student/slips")}
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

  const isEditable = slip?.status?.name === "For Revision";

  const absenceDate = slip?.dateOfAbsence
    ? new Date(slip.dateOfAbsence)
    : null;
  const monthStr = absenceDate
    ? absenceDate.toLocaleDateString("en-US", { month: "short" })
    : "—";
  const dayStr = absenceDate
    ? absenceDate.toLocaleDateString("en-US", { day: "numeric" })
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
            {/* Calendar Block (Date of Absence) */}
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
                  {slip?.category?.name || "Excuse Slip"}
                </Badge>

                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 py-0.5 text-[10px] font-bold uppercase",
                    "tracking-wider",
                    getStatusColor(slip?.status?.name),
                  )}
                >
                  {slip?.status?.name || "Unknown"}
                </Badge>
              </div>

              <h2
                className={cn(
                  "text-lg font-bold tracking-tight text-foreground",
                  "sm:text-xl",
                )}
              >
                Absence on{" "}
                {absenceDate
                  ? formatDate(absenceDate)
                  : "Date TBD"}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  • Needed:{" "}
                </span>
                <span className="font-mono text-primary">
                  {slip?.dateNeeded ? formatDate(slip.dateNeeded) : "TBD"}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:self-center">
            {isEditable && (
              <Button
                size="sm"
                onClick={handleEdit}
                className="h-9 gap-1.5 rounded-xl font-semibold shadow-sm"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Edit and Resubmit
              </Button>
            )}
          </div>
        </div>

        {/* 2-Column Balanced Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content (2 Cols) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Slip Overview */}
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
                  Absence Information
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
                    <Calendar
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    />
                    <div>
                      <p
                        className={cn(
                          "text-[11px] font-semibold text-muted-foreground",
                        )}
                      >
                        Date of Absence
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs font-semibold text-foreground",
                        )}
                      >
                        {formatDate(slip?.dateOfAbsence || "")}
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex items-start gap-3 rounded-xl border",
                      "border-border/60 bg-muted/20 p-3.5",
                    )}
                  >
                    <Clock
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    />
                    <div>
                      <p
                        className={cn(
                          "text-[11px] font-semibold text-muted-foreground",
                        )}
                      >
                        Date Needed
                      </p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs font-semibold text-foreground",
                        )}
                      >
                        {formatDate(slip?.dateNeeded || "")}
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
                    Reason Provided
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
                      "{slip?.reason || "No explanation provided."}"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supporting Documents */}
            <Card
              className={cn(
                "rounded-2xl border border-border/80 bg-card shadow-sm",
              )}
            >
              <CardHeader className="border-b border-border/60 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle
                    className={cn(
                      "flex items-center gap-2 text-xs font-bold uppercase",
                      "tracking-wider text-muted-foreground",
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Supporting Documents
                  </CardTitle>
                  <span
                    className={cn(
                      "text-xs font-medium text-muted-foreground",
                    )}
                  >
                    {attachments.length} files attached
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <AttachmentsGrid
                  slipId={id || ""}
                  files={attachments}
                />
              </CardContent>
            </Card>

            {/* Audit Trail / Guidance Feedback */}
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
                    Guidance Feedback & Activity Log
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
                                    .includes("COMPLETED")
                                ? "border-emerald-500 bg-background"
                                : entry.status
                                      .toUpperCase()
                                      .includes("REJECTED") ||
                                    entry.status
                                      .toUpperCase()
                                      .includes("REVISION")
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
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar (1 Col): Ticket Pass & Metadata */}
          <div className="space-y-6">
            {/* Ticket Card if approved */}
            {slip?.ticket ? (
              <Card
                className={cn(
                  "overflow-hidden rounded-2xl border border-border/80",
                  "bg-card shadow-sm",
                )}
              >
                <CardHeader
                  className={cn(
                    "border-b border-border/60 bg-muted/20 p-4",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center",
                          "rounded-lg bg-primary/10 text-primary",
                        )}
                      >
                        <Ticket className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-sm font-bold">
                        Claiming Ticket
                      </CardTitle>
                    </div>

                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-xl px-2 py-0.5 text-[9px] font-bold",
                        "uppercase",
                        slip.ticket.isVerified
                          ? STATUS_COLORS.success
                          : STATUS_COLORS.warning,
                      )}
                    >
                      {slip.ticket.isVerified ? (
                        <ShieldCheck className="mr-1 h-3 w-3" />
                      ) : (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {slip.ticket.isVerified ? "Verified" : "Pending Claim"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4 text-center">
                  <div
                    className={cn(
                      "flex flex-col items-center rounded-xl border",
                      "border-border/60 bg-muted/20 p-4",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-xl border border-border/60 bg-white p-3",
                        "shadow-sm",
                      )}
                    >
                      <QRCodeSVG
                        value={slip.ticket.ticketCode}
                        size={140}
                        level="H"
                        aria-label="Admission slip ticket QR code"
                      />
                    </div>

                    <p
                      className={cn(
                        "mt-3 text-[10px] font-bold uppercase",
                        "tracking-wider text-muted-foreground",
                      )}
                    >
                      Ticket Code
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-mono text-xl font-bold tracking-tight",
                        "text-foreground",
                      )}
                    >
                      {slip.ticket.ticketCode}
                    </p>
                  </div>

                  <p
                    className={cn(
                      "text-[11px] leading-relaxed text-muted-foreground",
                    )}
                  >
                    Present this QR code or ticket code at the Guidance Office
                    along with your physical documents to claim your official
                    slip.
                  </p>
                </CardContent>
              </Card>
            ) : (
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
                    Claiming Procedure
                  </CardTitle>
                </CardHeader>
                <CardContent
                  className={cn(
                    "space-y-2.5 pt-4 text-xs leading-relaxed",
                    "text-muted-foreground",
                  )}
                >
                  <p>
                    • Once approved by guidance counselors, a digital Claiming
                    Ticket with a unique QR code will appear here.
                  </p>
                  <p>
                    • Prepare original hardcopies of medical certificates or
                    excuse letters for verification upon claiming.
                  </p>
                </CardContent>
              </Card>
            )}

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
                      getStatusColor(slip?.status?.name),
                    )}
                  >
                    {slip?.status?.name || "Unknown"}
                  </Badge>
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between border-t",
                    "border-border/50 pt-2",
                  )}
                >
                  <span className="text-muted-foreground">Submitted On</span>
                  <span className="font-medium text-foreground">
                    {slip?.createdAt
                      ? formatDate(slip.createdAt)
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
                    #{slip?.id}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}


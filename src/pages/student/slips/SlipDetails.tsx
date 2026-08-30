import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useGetSlipById, useGetSlipAttachments } from "@/features/slips/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileText,
  AlertCircle,
  MessageSquare,
  FileCheck,
  Edit2,
  Clock,
  Ticket,
  ShieldCheck,
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

  usePageMetadata(
    useMemo(
      () => ({
        title: "Admission Slip Details",
        description:
          "Detailed view of your submitted slip and counselor feedback.",
        badgeText: slip?.status?.name || "Loading",
        badgeIcon: <FileCheck className="h-4 w-4" />,
        isLoading: isLoading,
      }),
      [slip?.status?.name, isLoading],
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
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="space-y-2"
                    >
                      <div
                        className={cn(
                          "h-3 w-24 rounded bg-slate-200/50",
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
                  <div className="space-y-2 sm:col-span-2">
                    <div
                      className={cn(
                        "h-3 w-16 rounded bg-slate-200/50",
                        "dark:bg-slate-700/50",
                      )}
                    />
                    <div
                      className={cn(
                        "h-5 w-24 rounded bg-slate-200/50",
                        "dark:bg-slate-700/50",
                      )}
                    />
                  </div>
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
                    "h-20 w-full rounded bg-slate-200/50",
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

  const isEditable = slip?.status?.name === "For Revision";

  return (
    <>
      <AnimationStyles />
      <div className="min-h-full bg-background">
        <div className="pb-20">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Left Column: Essential Info */}
            <div className="space-y-6 md:col-span-2">
              <Card className="border-0 bg-card/60 shadow-lg backdrop-blur-md">
                <CardHeader className="border-b border-border/60 pb-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">Slip Overview</CardTitle>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {slip?.category && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-white/45 bg-white/40 px-3 py-1",
                            "backdrop-blur-xl dark:border-white/10",
                            "dark:bg-white/[0.05]",
                          )}
                        >
                          {slip.category.name}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-3 py-1",
                          getStatusColor(slip?.status?.name),
                        )}
                      >
                        {slip?.status?.name}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Date of Absence
                      </p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatDate(slip?.dateOfAbsence || "")}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Date Needed
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatDate(slip?.dateNeeded || "")}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        Category
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {slip?.category?.name || "General"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      Reason provided
                    </p>
                    <div className="rounded-lg border border-border/40 bg-muted/50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                        {slip?.reason}
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
                      Guidance Feedback / Audit Trail
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
                                      .includes("COMPLETED")
                                  ? "border-emerald-500 bg-background shadow-sm"
                                  : entry.status
                                        .toUpperCase()
                                        .includes("REJECTED") ||
                                      entry.status
                                        .toUpperCase()
                                        .includes("REVISION")
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
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="border-0 bg-muted/20 shadow-md">
                <CardHeader className="border-b border-border/40 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">
                        Supporting Documents
                      </CardTitle>
                    </div>
                    <span className="text-xs text-muted-foreground">
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
            </div>

            {/* Right Column: Status & Timeline */}
            <div className="space-y-6">
              {slip?.ticket && (
                <Card className="overflow-hidden border border-border bg-card shadow-md">
                  <CardHeader className="border-b border-border/60 bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Ticket className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-bold">
                            Admission Slip Ticket
                          </CardTitle>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Present this when claiming your approved slip.
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-xl px-2.5 py-1 text-[9px] font-bold uppercase",
                          slip.ticket.isVerified
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                        )}
                      >
                        {slip.ticket.isVerified ? (
                          <ShieldCheck className="mr-1 h-3 w-3" />
                        ) : (
                          <Clock className="mr-1 h-3 w-3" />
                        )}
                        {slip.ticket.isVerified ? "Verified" : "Pending"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-col items-center rounded-xl border border-border/60 bg-muted/20 p-4 text-center">
                      <div className="rounded-xl border border-border/60 bg-white p-3 shadow-sm">
                        <QRCodeSVG
                          value={slip.ticket.ticketCode}
                          size={144}
                          level="H"
                          aria-label="Admission slip ticket QR code"
                        />
                      </div>

                      <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Ticket Code
                      </p>
                      <p className="mt-1 break-all font-mono text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                        {slip.ticket.ticketCode}
                      </p>
                    </div>

                    {slip.ticket.isVerified ? (
                      <div
                        className={cn(
                          "rounded-xl border border-emerald-500/25 bg-emerald-500/5",
                          "p-3 text-[11px] leading-relaxed text-emerald-800",
                          "dark:text-emerald-200",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <div>
                            <p className="font-bold">Ticket verified</p>
                            <p className="mt-0.5">
                              This ticket has already been verified by the
                              Guidance Office.
                            </p>
                            {slip.ticket.verifiedAt && (
                              <p className="mt-1 text-[10px] opacity-80">
                                Verified on {formatDate(slip.ticket.verifiedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={cn(
                            "rounded-xl border border-amber-500/25 bg-amber-500/5",
                            "p-3 text-[11px] leading-relaxed text-amber-800",
                            "dark:text-amber-200",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <div>
                              <p className="font-bold">Bring your hardcopies</p>
                              <p className="mt-0.5">
                                Present the physical copies of your uploaded
                                supporting documents when claiming your printed
                                admission slip in the Guidance Office.
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="text-center text-[10px] leading-relaxed text-muted-foreground">
                          Show either the QR code or ticket code to the guidance
                          counselor for on-site verification.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {isEditable && (
                <Card className="border-primary/20 bg-primary/5 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Edit2 className="h-4 w-4" />
                      <CardTitle className="text-sm">Action Required</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Councilors requested changes to this slip. You can update
                      the reason or re-upload documents to resolve technical
                      issues.
                    </p>
                    <Button
                      className="w-full gap-2"
                      onClick={handleEdit}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit and Resubmit
                    </Button>
                  </CardContent>
                </Card>
              )}

              <div className="px-2">
                <p className="text-[10px] text-muted-foreground">
                  Requested At
                </p>
                <p className="break-all font-mono text-[10px]">
                  {formatDate(slip?.createdAt)}
                </p>

                <p className="text-[10px] text-muted-foreground">
                  Reference ID
                </p>
                <p className="break-all font-mono text-[10px]">{slip?.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useParams, useNavigate } from "react-router-dom";
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
import { format } from "date-fns";
import { AttachmentsGrid } from "@/features/slips/components/AttachmentsGrid";
import { cn } from "@/lib/utils";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";

export default function SlipDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: slip, isLoading, isError } = useGetSlipById(id || "");
  const { data: attachments = [] } = useGetSlipAttachments(id || "");

  const getStatusColor = (statusName?: string) => {
    const key = getStatusColorKey(statusName);
    return STATUS_COLORS[key] || "bg-muted text-muted-foreground";
  };

  usePageMetadata({
    title: "Admission Slip Details",
    description:
      "Detailed view of your submitted admission slip and counselor feedback.",
    badgeText: slip?.status?.name || "Loading",
    badgeIcon: <FileCheck className="h-4 w-4" />,
    isLoading: isLoading,
  });

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
                  <div className="flex items-center justify-between">
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
                            "px-3 py-1 border-white/45 bg-white/40",
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
                          {slip?.dateOfAbsence
                            ? format(
                                new Date(slip.dateOfAbsence),
                                "MMMM d, yyyy",
                              )
                            : "---"}
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
                          {slip?.dateNeeded
                            ? format(new Date(slip.dateNeeded), "MMMM d, yyyy")
                            : "---"}
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
                      <p className="whitespace-pre-wrap text-sm italic leading-relaxed text-foreground/80">
                        "{slip?.reason}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {slip?.adminNotes && (
                <Card className="border-border/60 bg-amber-50/10 shadow-md dark:bg-amber-950/5">
                  <CardHeader className="border-b border-border/30 py-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-amber-500" />
                      <CardTitle className="text-sm">
                        Guidance Feedback
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="py-5">
                    <p className="text-sm font-medium leading-relaxed text-foreground/90">
                      {slip.adminNotes}
                    </p>
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
                <Card
                  className={cn(
                    "border-2 border-dashed transition-all duration-500 hover:shadow-lg",
                    slip.ticket.isVerified
                      ? "border-green-500/30 bg-green-500/5"
                      : "border-primary/30 bg-primary/5",
                  )}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Ticket className="h-4 w-4" />
                      <CardTitle className="text-sm">
                        Admission Slip Ticket
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center justify-center rounded-xl bg-background/50 py-6 text-center shadow-inner">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Your Ticket Code
                      </p>
                      <p className="font-mono text-3xl tracking-tighter text-foreground">
                        {slip.ticket.ticketCode}
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-3 py-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        Status
                      </span>
                      <div className="flex items-center gap-1.5">
                        {slip.ticket.isVerified ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            VERIFIED
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                            <Clock className="h-3.5 w-3.5" />
                            PENDING
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-center text-[9px] italic leading-relaxed text-muted-foreground">
                      Present this code to the guidance counselor to claim your
                      printed admission slip.
                    </p>
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

              <Card className="border-0 bg-muted/40 shadow-md backdrop-blur-sm">
                <CardHeader className="border-b border-border/40 pb-3">
                  <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <div className="h-10 w-0.5 bg-border" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Submitted</p>
                      <p className="text-[10px] text-muted-foreground">
                        {slip?.createdAt
                          ? format(
                              new Date(slip.createdAt),
                              "MMM d, yyyy · h:mm a",
                            )
                          : "---"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-2 w-2 rounded-full ${slip?.updatedAt !== slip?.createdAt ? "bg-primary" : "bg-muted"}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Last Activity</p>
                      <p className="text-[10px] text-muted-foreground">
                        {slip?.updatedAt
                          ? format(
                              new Date(slip.updatedAt),
                              "MMM d, yyyy · h:mm a",
                            )
                          : "---"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="px-2">
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

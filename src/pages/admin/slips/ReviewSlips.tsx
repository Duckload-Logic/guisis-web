import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  Clock3,
  FileText,
  XCircle,
  Ticket,
  ShieldCheck,
  User,
  Calendar,
  Clock,
} from "lucide-react";

import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FormInput } from "@/components/form";
import { useToast } from "@/context";

import {
  useGetSlipStats,
  useGetSlipStatuses,
  useSlips,
  useClaimTicket,
} from "@/features/slips/hooks";
import { GetTicketDetails } from "@/features/slips/services";
import type { Slip, SlipStatus } from "@/features/slips/types";
import { SlipList } from "@/features/slips/components";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { getDateRange, getFilterLabel, type TimeFilter } from "@/utils";
import { usePageMetadata } from "@/context";

type SortOrder = "asc" | "desc";

const SLIP_SORT_OPTIONS = [
  { id: "dateNeeded", name: "Nearest date needed" },
  { id: "dateOfAbsence", name: "Date of absence" },
  { id: "createdAt", name: "Date submitted" },
];

const SORT_ORDER_OPTIONS: { id: SortOrder; name: string }[] = [
  { id: "asc", name: "Ascending" },
  { id: "desc", name: "Descending" },
];

export default function ReviewSlips() {
  const navigate = useNavigate();

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState("dateNeeded");
  const [selectedOrder, setSelectedOrder] = useState<SortOrder>("asc");
  const [ticketCode, setTicketCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingSlip, setPendingSlip] = useState<Slip | null>(null);
  const [showAlreadyVerified, setShowAlreadyVerified] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const { triggerToast } = useToast();

  const debouncedSearch = useDebounce(searchTerm, 500);
  const dateRange = useMemo(() => getDateRange(timeFilter), [timeFilter]);

  const { data: slipStats, isLoading: isStatsLoading } = useGetSlipStats({
    params: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    },
  });

  const { data: slipStatuses, isLoading: isStatusesLoading } =
    useGetSlipStatuses();

  const statusWithAll = useMemo(() => {
    if (!slipStatuses) return [];
    return [
      { id: "0", name: "All Statuses", colorKey: "stale" },
      ...slipStatuses,
    ];
  }, [slipStatuses]);

  const [selectedStatus, setSelectedStatus] = useState<SlipStatus>({
    id: "0",
    name: "All Statuses",
    colorKey: "stale",
  } as any);

  const { data, isLoading } = useSlips({
    isAdmin: true,
    params: {
      page: currentPage,
      search: debouncedSearch,
      statusId:
        String(selectedStatus?.id) === "0" ? undefined : selectedStatus?.id,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      sortBy: selectedSort,
      sortOrder: selectedOrder,
    },
  });

  const slips = data?.slips || [];
  const totalPages = data?.totalPages || 1;

  const claimTicketMutation = useClaimTicket();

  const handleClaimTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;

    setIsVerifying(true);
    try {
      const slip = await GetTicketDetails(ticketCode, {
        handlerName: "ReviewSlips",
        stepName: "Fetch Ticket Details",
      });

      if (slip.ticket?.isVerified) {
        setShowAlreadyVerified(true);
      } else {
        setPendingSlip(slip);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setShowNotFound(true);
      } else {
        triggerToast(error.message || "Failed to fetch ticket details");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const confirmClaim = async () => {
    if (!pendingSlip?.ticket?.ticketCode) return;

    const slipId = pendingSlip.id;

    try {
      await claimTicketMutation.mutateAsync(pendingSlip.ticket.ticketCode);
      triggerToast("✓ Ticket verified successfully!");
      setTicketCode("");
      setPendingSlip(null);
      if (slipId) {
        navigate(`/admin/slips/${slipId}`);
      }
    } catch (error: any) {
      triggerToast(error.message || "Failed to verify ticket");
    }
  };

  const handleViewSlip = (slip: Slip) => {
    navigate(`/admin/slips/${slip.id}`);
  };

  const isPageLoading = isStatusesLoading;

  const headerActions = useMemo(
    () => (
      <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        {(["today", "week", "month"] as TimeFilter[]).map((filter) => (
          <Button
            key={filter}
            variant={timeFilter === filter ? "default" : "outline"}
            onClick={() => {
              setTimeFilter(filter);
              setCurrentPage(1);
            }}
            className="h-10 min-w-[100px] rounded-xl px-4 shadow-sm"
          >
            {getFilterLabel(filter)}
          </Button>
        ))}

        <Button
          variant="outline"
          onClick={() => navigate("/admin/slips/logs")}
          className="h-10 gap-2 rounded-xl px-4 shadow-sm"
        >
          <Archive className="h-4 w-4" />
          View All Logs
        </Button>
      </div>
    ),
    [timeFilter, navigate],
  );

  usePageMetadata({
    title: "Review Admission Slips",
    description:
      "Review submissions, filter the queue, and process student requests.",
    badgeText: "Slip Management",
    badgeIcon: useMemo(() => <FileText className="h-4 w-4" />, []),
    isLoading: isPageLoading,
    headerActions,
  });

  return (
    <>
      <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 py-2 duration-300">
        <Card className="overflow-hidden border-glass-border/40 bg-glass-bg/20 shadow-md backdrop-blur-2xl transition-all duration-500">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary shadow-inner">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                    On-Site Ticket
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Enter the ticket code to verify a student slip.
                  </p>
                </div>
              </div>

              <form
                onSubmit={handleClaimTicket}
                className="flex w-full flex-col gap-2 sm:flex-row md:max-w-md"
              >
                <FormInput
                  placeholder="Ticket code"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
                  className="h-10 rounded-xl border-glass-border/40 bg-glass-bg/40 focus:bg-glass-bg/60"
                  label={""}
                />

                <Button
                  type="submit"
                  disabled={
                    isVerifying ||
                    claimTicketMutation.isPending ||
                    !ticketCode.trim()
                  }
                  className="h-10 gap-2 rounded-xl bg-primary px-4 text-sm font-bold shadow-md shadow-primary/15 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {isVerifying || claimTicketMutation.isPending ? (
                    <Clock3 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Verify
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <SlipList
          slips={slips}
          isLoading={isLoading}
          onViewClick={handleViewSlip}
          searchTerm={searchTerm}
          onSearchChange={(value: string) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          statuses={statusWithAll as any}
          selectedStatus={selectedStatus as any}
          statusCounts={slipStats || []}
          onStatusChange={(status: SlipStatus) => {
            setSelectedStatus(status);
            setCurrentPage(1);
          }}
          sortOptions={SLIP_SORT_OPTIONS}
          selectedSort={selectedSort}
          onSortChange={(sortValue: string) => {
            setSelectedSort(sortValue);
            setCurrentPage(1);
          }}
          orderOptions={SORT_ORDER_OPTIONS}
          selectedOrder={selectedOrder}
          onOrderChange={(orderValue: SortOrder) => {
            setSelectedOrder(orderValue);
            setCurrentPage(1);
          }}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          totalPages={totalPages}
        />
      </div>

      <AlertDialog
        open={!!pendingSlip}
        onOpenChange={(open) => !open && setPendingSlip(null)}
      >
        <AlertDialogContent className="border-glass-border/40 max-w-md bg-background/80 shadow-2xl backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Ticket className="h-5 w-5" />
              </div>
              Confirm Ticket Verification
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
              Please review the slip details below before marking it as
              verified.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingSlip && (
            <div className="border-glass-border/30 bg-glass-bg/20 my-4 space-y-4 rounded-2xl border p-5 shadow-inner">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground/60">
                    Student Name
                  </p>
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <User className="h-3.5 w-3.5 text-primary/60" />
                    {pendingSlip.user?.firstName} {pendingSlip.user?.lastName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground/60">
                    Category
                  </p>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2 py-0 text-[10px]"
                  >
                    {pendingSlip.category?.name}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground/60">
                    Date of Absence
                  </p>
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-primary/60" />
                    {pendingSlip.dateOfAbsence
                      ? format(
                          new Date(pendingSlip.dateOfAbsence),
                          "MMM d, yyyy",
                        )
                      : "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground/60">
                    Date Needed
                  </p>
                  <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Clock className="h-3.5 w-3.5 text-primary/60" />
                    {pendingSlip.dateNeeded
                      ? format(new Date(pendingSlip.dateNeeded), "MMM d, yyyy")
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <p className="text-[10px] font-bold uppercase text-muted-foreground/60">
                  Reason
                </p>
                <div className="border-glass-border/20 rounded-xl border bg-muted/30 p-3 shadow-sm">
                  <p className="line-clamp-3 text-xs italic leading-relaxed text-foreground/80">
                    "{pendingSlip.reason}"
                  </p>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="gap-3 sm:gap-0">
            <AlertDialogCancel className="rounded-xl font-bold transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClaim}
              disabled={claimTicketMutation.isPending}
              className="rounded-xl bg-primary px-8 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              {claimTicketMutation.isPending ? (
                <Clock3 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="mr-2 h-4 w-4" />
              )}
              Confirm & Verify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showAlreadyVerified}
        onOpenChange={setShowAlreadyVerified}
      >
        <AlertDialogContent className="max-w-sm backdrop-blur-2xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold">
              Already Verified
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm font-medium text-muted-foreground">
              This ticket has already been verified and claimed. No further
              action is required.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="w-full rounded-xl bg-blue-600 font-bold hover:bg-blue-700">
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showNotFound}
        onOpenChange={setShowNotFound}
      >
        <AlertDialogContent className="max-w-sm backdrop-blur-2xl">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <XCircle className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-center text-xl font-bold">
              Ticket Not Found
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-sm font-medium text-muted-foreground">
              We couldn't find any admission slip matching the ticket code you
              entered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="w-full rounded-xl bg-red-600 font-bold hover:bg-red-700">
              Try Again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


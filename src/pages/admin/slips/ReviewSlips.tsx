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
import { cn } from "@/lib/utils";
import { API_ROUTES } from "@/config/apiRoutes";

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
    <div className="animate-in fade-in duration-500 mx-auto flex w-full flex-col space-y-6 py-2 px-4 sm:px-6 md:px-8">

      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-white p-5 shadow-sm",
          "dark:border-white/10 dark:bg-neutral-950/40",
          "animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
        )}
        style={{ animationDelay: "50ms" }}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
              <Ticket className="h-6 w-6" />
            </div>

            <div>
              <h3 className="text-base font-bold tracking-tight">
                On-Site Ticket
              </h3>

              <p className="text-sm text-muted-foreground">
                Enter the ticket code to verify a student slip.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleClaimTicket}
            className="flex w-full max-w-md items-center gap-3"
          >
            <input
              id="ticket-code-input"
              type="text"
              placeholder="Ticket code"
              value={ticketCode}
              onChange={(e) =>
                setTicketCode(e.target.value.toUpperCase())
              }
              className="
                h-12
                flex-1
                rounded-xl
                border
                border-border
                bg-background
                px-4
                text-sm
                transition-all
                outline-none
                focus:border-primary
                focus:ring-2
                focus:ring-primary/20
                dark:bg-white/5
              "
            />

            <Button
              type="submit"
              disabled={
                isVerifying ||
                claimTicketMutation.isPending ||
                !ticketCode.trim()
              }
              className="h-12 shrink-0 gap-2 rounded-xl bg-[#8f1113] px-6 font-semibold shadow-md transition-all hover:scale-[1.02] hover:bg-[#6a0d0d] active:scale-95"
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
      </div>

      <SlipList
        className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both [animation-delay:150ms]"
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
        exportEndpoint={API_ROUTES.slips.all}
        exportParams={{
          search: debouncedSearch,
          statusId:
            String(selectedStatus?.id) === "0" ? undefined : selectedStatus?.id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          sortBy: selectedSort,
          sortOrder: selectedOrder,
        }}
      />

      <AlertDialog
        open={!!pendingSlip}
        onOpenChange={(open) => !open && setPendingSlip(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Verify Admission Slip
            </AlertDialogTitle>

            <AlertDialogDescription>
              Are you sure you want to verify this ticket? This will
              assign the admission slip to you for processing.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                {pendingSlip?.user
                  ? `${pendingSlip.user.firstName} ${pendingSlip.user.lastName}`
                  : pendingSlip?.studentNumber || "-"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {pendingSlip?.dateOfAbsence
                  ? format(new Date(pendingSlip.dateOfAbsence), "MMMM dd, yyyy")
                  : "-"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {pendingSlip?.dateNeeded
                  ? format(new Date(pendingSlip.dateNeeded), "MMMM dd, yyyy")
                  : "-"}
              </span>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction onClick={confirmClaim}>
              Verify Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showAlreadyVerified}
        onOpenChange={setShowAlreadyVerified}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ticket Already Verified
            </AlertDialogTitle>

            <AlertDialogDescription>
              This ticket has already been verified and cannot be used
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Not Found */}
      <AlertDialog
        open={showNotFound}
        onOpenChange={setShowNotFound}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Ticket Not Found
            </AlertDialogTitle>

            <AlertDialogDescription>
              The ticket code you entered could not be found. Please
              check the code and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

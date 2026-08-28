import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  Clock3,
  FileText,
  Ticket,
  ShieldCheck,
  User,
  Calendar,
  Clock,
  Camera,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context";

import {
  useGetSlipStats,
  useGetSlipStatuses,
  useGetSlipCategories,
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
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<SlipStatus>({
    id: "0",
    name: "All Statuses",
    colorKey: "stale",
  } as any);

  const [ticketCode, setTicketCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const { triggerToast } = useToast();

  const [activeTab, setActiveTab] = useState<"qr" | "manual">("qr");
  const [isScanning, setIsScanning] = useState(false);
  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const [manualCode, setManualCode] = useState("");

  const debouncedSearch = useDebounce(searchTerm, 500);
  const dateRange = useMemo(() => getDateRange(timeFilter), [timeFilter]);

  const { data: slipStats } = useGetSlipStats({
    params: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      categoryId:
        selectedCategory === "all" ? undefined : selectedCategory,
    },
  });

  const { data: slipStatuses, isLoading: isStatusesLoading } =
    useGetSlipStatuses();

  const { data: slipCategories } = useGetSlipCategories();

  const statusWithAll = useMemo(() => {
    if (!slipStatuses) return [];
    return [
      { id: "0", name: "All Statuses", colorKey: "stale" },
      ...slipStatuses,
    ];
  }, [slipStatuses]);

  const { data, isLoading } = useSlips({
    isAdmin: true,
    params: {
      page: currentPage,
      search: debouncedSearch,
      statusId:
        String(selectedStatus?.id) === "0" ? undefined : selectedStatus?.id,
      categoryId:
        selectedCategory === "all" ? undefined : selectedCategory,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      sortBy: selectedSort,
      sortOrder: selectedOrder,
    },
  });

  const slips = data?.slips || [];
  const totalPages = data?.totalPages || 1;

  const verifyTicketByCode = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    let finalCode = cleanCode;
    if (cleanCode.length === 6) {
      finalCode = `SLIP-${cleanCode}`;
    }
    if (!finalCode) return;

    setIsVerifying(true);
    try {
      const slip = await GetTicketDetails(finalCode, {
        handlerName: "ReviewSlips",
        stepName: "Fetch Ticket Details",
      });

      if (slip.id) {
        navigate(`/admin/slips/${slip.id}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setShowNotFound(true);
      } else {
        triggerToast(
          error.message || "Failed to fetch ticket details",
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    try {
      if (qrReaderRef.current) {
        await qrReaderRef.current.stop().catch(() => {});
      }

      const html5QrCode = new Html5Qrcode("qr-reader-viewport");
      qrReaderRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
        },
        async (decodedText) => {
          await html5QrCode.stop().catch(() => {});
          setIsScanning(false);
          verifyTicketByCode(decodedText);
        },
        () => {},
      );
    } catch (err: any) {
      console.error("Scanner start error:", err);
      triggerToast("Failed to access camera. Check permissions.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (qrReaderRef.current && qrReaderRef.current.isScanning) {
      await qrReaderRef.current.stop().catch(() => {});
    }
    setIsScanning(false);
  };

  useEffect(() => {
    if (activeTab !== "qr") {
      stopScanner();
    }
    return () => {
      if (qrReaderRef.current && qrReaderRef.current.isScanning) {
        qrReaderRef.current.stop().catch(() => {});
      }
    };
  }, [activeTab]);

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

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scanner-line {
          animation: scan 2.5s linear infinite;
        }
      `}</style>

      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-white p-5 shadow-sm",
          "dark:border-white/10 dark:bg-neutral-950/40",
          "animate-in fade-in slide-in-from-bottom-4 duration-500",
          "fill-mode-both",
        )}
        style={{ animationDelay: "50ms" }}
      >
        <div className="flex flex-col gap-6">
          {/* Header Area */}
          <div
            className={cn(
              "flex flex-col gap-4 md:flex-row md:items-center",
              "md:justify-between border-b border-border/50 pb-4",
            )}
          >
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center",
                  "rounded-xl bg-primary/10 text-primary shadow-inner",
                )}
              >
                <Ticket className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">
                  On-Site Verification
                </h3>
                <p className="text-sm text-muted-foreground">
                  Verify student tickets to process admission slips.
                </p>
              </div>
            </div>

            {/* Tab Switched Header */}
            <div
              className={cn(
                "flex rounded-xl bg-muted/60 p-1 border border-border/40",
                "self-start md:self-auto",
              )}
            >
              <button
                onClick={() => setActiveTab("qr")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2",
                  "text-xs font-bold transition-all",
                  activeTab === "qr"
                    ? "bg-white text-primary shadow-sm dark:bg-neutral-800"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Camera className="h-3.5 w-3.5" />
                QR Scanner
              </button>
              <button
                onClick={() => setActiveTab("manual")}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2",
                  "text-xs font-bold transition-all",
                  activeTab === "manual"
                    ? "bg-white text-primary shadow-sm dark:bg-neutral-800"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Ticket className="h-3.5 w-3.5" />
                Manual Fallback
              </button>
            </div>
          </div>

          {/* Active Tab Panel */}
          {activeTab === "qr" ? (
            <div className="flex flex-col items-center py-2">
              <div
                className={cn(
                  "relative mx-auto aspect-square w-full max-w-[280px]",
                  "overflow-hidden rounded-2xl border border-border",
                  "bg-neutral-950 shadow-inner flex items-center justify-center",
                )}
              >
                <div id="qr-reader-viewport" className="h-full w-full" />
                {isScanning && (
                  <>
                    <div
                      className={cn(
                        "absolute left-4 top-4 h-6 w-6",
                        "border-l-4 border-t-4 border-primary rounded-tl",
                      )}
                    />
                    <div
                      className={cn(
                        "absolute right-4 top-4 h-6 w-6",
                        "border-r-4 border-t-4 border-primary rounded-tr",
                      )}
                    />
                    <div
                      className={cn(
                        "absolute left-4 bottom-4 h-6 w-6",
                        "border-l-4 border-b-4 border-primary rounded-bl",
                      )}
                    />
                    <div
                      className={cn(
                        "absolute right-4 bottom-4 h-6 w-6",
                        "border-r-4 border-b-4 border-primary rounded-br",
                      )}
                    />
                    <div
                      className={cn(
                        "scanner-line absolute left-4 right-4 h-0.5",
                        "bg-primary/70",
                        "shadow-[0_0_8px_rgba(239,68,68,0.8)]",
                      )}
                    />
                  </>
                )}
                {!isScanning && (
                  <div
                    className={cn(
                      "absolute inset-0 flex flex-col items-center",
                      "justify-center p-6 text-center bg-muted/10",
                      "backdrop-blur-sm",
                    )}
                  >
                    <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
                      <Camera className="h-6 w-6 animate-pulse" />
                    </div>
                    <p className="text-sm font-bold text-foreground">
                      Camera Scanner Ready
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-[180px]">
                      Present the student's QR code to scan.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex w-full justify-center">
                {isScanning ? (
                  <Button
                    onClick={stopScanner}
                    variant="outline"
                    className="h-10 rounded-xl gap-2 px-6"
                  >
                    Stop Scanner
                  </Button>
                ) : (
                  <Button
                    onClick={startScanner}
                    disabled={isVerifying}
                    className="h-10 gap-2 rounded-xl bg-primary px-6"
                  >
                    <Camera className="h-4 w-4" />
                    Start Camera Scanner
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-md py-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  verifyTicketByCode(manualCode);
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-12 items-center rounded-xl bg-muted px-4",
                      "font-mono text-sm font-semibold border border-border",
                      "text-muted-foreground select-none",
                    )}
                  >
                    SLIP -
                  </div>
                  <input
                    type="text"
                    placeholder="XXXXXX"
                    value={manualCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      if (/^[A-Z0-9]{0,6}$/.test(val)) {
                        setManualCode(val);
                      }
                    }}
                    className={cn(
                      "h-12 flex-1 rounded-xl border border-border bg-background",
                      "px-4 font-mono text-lg tracking-widest uppercase transition-all",
                      "outline-none focus:border-primary focus:ring-2",
                      "focus:ring-primary/20 dark:bg-white/5",
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isVerifying || manualCode.length !== 6}
                  className={cn(
                    "h-12 w-full gap-2 rounded-xl bg-[#8f1113]",
                    "font-semibold shadow-md transition-all hover:scale-[1.01]",
                    "hover:bg-[#6a0d0d] active:scale-95",
                  )}
                >
                  {isVerifying ? (
                    <Clock3 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Verify Manual Ticket
                </Button>
              </form>
            </div>
          )}
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
        selectedCategory={selectedCategory}
        onCategoryChange={(cat) => {
          setSelectedCategory(cat);
          setCurrentPage(1);
        }}
        categories={slipCategories || []}
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
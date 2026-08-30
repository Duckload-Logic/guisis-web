import { useMemo, useState, useEffect, useRef } from "react";
import { useUrlState } from "@/hooks";
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
import { toISODateString } from "@/utils";
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
  const { mutateAsync: claimTicket } = useClaimTicket();

  const [searchTerm, setSearchTerm] = useUrlState("q", "");
  const [currentPage, setCurrentPage] = useUrlState("page", 1);
  const [selectedSort, setSelectedSort] = useUrlState("sort", "dateNeeded");
  const [selectedOrder, setSelectedOrder] = useUrlState<SortOrder>("order", "asc");
  const [selectedCategory, setSelectedCategory] = useUrlState<string>("category", "all");
  const [selectedStatus, setSelectedStatus] = useUrlState<SlipStatus>("status", {
    id: "0",
    name: "All Statuses",
    colorKey: "stale",
  } as any);

  const [isVerifying, setIsVerifying] = useState(false);
  const [showNotFound, setShowNotFound] = useState(false);
  const { triggerToast } = useToast();

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"qr" | "manual">("qr");
  const [isScanning, setIsScanning] = useState(false);
  const qrReaderRef = useRef<Html5Qrcode | null>(null);

  const [manualCodeParts, setManualCodeParts] = useState<string[]>(
    Array(6).fill(""),
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const codeString = useMemo(() => manualCodeParts.join(""), [manualCodeParts]);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const dateRange = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const daysRemaining = endOfMonth.getDate() - today.getDate();
    let endDate = endOfMonth;
    let isExtended = false;

    if (daysRemaining <= 7) {
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 7);
      isExtended = true;
    }

    return {
      startDate: toISODateString(startOfMonth),
      endDate: toISODateString(endDate),
      isExtended,
    };
  }, []);

  const { data: slipStats } = useGetSlipStats({
    params: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
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
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      sortBy: selectedSort,
      sortOrder: selectedOrder,
    },
  });

  const slips = useMemo(() => {
    const rawSlips = data?.slips || [];
    return rawSlips.filter((slip: Slip) => !slip.ticket?.isVerified);
  }, [data]);

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
        try {
          await claimTicket(finalCode);
          triggerToast("Ticket successfully verified!");
        } catch (claimErr: any) {
          const errMsg =
            claimErr.response?.data?.error || claimErr.message || "";
          if (errMsg.toLowerCase().includes("already verified")) {
            triggerToast("Ticket is already verified!");
          } else {
            throw claimErr;
          }
        }
        setIsVerifyModalOpen(false);
        navigate(`/admin/slips/${slip.id}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setShowNotFound(true);
      } else {
        const errMsg =
          error.response?.data?.error ||
          error.message ||
          "Failed to verify ticket";
        triggerToast(errMsg);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    try {
      if (qrReaderRef.current) {
        const prevScanner = qrReaderRef.current;
        if (prevScanner.isScanning) {
          await prevScanner.stop().catch(() => {});
        }
        qrReaderRef.current = null;
      }

      const html5QrCode = new Html5Qrcode("qr-reader-viewport");
      qrReaderRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
        },
        async (decodedText) => {
          if (html5QrCode.isScanning) {
            await html5QrCode.stop().catch(() => {});
          }
          setIsScanning(false);
          verifyTicketByCode(decodedText);
        },
        () => {},
      );
    } catch (err: any) {
      console.error("Scanner start error:", err);
      triggerToast("Failed to access camera. Check permissions.");
      setIsScanning(false);
      qrReaderRef.current = null;
    }
  };

  const stopScanner = async () => {
    if (qrReaderRef.current) {
      const currentScanner = qrReaderRef.current;
      if (currentScanner.isScanning) {
        await currentScanner.stop().catch(() => {});
      }
      qrReaderRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    let active = true;
    if (isVerifyModalOpen && activeTab === "qr") {
      const timer = setTimeout(() => {
        if (active) {
          startScanner();
        }
      }, 100);
      return () => {
        active = false;
        clearTimeout(timer);
        if (qrReaderRef.current) {
          const currentScanner = qrReaderRef.current;
          if (currentScanner.isScanning) {
            currentScanner.stop().catch(() => {});
          }
          qrReaderRef.current = null;
        }
      };
    } else {
      stopScanner();
    }
  }, [isVerifyModalOpen, activeTab]);

  const handleManualCodeChange = (index: number, value: string) => {
    const cleanVal = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleanVal) {
      const newParts = [...manualCodeParts];
      newParts[index] = "";
      setManualCodeParts(newParts);
      return;
    }

    const firstChar = cleanVal[0];
    const newParts = [...manualCodeParts];
    newParts[index] = firstChar;
    setManualCodeParts(newParts);

    if (index < 5 && firstChar) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace") {
      if (!manualCodeParts[index] && index > 0) {
        const newParts = [...manualCodeParts];
        newParts[index - 1] = "";
        setManualCodeParts(newParts);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newParts = [...manualCodeParts];
        newParts[index] = "";
        setManualCodeParts(newParts);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

    const newParts = [...manualCodeParts];
    for (let i = 0; i < 6; i++) {
      newParts[i] = pasteData[i] || "";
    }
    setManualCodeParts(newParts);

    const focusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeString.length === 6) {
      verifyTicketByCode(codeString);
    }
  };

  useEffect(() => {
    if (!isVerifyModalOpen) {
      setManualCodeParts(Array(6).fill(""));
    }
  }, [isVerifyModalOpen]);

  const handleViewSlip = (slip: Slip) => {
    navigate(`/admin/slips/${slip.id}`);
  };

  const isPageLoading = isStatusesLoading;

  const headerActions = useMemo(
    () => (
      <div
        className={cn(
          "flex flex-col gap-2.5 sm:flex-row",
          "sm:flex-wrap sm:items-center",
        )}
      >
        <Button
          variant="outline"
          onClick={() => navigate("/admin/slips/logs")}
          className="h-10 gap-2 rounded-xl px-4 shadow-sm"
        >
          <Archive className="h-4 w-4" />
          View All Logs
        </Button>

        <Button
          onClick={() => setIsVerifyModalOpen(true)}
          className={cn(
            "h-10 gap-2 rounded-xl bg-[#8f1113] hover:bg-[#6a0d0d]",
            "px-4 font-semibold text-white shadow-md",
          )}
        >
          <Ticket className="h-4 w-4" />
          Verify Ticket
        </Button>
      </div>
    ),
    [navigate],
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
    <div className="animate-in fade-in mx-auto flex w-full flex-col space-y-6 px-4 py-2 duration-500 sm:px-6 md:px-8">
      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scanner-line {
          animation: scan 2.5s linear infinite;
        }
        #qr-reader-viewport {
          border: none !important;
          width: 100% !important;
          height: 100% !important;
        }
        #qr-reader-viewport video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          transform: scaleX(-1);
        }
      `}</style>

      {dateRange.isExtended && (
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border",
            "border-amber-300/40 bg-amber-500/10 p-4",
            "text-amber-800 dark:text-amber-200",
            "animate-in fade-in slide-in-from-top-4 duration-500",
          )}
        >
          <Calendar
            className={cn(
              "h-5 w-5 shrink-0",
              "text-amber-600 dark:text-amber-400",
            )}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              Nearing Next Month's Requests Included
            </p>
            <p className="mt-0.5 text-xs opacity-90">
              Today is the last week of the month. Active requests for the first
              week of next month are automatically included below.
            </p>
          </div>
        </div>
      )}

      <SlipList
        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500 [animation-delay:150ms]"
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
            <AlertDialogTitle>Ticket Not Found</AlertDialogTitle>

            <AlertDialogDescription>
              The ticket code you entered could not be found. Please check the
              code and try again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify Ticket Modal */}
      <AlertDialog
        open={isVerifyModalOpen}
        onOpenChange={setIsVerifyModalOpen}
      >
        <AlertDialogContent
          className={cn(
            "max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl",
          )}
        >
          <AlertDialogHeader className="relative border-b border-border/40 pb-4">
            <AlertDialogTitle className="text-lg font-bold tracking-tight">
              On-Site Ticket Verification
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Scan the student's QR code or enter the 6-character code.
            </AlertDialogDescription>

            {/* Switch Tabs */}
            <div className="mt-4 flex rounded-xl border border-border/40 bg-muted/60 p-1">
              <button
                onClick={() => setActiveTab("qr")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2",
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
                  "flex flex-1 items-center justify-center gap-2 rounded-lg py-2",
                  "text-xs font-bold transition-all",
                  activeTab === "manual"
                    ? "bg-white text-primary shadow-sm dark:bg-neutral-800"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Ticket className="h-3.5 w-3.5" />
                Manual Code
              </button>
            </div>
          </AlertDialogHeader>

          {/* Active Tab Content */}
          <div className="py-4">
            {activeTab === "qr" ? (
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "relative mx-auto aspect-square w-full max-w-[240px]",
                    "overflow-hidden rounded-2xl border border-border",
                    "flex items-center bg-neutral-950 shadow-inner",
                    "justify-center",
                  )}
                >
                  <div
                    id="qr-reader-viewport"
                    className="h-full w-full"
                  />
                  {isScanning && (
                    <>
                      <div
                        className={cn(
                          "absolute left-4 top-4 h-5 w-5",
                          "rounded-tl-sm border-l-4 border-t-4 border-primary",
                        )}
                      />
                      <div
                        className={cn(
                          "absolute right-4 top-4 h-5 w-5",
                          "rounded-tr-sm border-r-4 border-t-4 border-primary",
                        )}
                      />
                      <div
                        className={cn(
                          "absolute bottom-4 left-4 h-5 w-5",
                          "rounded-bl-sm border-b-4 border-l-4 border-primary",
                        )}
                      />
                      <div
                        className={cn(
                          "absolute bottom-4 right-4 h-5 w-5",
                          "rounded-br-sm border-b-4 border-r-4 border-primary",
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
                        "justify-center bg-muted/10 p-4 text-center",
                        "backdrop-blur-sm",
                      )}
                    >
                      <Camera className="mb-2 h-5 w-5 animate-pulse text-primary/80" />
                      <p className="text-xs font-bold text-foreground">
                        Scanner Ready
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  {isScanning ? (
                    <Button
                      onClick={stopScanner}
                      variant="outline"
                      className="h-9 rounded-lg px-4 text-xs font-semibold"
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button
                      onClick={startScanner}
                      disabled={isVerifying}
                      className="h-9 gap-2 rounded-lg bg-primary px-4 text-xs font-semibold"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Start Camera
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleManualSubmit}
                className="space-y-4"
              >
                <div className="flex flex-col items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Enter Ticket Code (SLIP-XXXXXX)
                  </span>

                  {/* 6 Individual Character Inputs */}
                  <div className="flex items-center gap-2">
                    {manualCodeParts.map((char, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        maxLength={1}
                        value={char}
                        onChange={(e) =>
                          handleManualCodeChange(idx, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={idx === 0 ? handlePaste : undefined}
                        className={cn(
                          "h-12 w-10 text-center font-mono text-lg font-bold",
                          "rounded-xl border border-border bg-background",
                          "outline-none transition-all focus:border-primary",
                          "focus:ring-2 focus:ring-primary/20",
                          "select-all uppercase dark:bg-white/5",
                        )}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isVerifying || codeString.length !== 6}
                  className={cn(
                    "h-10 w-full gap-2 rounded-xl bg-[#8f1113]",
                    "font-semibold text-white shadow-sm transition-all",
                    "mt-2 text-xs hover:bg-[#6a0d0d] active:scale-95",
                  )}
                >
                  {isVerifying ? (
                    <Clock3 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Verify Ticket Code
                </Button>
              </form>
            )}
          </div>

          <div className="mt-2 flex justify-end border-t border-border/40 pt-4">
            <AlertDialogCancel
              onClick={() => setIsVerifyModalOpen(false)}
              className="h-9 rounded-lg px-4 text-xs font-semibold"
            >
              Cancel
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

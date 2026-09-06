import { useMemo, useState, useEffect, useRef } from "react";
import { useUrlState } from "@/hooks";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Archive,
  Clock3,
  FileText,
  Ticket,
  ShieldCheck,
  Calendar,
  Camera,
  AlertCircle,
  Keyboard,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const TICKET_PREFIX = "SLIP-";
const TICKET_CODE_LENGTH = 6;

function normalizeTicketCode(rawCode: string): string | null {
  const value = rawCode.trim().toUpperCase();

  if (!value) return null;

  const embeddedTicket = value.match(/SLIP[-\s]?([A-Z0-9]{6})/);
  if (embeddedTicket) {
    return `${TICKET_PREFIX}${embeddedTicket[1]}`;
  }

  const compact = value.replace(/[^A-Z0-9]/g, "");

  if (compact.length === TICKET_CODE_LENGTH) {
    return `${TICKET_PREFIX}${compact}`;
  }

  if (
    compact.startsWith("SLIP") &&
    compact.length === 4 + TICKET_CODE_LENGTH
  ) {
    return `${TICKET_PREFIX}${compact.slice(4)}`;
  }

  return null;
}

function getTicketSuffix(rawCode: string): string {
  const normalized = normalizeTicketCode(rawCode);

  if (normalized) {
    return normalized.slice(TICKET_PREFIX.length);
  }

  return rawCode
    .trim()
    .toUpperCase()
    .replace(/^SLIP[-\s]?/, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, TICKET_CODE_LENGTH);
}

export default function ReviewSlips() {
  const navigate = useNavigate();
  const location = useLocation();
  const slipsBasePath = location.pathname.startsWith("/assistant")
    ? "/assistant/slips"
    : "/admin/slips";
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
  const [pendingVerification, setPendingVerification] = useState<{
    slip: Slip;
    code: string;
  } | null>(null);
  const [isClaimingPending, setIsClaimingPending] = useState(false);
  const { triggerToast } = useToast();

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"qr" | "manual">("qr");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const verificationInFlightRef = useRef(false);

  const [manualCodeParts, setManualCodeParts] = useState<string[]>(
    Array(TICKET_CODE_LENGTH).fill(""),
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
    if (verificationInFlightRef.current) return;

    const finalCode = normalizeTicketCode(code);

    if (!finalCode) {
      triggerToast(
        "Invalid ticket code. Enter the 6-character code shown after SLIP-.",
      );
      return;
    }

    verificationInFlightRef.current = true;
    setIsVerifying(true);

    try {
      const slip = await GetTicketDetails(finalCode, {
        handlerName: "ReviewSlips",
        stepName: "Fetch Ticket Details",
      });

      if (!slip.id) {
        throw new Error("Ticket details are incomplete. Please try again.");
      }

      if (slip.ticket?.isVerified) {
        triggerToast("Ticket is already verified. Opening slip details.");
        setIsVerifyModalOpen(false);
        navigate(`${slipsBasePath}/${slip.id}`);
        return;
      }

      setPendingVerification({ slip, code: finalCode });
    } catch (error: any) {
      if (error.response?.status === 404) {
        setIsVerifyModalOpen(false);
        setShowNotFound(true);
      } else {
        const errMsg =
          error.response?.data?.error ||
          error.message ||
          "Failed to verify ticket";
        triggerToast(errMsg);
      }
    } finally {
      verificationInFlightRef.current = false;
      setIsVerifying(false);
    }
  };

  const handleConfirmClaimPending = async () => {
    if (!pendingVerification) return;
    setIsClaimingPending(true);
    try {
      await claimTicket(pendingVerification.code);
      triggerToast("✓ Process started & ticket verified!");
      setIsVerifyModalOpen(false);
      const targetId = pendingVerification.slip.id;
      setPendingVerification(null);
      navigate(`${slipsBasePath}/${targetId}`);
    } catch (error: any) {
      const claimMessage =
        error.response?.data?.error || error.message || "";

      if (claimMessage.toLowerCase().includes("already verified")) {
        triggerToast("Ticket is already verified. Opening slip details.");
        setIsVerifyModalOpen(false);
        const targetId = pendingVerification.slip.id;
        setPendingVerification(null);
        navigate(`${slipsBasePath}/${targetId}`);
      } else {
        triggerToast(claimMessage || "Failed to start process");
      }
    } finally {
      setIsClaimingPending(false);
    }
  };

  const startScanner = async () => {
    setScannerError(null);
    setIsScanning(true);

    try {
      if (qrReaderRef.current) {
        const previousScanner = qrReaderRef.current;

        if (previousScanner.isScanning) {
          await previousScanner.stop().catch(() => {});
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
        async (decodedText: string) => {
          if (html5QrCode.isScanning) {
            await html5QrCode.stop().catch(() => {});
          }

          setIsScanning(false);
          void verifyTicketByCode(decodedText);
        },
        () => {},
      );
    } catch (error) {
      console.error("Scanner start error:", error);

      const message =
        "Camera access is unavailable. Allow camera permission or use the manual code.";

      setScannerError(message);
      triggerToast(message);
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

    if (index < TICKET_CODE_LENGTH - 1 && firstChar) {
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

    const pasteData = getTicketSuffix(e.clipboardData.getData("text"));
    const newParts = Array(TICKET_CODE_LENGTH).fill("");

    for (let i = 0; i < TICKET_CODE_LENGTH; i++) {
      newParts[i] = pasteData[i] || "";
    }

    setManualCodeParts(newParts);

    const focusIndex = Math.min(
      Math.max(pasteData.length - 1, 0),
      TICKET_CODE_LENGTH - 1,
    );
    inputRefs.current[focusIndex]?.focus();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeString.length === TICKET_CODE_LENGTH) {
      verifyTicketByCode(codeString);
    }
  };

  useEffect(() => {
    if (!isVerifyModalOpen) {
      setManualCodeParts(Array(TICKET_CODE_LENGTH).fill(""));
      setScannerError(null);
    }
  }, [isVerifyModalOpen]);

  const handleVerifyModalOpenChange = (open: boolean) => {
    setIsVerifyModalOpen(open);

    if (!open) {
      void stopScanner();
      setPendingVerification(null);
    }
  };

  const handleViewSlip = (slip: Slip) => {
    navigate(`${slipsBasePath}/${slip.id}`);
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
          onClick={() => navigate(`${slipsBasePath}/logs`)}
          className="h-10 gap-2 rounded-xl px-4 shadow-sm"
        >
          <Archive className="h-4 w-4" />
          View All Logs
        </Button>

        <Button
          onClick={() => setIsVerifyModalOpen(true)}
          className={cn(
            "h-10 gap-2 rounded-xl bg-primary hover:bg-primary/90",
            "px-4 font-semibold text-primary-foreground shadow-md",
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
          transform: none !important;
          -webkit-transform: none !important;
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
        <AlertDialogContent className="max-w-sm rounded-xl border-border shadow-md">
          <AlertDialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-5 w-5" />
            </div>
            <AlertDialogTitle>Ticket Not Found</AlertDialogTitle>

            <AlertDialogDescription>
              The ticket code could not be found. Check the printed code or
              scan the student&apos;s QR code again.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction className="rounded-xl">OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verify Ticket Modal */}
      <AlertDialog
        open={isVerifyModalOpen}
        onOpenChange={handleVerifyModalOpenChange}
      >
        <AlertDialogContent
          className={cn(
            "w-[calc(100%-2rem)] max-w-[30rem] overflow-hidden rounded-xl",
            "border border-border bg-card p-0 shadow-md",
          )}
        >
          <AlertDialogHeader className="space-y-0 border-b border-border/60 p-5 pb-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center",
                  "rounded-xl bg-primary/10 text-primary",
                )}
              >
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <AlertDialogTitle className="text-base font-bold tracking-tight sm:text-lg">
                  Verify Admission Slip Ticket
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Scan the QR code or enter the six characters printed after
                  <span className="font-mono font-semibold text-foreground">
                    {" "}
                    SLIP-
                  </span>
                  .
                </AlertDialogDescription>
              </div>
            </div>

            <div
              className={cn(
                "mt-4 grid grid-cols-2 gap-1 rounded-xl border",
                "border-border/60 bg-muted/50 p-1",
              )}
              role="tablist"
              aria-label="Ticket verification method"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "qr"}
                onClick={() => setActiveTab("qr")}
                className={cn(
                  "flex h-9 items-center justify-center gap-2 rounded-xl",
                  "text-xs font-semibold transition-all",
                  activeTab === "qr"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Camera className="h-3.5 w-3.5" />
                QR Scanner
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "manual"}
                onClick={() => setActiveTab("manual")}
                className={cn(
                  "flex h-9 items-center justify-center gap-2 rounded-xl",
                  "text-xs font-semibold transition-all",
                  activeTab === "manual"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Keyboard className="h-3.5 w-3.5" />
                Manual Code
              </button>
            </div>
          </AlertDialogHeader>

          <div className="p-5">
            {pendingVerification ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-green-300 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Ticket Match Found
                    </span>
                    <Badge variant="outline" className="font-mono text-xs font-bold border-green-500/30 bg-background text-green-700 dark:text-green-300">
                      SLIP-{pendingVerification.code}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-foreground">
                      {[
                        pendingVerification.slip.user?.firstName,
                        pendingVerification.slip.user?.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Student No: <span className="font-mono font-semibold text-foreground">{pendingVerification.slip.studentNumber || pendingVerification.slip.user?.studentNumber || "N/A"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Slip Category: <strong className="text-foreground">{pendingVerification.slip.category?.name || "Admission Slip"}</strong>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed px-1">
                  Is the student physically present in the office? Click below to start duration tracking and open the details.
                </p>

                <div className="flex flex-col gap-2.5 pt-2">
                  <Button
                    type="button"
                    onClick={handleConfirmClaimPending}
                    disabled={isClaimingPending}
                    className="h-11 w-full gap-2 rounded-xl bg-green-600 font-bold text-white shadow-md hover:bg-green-700 transition-all hover:scale-[1.01]"
                  >
                    {isClaimingPending ? (
                      <Clock3 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    {isClaimingPending ? "Starting Process..." : "Start Process & Open Details"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setPendingVerification(null)}
                    className="h-10 w-full rounded-xl text-xs font-semibold"
                  >
                    Cancel / Scan Another
                  </Button>
                </div>
              </div>
            ) : activeTab === "qr" ? (
              <div className="space-y-4">
                <div
                  className={cn(
                    "relative mx-auto aspect-square w-full max-w-[230px]",
                    "overflow-hidden rounded-xl border border-border",
                    "flex items-center justify-center bg-neutral-950 shadow-inner",
                  )}
                >
                  <div id="qr-reader-viewport" className="h-full w-full" />

                  {isScanning && (
                    <>
                      <div className="absolute left-4 top-4 h-5 w-5 rounded-tl-sm border-l-4 border-t-4 border-primary" />
                      <div className="absolute right-4 top-4 h-5 w-5 rounded-tr-sm border-r-4 border-t-4 border-primary" />
                      <div className="absolute bottom-4 left-4 h-5 w-5 rounded-bl-sm border-b-4 border-l-4 border-primary" />
                      <div className="absolute bottom-4 right-4 h-5 w-5 rounded-br-sm border-b-4 border-r-4 border-primary" />
                      <div className="scanner-line absolute left-4 right-4 h-0.5 bg-primary/80 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    </>
                  )}

                  {!isScanning && (
                    <div
                      className={cn(
                        "absolute inset-0 flex flex-col items-center justify-center",
                        "bg-neutral-950/80 p-5 text-center",
                      )}
                    >
                      {scannerError ? (
                        <>
                          <AlertCircle className="mb-2 h-6 w-6 text-amber-400" />
                          <p className="text-xs font-semibold text-white">
                            Camera unavailable
                          </p>
                          <p className="mt-1 max-w-[190px] text-[10px] leading-relaxed text-white/65">
                            Use Manual Code or allow camera access and try again.
                          </p>
                        </>
                      ) : (
                        <>
                          <Camera className="mb-2 h-6 w-6 text-white/80" />
                          <p className="text-xs font-semibold text-white">
                            Camera ready
                          </p>
                          <p className="mt-1 text-[10px] text-white/60">
                            Keep the QR code inside the frame.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  {isScanning ? (
                    <Button
                      type="button"
                      onClick={() => void stopScanner()}
                      variant="outline"
                      className="h-9 rounded-xl px-4 text-xs font-semibold"
                    >
                      Stop Camera
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => void startScanner()}
                      disabled={isVerifying}
                      className="h-9 gap-2 rounded-xl px-4 text-xs font-semibold shadow-sm"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      {scannerError ? "Try Camera Again" : "Start Camera"}
                    </Button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("manual")}
                  className="mx-auto block text-xs font-medium text-primary hover:underline"
                >
                  Having trouble scanning? Enter the code instead.
                </button>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-5">
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">
                      Enter ticket code
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      You can also paste the full code, including SLIP-.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={cn(
                        "flex h-11 items-center rounded-xl border border-border",
                        "bg-muted/50 px-3 font-mono text-xs font-bold text-muted-foreground",
                      )}
                    >
                      SLIP-
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {manualCodeParts.map((character, index) => (
                        <input
                          key={index}
                          ref={(element) =>
                            (inputRefs.current[index] = element)
                          }
                          type="text"
                          inputMode="text"
                          autoCapitalize="characters"
                          autoComplete="off"
                          spellCheck={false}
                          maxLength={1}
                          aria-label={`Ticket character ${index + 1}`}
                          value={character}
                          onChange={(event) =>
                            handleManualCodeChange(index, event.target.value)
                          }
                          onKeyDown={(event) => handleKeyDown(index, event)}
                          onPaste={handlePaste}
                          className={cn(
                            "h-11 w-8 rounded-xl border border-border bg-background",
                            "text-center font-mono text-base font-bold uppercase",
                            "outline-none transition-all sm:w-9",
                            "focus:border-primary focus:ring-2 focus:ring-primary/20",
                            "dark:bg-white/5",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-start gap-2 rounded-xl border border-primary/15",
                    "bg-primary/5 p-3 text-[11px] leading-relaxed text-muted-foreground",
                  )}
                >
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    Verification marks the ticket as claimed and then opens the
                    admission slip details for review.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={
                    isVerifying || codeString.length !== TICKET_CODE_LENGTH
                  }
                  className="h-10 w-full gap-2 rounded-xl text-xs font-semibold shadow-sm"
                >
                  {isVerifying ? (
                    <Clock3 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {isVerifying ? "Verifying..." : "Verify Ticket"}
                </Button>
              </form>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-5 py-4">
            <p className="hidden text-[10px] text-muted-foreground sm:block">
              Verify only when the student presents the ticket on-site.
            </p>
            <AlertDialogCancel
              onClick={() => handleVerifyModalOpenChange(false)}
              className="ml-auto h-9 rounded-xl px-4 text-xs font-semibold"
            >
              Cancel
            </AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

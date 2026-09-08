import { useMemo } from "react";
import { useUrlState } from "@/hooks";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  FileX,
  Plus,
  Tag,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { STATUS_COLORS, getStatusColorKey } from "@/config/constants";
import {
  useGetMySlips,
  useGetSlipStats,
  useGetSlipStatuses,
} from "@/features/slips/hooks";
import { SlipStatus } from "@/features/slips/types";
import { Pagination } from "@/components/shared";
import { Spinner } from "@/components/shared/Spinner";
import { useAuth, usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";

interface StatusCount {
  id: string | number;
  name: string;
  count: number;
}

type SlipFilterStatus = SlipStatus & {
  count?: number;
};

type SortOrder = "asc" | "desc";

interface SortOption {
  id: string;
  displayName: string;
  sort: string;
  order: SortOrder;
}

const ALL_SLIP_STATUS: SlipFilterStatus = {
  id: "0",
  name: "All",
};

const SORT_OPTIONS: SortOption[] = [
  {
    id: "createdAt-desc",
    displayName: "Submitted: Newest",
    sort: "createdAt",
    order: "desc",
  },
  {
    id: "createdAt-asc",
    displayName: "Submitted: Oldest",
    sort: "createdAt",
    order: "asc",
  },
  {
    id: "category-asc",
    displayName: "Category: A–Z",
    sort: "category",
    order: "asc",
  },
  {
    id: "category-desc",
    displayName: "Category: Z–A",
    sort: "category",
    order: "desc",
  },
  {
    id: "dateOfAbsence-desc",
    displayName: "Absence: Newest",
    sort: "dateOfAbsence",
    order: "desc",
  },
  {
    id: "dateOfAbsence-asc",
    displayName: "Absence: Oldest",
    sort: "dateOfAbsence",
    order: "asc",
  },
  {
    id: "dateNeeded-desc",
    displayName: "Needed: Newest",
    sort: "dateNeeded",
    order: "desc",
  },
  {
    id: "dateNeeded-asc",
    displayName: "Needed: Oldest",
    sort: "dateNeeded",
    order: "asc",
  },
];

export default function StudentSlips() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: slipStatuses = [], isLoading: isStatusesLoading } =
    useGetSlipStatuses();

  const [currentPage, setCurrentPage] = useUrlState("page", 1);
  const [selectedStatus, setSelectedStatus] = useUrlState<SlipFilterStatus>(
    "status",
    ALL_SLIP_STATUS,
  );

  const [selectedSort, setSelectedSort] = useUrlState<string>(
    "sort",
    "createdAt",
  );
  const [selectedOrder, setSelectedOrder] = useUrlState<SortOrder>(
    "order",
    "desc",
  );

  const { data, isLoading: isSlipsLoading } = useGetMySlips({
    page: currentPage,
    pageSize: 10,
    statusId: selectedStatus?.id === "0" ? undefined : selectedStatus?.id,
  });

  const { data: slipStats, isLoading: isStatsLoading } = useGetSlipStats({
    params: { scope: "me" },
  });

  const isLoading = isStatsLoading || isStatusesLoading;

  const totalCount = useMemo(() => {
    return (
      slipStats?.reduce(
        (sum: number, stat: StatusCount) => sum + (stat.count || 0),
        0,
      ) || 0
    );
  }, [slipStats]);

  const pendingCount = useMemo(() => {
    return (
      slipStats?.find((s: StatusCount) =>
        s.name?.toLowerCase().includes("pending"),
      )?.count || 0
    );
  }, [slipStats]);

  const approvedCount = useMemo(() => {
    return (
      slipStats?.find((s: StatusCount) =>
        s.name?.toLowerCase().includes("approved"),
      )?.count || 0
    );
  }, [slipStats]);

  const attentionCount = useMemo(() => {
    return (
      slipStats?.find(
        (s: StatusCount) =>
          s.name?.toLowerCase().includes("rejected") ||
          s.name?.toLowerCase().includes("revision"),
      )?.count || 0
    );
  }, [slipStats]);

  const statsWithAll = useMemo<SlipFilterStatus[]>(
    () => [
      {
        id: "0",
        name: "All",
        colorKey: "stale",
        count: totalCount,
      },
      ...((slipStats || []) as SlipFilterStatus[]),
    ],
    [slipStats, totalCount],
  );

  const slips = data?.slips || [];

  // Local sorting
  const sortedSlips = useMemo(() => {
    const result = [...slips];
    result.sort((a, b) => {
      if (selectedSort === "createdAt") {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return selectedOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (selectedSort === "category") {
        const catA = (a.category?.name || "").toLowerCase();
        const catB = (b.category?.name || "").toLowerCase();
        const res = catA.localeCompare(catB);
        return selectedOrder === "asc" ? res : -res;
      }
      if (selectedSort === "dateOfAbsence") {
        const dateA = new Date(a.dateOfAbsence).getTime();
        const dateB = new Date(b.dateOfAbsence).getTime();
        return selectedOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      if (selectedSort === "dateNeeded") {
        const dateA = new Date(a.dateNeeded).getTime();
        const dateB = new Date(b.dateNeeded).getTime();
        return selectedOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
    return result;
  }, [slips, selectedSort, selectedOrder]);

  const pageBadgeIcon = useMemo(
    () => <FileText className="h-3.5 w-3.5" />,
    [],
  );

  const hasValidCor = !!user?.studentCorUrl && !!user?.isStudentCorValid;

  const pageHeaderActions = useMemo(
    () => (
      <Button
        asChild={hasValidCor}
        disabled={!hasValidCor}
        className="h-10 gap-2 rounded-xl shadow-lg shadow-primary/15"
        title={
          !user?.studentCorUrl
            ? "Upload your COR in your profile to submit a slip"
            : !user?.isStudentCorValid
              ? "Your COR is invalid or outdated for current term"
              : ""
        }
        onClick={(e) => {
          if (!hasValidCor) e.preventDefault();
        }}
      >
        {hasValidCor ? (
          <Link to="/student/slips/submit">
            <Plus className="h-4 w-4" />
            Submit Slip
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 opacity-50" />
            Submit Slip
          </div>
        )}
      </Button>
    ),
    [user?.studentCorUrl, user?.isStudentCorValid, hasValidCor],
  );

  usePageMetadata(
    useMemo(
      () => ({
        title: "My Admission Slips",
        description: "Manage your admission slip requests and track status",
        badgeText: "My Requests",
        badgeIcon: pageBadgeIcon,
        headerActions: pageHeaderActions,
      }),
      [pageBadgeIcon, pageHeaderActions],
    ),
  );

  const formatCompactDate = (value?: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (statusName?: string) => {
    const key = getStatusColorKey(statusName);
    return STATUS_COLORS[key] || STATUS_COLORS.secondary;
  };

  const handleMetricCardClick = (targetName: string) => {
    if (targetName === "All") {
      setSelectedStatus(ALL_SLIP_STATUS);
      setCurrentPage(1);
      return;
    }
    const match = statsWithAll.find((s) =>
      s.name.toLowerCase().includes(targetName.toLowerCase()),
    );
    if (match) {
      if (String(selectedStatus.id) === String(match.id)) {
        setSelectedStatus(ALL_SLIP_STATUS);
      } else {
        setSelectedStatus(match);
      }
      setCurrentPage(1);
    }
  };

  const emptyState = useMemo(() => {
    const isFiltered = String(selectedStatus?.id) !== "0";

    return (
      <div className="px-4 py-12 text-center sm:py-16">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div
            className={cn(
              "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl",
              "border border-border/80 bg-muted/30 text-muted-foreground",
            )}
          >
            <FileX className="h-8 w-8" />
          </div>

          <h3 className="text-lg font-semibold text-foreground">
            {isFiltered
              ? `No ${selectedStatus.name.toLowerCase()} slips found`
              : "No admission slips submitted yet"}
          </h3>

          <p className="mt-1.5 max-w-sm text-xs text-muted-foreground">
            {isFiltered
              ? "You do not have any admission slips matching this filter."
              : "Submit an admission slip when you have been absent to " +
                "request official clearance from guidance and clinic."}
          </p>

          {isFiltered ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedStatus(ALL_SLIP_STATUS);
                setCurrentPage(1);
              }}
              className="mt-5 rounded-xl text-xs font-semibold"
            >
              Clear Status Filter
            </Button>
          ) : (
            <Button
              asChild={hasValidCor}
              disabled={!hasValidCor}
              className="mt-5 gap-2 rounded-xl shadow-lg shadow-primary/15"
              onClick={(e) => {
                if (!hasValidCor) e.preventDefault();
              }}
            >
              {hasValidCor ? (
                <Link to="/student/slips/submit">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit First Slip
                </Link>
              ) : (
                <div className="flex items-center">
                  <Plus className="mr-2 h-4 w-4 opacity-50" />
                  Submit First Slip
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }, [selectedStatus, hasValidCor, setSelectedStatus, setCurrentPage]);

  return (
    <div
      className={cn(
        "relative isolate mx-auto flex w-full max-w-7xl flex-col",
        "space-y-6 px-4 pb-12 sm:px-6 md:px-8",
      )}
    >
      {/* Missing / Invalid COR Alerts */}
      {!user?.studentCorUrl ? (
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/20 bg-destructive/5"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            Action Required: Missing Certificate of Registration
          </AlertTitle>
          <AlertDescription className="text-xs">
            Upload your valid COR in your profile before filing slips.{" "}
            <Link
              to="/student/cor-management"
              className="font-semibold underline hover:opacity-80"
            >
              Go to COR Management
            </Link>
          </AlertDescription>
        </Alert>
      ) : !user?.isStudentCorValid ? (
        <Alert
          variant="destructive"
          className="rounded-2xl border-destructive/20 bg-destructive/5"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            Action Required: Invalid Certificate of Registration
          </AlertTitle>
          <AlertDescription className="text-xs">
            Your uploaded COR is not valid for the current academic term.{" "}
            <Link
              to="/student/cor-management"
              className="font-semibold underline hover:opacity-80"
            >
              Upload Updated COR
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Top Metric Bento Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card
          onClick={() => handleMetricCardClick("All")}
          className={cn(
            "cursor-pointer rounded-2xl border border-border bg-card p-4",
            "shadow-sm transition-all hover:border-primary/40",
            "hover:bg-accent/40 active:scale-[0.98]",
            String(selectedStatus.id) === "0" &&
              "border-primary/40 bg-primary/5",
          )}
        >
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Total Slips
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {totalCount}
              </p>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-primary/10 text-primary",
              )}
            >
              <FileCheck2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleMetricCardClick("Pending")}
          className={cn(
            "cursor-pointer rounded-2xl border border-border bg-card p-4",
            "shadow-sm transition-all hover:border-amber-500/40",
            "hover:bg-amber-500/5 active:scale-[0.98]",
            selectedStatus.name.toLowerCase().includes("pending") &&
              "border-amber-500/50 bg-amber-500/10",
          )}
        >
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Pending
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {pendingCount}
              </p>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-amber-500/10 text-amber-600",
              )}
            >
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleMetricCardClick("Approved")}
          className={cn(
            "cursor-pointer rounded-2xl border border-border bg-card p-4",
            "shadow-sm transition-all hover:border-emerald-500/40",
            "hover:bg-emerald-500/5 active:scale-[0.98]",
            selectedStatus.name.toLowerCase().includes("approved") &&
              "border-emerald-500/50 bg-emerald-500/10",
          )}
        >
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Approved
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {approvedCount}
              </p>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-emerald-500/10 text-emerald-600",
              )}
            >
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => handleMetricCardClick("Rejected")}
          className={cn(
            "cursor-pointer rounded-2xl border border-border bg-card p-4",
            "shadow-sm transition-all hover:border-rose-500/40",
            "hover:bg-rose-500/5 active:scale-[0.98]",
            (selectedStatus.name.toLowerCase().includes("rejected") ||
              selectedStatus.name.toLowerCase().includes("revision")) &&
              "border-rose-500/50 bg-rose-500/10",
          )}
        >
          <CardContent className="flex items-center justify-between p-0">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground">
                Needs Attention
              </p>
              <p className="mt-1 text-2xl font-bold text-rose-600">
                {attentionCount}
              </p>
            </div>
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-rose-500/10 text-rose-600",
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segmented Filter Pills & Compact Sort Bar */}
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center",
          "sm:justify-between border-b border-border/60 pb-3",
        )}
      >
        {/* Horizontal Segmented Status Tabs (1-click filtering) */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {statsWithAll.map((status) => {
            const count = status.count || 0;
            const isSelected = String(selectedStatus.id) === String(status.id);

            return (
              <button
                key={String(status.id)}
                type="button"
                onClick={() => {
                  setSelectedStatus(status);
                  setCurrentPage(1);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs",
                  "font-semibold transition-all select-none",
                  isSelected
                    ? "border border-primary/40 bg-primary/10 " +
                        "text-primary shadow-sm"
                    : "border border-border/70 bg-card " +
                        "text-muted-foreground hover:bg-muted/60 " +
                        "hover:text-foreground",
                )}
              >
                <span>{status.name}</span>
                <Badge
                  variant={isSelected ? "default" : "secondary"}
                  className={cn(
                    "h-4 min-w-4 rounded-full px-1.5 text-[10px]",
                    isSelected && "bg-primary text-primary-foreground",
                  )}
                >
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Compact Sort Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            aria-label="Sort admission slips"
            value={`${selectedSort}-${selectedOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split("-") as [
                string,
                SortOrder,
              ];
              setSelectedSort(sort);
              setSelectedOrder(order);
              setCurrentPage(1);
            }}
            disabled={isLoading || isSlipsLoading}
            className={cn(
              "h-8 rounded-xl border border-border/70 bg-card px-2.5 py-1",
              "text-xs font-medium text-foreground transition-colors",
              "focus:border-primary focus:outline-none focus:ring-1",
              "focus:ring-primary disabled:opacity-50",
            )}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Slip Cards Grid / Loading / Empty State */}
      <div className="w-full">
        {isSlipsLoading ? (
          <div className="flex w-full items-center justify-center p-16">
            <Spinner size="lg" />
          </div>
        ) : sortedSlips.length === 0 ? (
          emptyState
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-4 md:grid-cols-2",
              "xl:grid-cols-3 2xl:grid-cols-4",
            )}
          >
            {sortedSlips.map((slip) => (
              <button
                key={slip.id}
                type="button"
                onClick={() => navigate(`/student/slips/${slip.id}`)}
                className={cn(
                  "group flex flex-col justify-between rounded-2xl border",
                  "border-border bg-card p-5 text-left shadow-sm",
                  "transition-all hover:-translate-y-0.5",
                  "hover:border-primary/40 hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-primary",
                )}
                aria-label={`View admission slip: ${
                  slip.category?.name || "Uncategorized"
                }`}
              >
                <div className="space-y-3">
                  {/* Category & Status Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "max-w-[170px] truncate border-border/80 bg-muted/40",
                        "text-[11px] font-semibold text-foreground",
                      )}
                    >
                      <Tag
                        className={cn(
                          "mr-1.5 h-3 w-3 shrink-0 text-muted-foreground",
                        )}
                      />
                      <span className="truncate">
                        {slip.category?.name || "Uncategorized"}
                      </span>
                    </Badge>

                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 px-2.5 py-0.5 text-[11px] font-bold",
                        "uppercase tracking-wider",
                        getStatusColor(slip.status?.name),
                      )}
                    >
                      {slip.status?.name || "Unknown"}
                    </Badge>
                  </div>

                  {/* Reason (Clamped to 2 lines) */}
                  <p
                    className={cn(
                      "line-clamp-2 text-xs font-medium leading-relaxed",
                      "text-foreground/85",
                    )}
                    title={slip.reason}
                  >
                    {slip.reason}
                  </p>
                </div>

                {/* Footer Dates */}
                <div
                  className={cn(
                    "mt-4 flex flex-col gap-2 border-t border-border/60",
                    "pt-3 text-xs sm:flex-row sm:items-center",
                    "sm:justify-between",
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-[11px]",
                      "text-muted-foreground",
                    )}
                  >
                    <Calendar className="h-3 w-3" />
                    Absence: {formatCompactDate(slip.dateOfAbsence)}
                  </span>

                  <span
                    className={cn(
                      "flex items-center gap-1.5 font-mono text-[11px]",
                      "font-semibold text-primary",
                    )}
                  >
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    Needed: {formatCompactDate(slip.dateNeeded)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <Pagination
          currentPage={data?.meta?.page || 1}
          totalPages={data?.meta?.totalPages || 1}
          onPageChange={(page) => setCurrentPage(page)}
          className="mt-6"
        />
      </div>
    </div>
  );
}

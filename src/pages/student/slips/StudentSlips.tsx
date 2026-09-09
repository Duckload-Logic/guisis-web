import { useMemo } from "react";
import { useUrlState } from "@/hooks";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowUpDown,
  Calendar,
  ChevronRight,
  FileText,
  FileX,
  Plus,
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
import { Skeleton } from "@/components/ui/skeleton";
import { SelectField } from "@/components/ui/select-field";
import { useAuth, usePageMetadata } from "@/context";
import { AnimationStyles } from "@/components/ui/animations";
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

const getEventDateParts = (dateStr?: string) => {
  if (!dateStr) return { month: "—", day: "—" };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { month: "—", day: "—" };
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }),
    day: d.toLocaleDateString("en-US", { day: "numeric" }),
  };
};

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

  const pageBadgeIcon = useMemo(() => <FileText className="h-3.5 w-3.5" />, []);

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

  const emptyState = useMemo(() => {
    const isFiltered = String(selectedStatus?.id) !== "0";

    return (
      <div className="px-4 py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div
            className={cn(
              "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl",
              "border border-border/80 bg-muted/30 text-muted-foreground",
            )}
          >
            <FileX className="h-8 w-8" />
          </div>

          <h3 className="text-base font-semibold text-foreground">
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
        "relative isolate mx-auto flex w-full max-w-6xl flex-col",
        "space-y-6 px-4 pb-12 sm:px-6 md:px-8",
      )}
    >
      <AnimationStyles />

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

      {/* Segmented Filter Tabs & Compact Sort Pill */}
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center",
          "border-b border-border/60 pb-3 sm:justify-between",
        )}
      >
        {/* Horizontal Segmented Status Tabs */}
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
                  "select-none font-semibold transition-all",
                  isSelected
                    ? "border border-primary/40 bg-primary/10 " +
                        "text-primary shadow-sm"
                    : "border border-border/70 bg-card " +
                        "text-muted-foreground hover:bg-muted/60" +
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

        {/* Compact Sort Selector using SelectField */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <div className="w-[185px] sm:w-[200px]">
            <SelectField
              options={SORT_OPTIONS}
              value={`${selectedSort}-${selectedOrder}`}
              onChange={(val) => {
                const [sort, order] = String(val).split("-") as [
                  string,
                  SortOrder,
                ];
                setSelectedSort(sort);
                setSelectedOrder(order);
                setCurrentPage(1);
              }}
              labelKey="displayName"
              enabled={!isLoading && !isSlipsLoading}
              buttonClassName={cn(
                "!h-8 !min-h-0 !py-1 !px-2.5 text-xs font-semibold",
                "rounded-xl border-border/70 bg-card hover:bg-muted/40",
                "shadow-none",
              )}
            />
          </div>
        </div>
      </div>

      {/* Slip Cards (Single-column vertical feed) */}
      <div className="w-full">
        {isSlipsLoading ? (
          <div className="flex flex-col gap-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between rounded-2xl border",
                  "border-border/80 bg-card p-4 shadow-sm",
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3.5">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-16 rounded-md" />
                    </div>
                    <Skeleton className="h-4 w-40 rounded-md" />
                    <Skeleton className="h-3 w-56 rounded-md" />
                  </div>
                </div>
                <Skeleton className="ml-3 h-5 w-5 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        ) : sortedSlips.length === 0 ? (
          emptyState
        ) : (
          <div className="flex flex-col gap-2.5">
            {sortedSlips.map((slip, idx) => {
              const absenceDate = getEventDateParts(slip.dateOfAbsence);
              const animDelay = `${Math.min(idx * 0.04, 0.24)}s`;

              return (
                <button
                  key={slip.id}
                  type="button"
                  onClick={() => navigate(`/student/slips/${slip.id}`)}
                  style={{
                    animationDelay: animDelay,
                    animationFillMode: "both",
                  }}
                  className={cn(
                    "animate-fade-in-up group flex items-center",
                    "justify-between rounded-2xl border border-border/80",
                    "bg-card p-4 text-left shadow-sm transition-all",
                    "hover:-translate-y-0.5 hover:border-primary/40",
                    "hover:shadow-md focus-visible:outline-none",
                    "focus-visible:ring-2 focus-visible:ring-primary",
                  )}
                  aria-label={`View admission slip: ${
                    slip.category?.name || "Uncategorized"
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3.5">
                    {/* Event Calendar Date Block (Absence Date) */}
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 flex-col items-center",
                        "justify-center rounded-xl border border-primary/20",
                        "bg-primary/5 text-primary",
                      )}
                    >
                      <span className="text-[10px] font-bold uppercase">
                        {absenceDate.month}
                      </span>
                      <span className="text-base font-extrabold leading-none">
                        {absenceDate.day}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-border/70 bg-muted/40 text-[11px]",
                            "font-semibold text-foreground",
                          )}
                        >
                          {slip.category?.name || "Excuse Slip"}
                        </Badge>
                        <span
                          className={cn(
                            "flex items-center gap-1 font-mono text-[11px]",
                            "text-muted-foreground",
                          )}
                        >
                          <Calendar className="h-3 w-3" />
                          Needed: {formatCompactDate(slip.dateNeeded)}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "truncate text-xs font-medium text-foreground/90",
                        )}
                        title={slip.reason}
                      >
                        {slip.reason || "No reason specified"}
                      </p>

                      <p className="text-[10px] text-muted-foreground">
                        Submitted on {formatCompactDate(slip.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge & Action Indicator */}
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold uppercase",
                        "tracking-wider",
                        getStatusColor(slip.status?.name),
                      )}
                    >
                      {slip.status?.name || "Unknown"}
                    </Badge>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-muted-foreground/40 transition-transform",
                        "group-hover:translate-x-0.5",
                        "group-hover:text-foreground",
                      )}
                    />
                  </div>
                </button>
              );
            })}
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

import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  FileText,
  FileX,
  Plus,
  Tag,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimationStyles } from "@/components/ui/animations";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LAYOUT_STYLES,
  STATUS_COLORS,
  getStatusColorKey,
} from "@/config/constants";
import {
  useGetMySlips,
  useGetSlipStats,
  useGetSlipStatuses,
} from "@/features/slips/hooks";
import { Slip, SlipStatus } from "@/features/slips/types";
import { Pagination, Table, Column } from "@/components/shared";
import { SelectField } from "@/components/ui/select-field";
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

const GLASS_CARD = LAYOUT_STYLES.CARD;
const GLASS_INNER = LAYOUT_STYLES.INNER;
const ACTION_REQUIRED_ALERT = LAYOUT_STYLES.ALERT;

const ALL_SLIP_STATUS: SlipFilterStatus = {
  id: "0",
  name: "All",
};

export default function StudentSlips() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: slipStatuses = [], isLoading: isStatusesLoading } =
    useGetSlipStatuses();

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] =
    useState<SlipFilterStatus>(ALL_SLIP_STATUS);

  // Sorting states for table headers
  const [selectedSort, setSelectedSort] = useState<string>("createdAt");
  const [selectedOrder, setSelectedOrder] = useState<SortOrder>("desc");

  const { data, isLoading: isSlipsLoading } = useGetMySlips({
    page: currentPage,
    pageSize: 10,
    statusId: selectedStatus?.id === "0" ? undefined : selectedStatus?.id,
  });
  
  const { data: slipStats, isLoading: isStatsLoading } = useGetSlipStats({});

  const isLoading = isStatsLoading || isStatusesLoading;

  const statsWithAll = useMemo<SlipFilterStatus[]>(
    () => [
      {
        id: "0",
        name: "All",
        colorKey: "stale",
        count:
          slipStats?.reduce(
            (sum: number, stat: StatusCount) => sum + (stat.count || 0),
            0,
          ) || 0,
      },
      ...((slipStats || []) as SlipFilterStatus[]),
    ],
    [slipStats],
  );

  const slips = data?.slips || [];

  // Local sorting calculation supporting category, absence date, and date needed
  const sortedSlips = useMemo(() => {
    let result = [...slips];
    result.sort((a, b) => {
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
        className="gap-2 rounded-xl shadow-lg shadow-primary/15"
        title={
          !user?.studentCorUrl
            ? "Please upload your COR in your profile to submit a slip"
            : !user?.isStudentCorValid
              ? "Your COR is invalid or outdated for the current academic term"
              : ""
        }
        onClick={(e) => {
          if (!hasValidCor) {
            e.preventDefault();
          }
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

  usePageMetadata({
    title: "My Admission Slips",
    description: "Manage your admission slip requests and track their status",
    badgeText: "My Requests",
    badgeIcon: pageBadgeIcon,
    isLoading: false,
    headerActions: pageHeaderActions,
  });

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

  const renderSortableHeader = (label: string, sortKey: string) => {
    const isActive = selectedSort === sortKey;
    const Icon = isActive ? (selectedOrder === "desc" ? ArrowDown : ArrowUp) : ArrowUp;

    return (
      <button
        type="button"
        onClick={() => {
          setSelectedSort(sortKey);
          setSelectedOrder(isActive && selectedOrder === "asc" ? "desc" : "asc");
          setCurrentPage(1);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl px-2 py-1 whitespace-nowrap outline-none",
          "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors",
          isActive ? "text-[#800000] dark:text-red-400" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        <Icon 
          className={cn("h-3.5 w-3.5 shrink-0", isActive ? "opacity-100" : "opacity-40")} 
          strokeWidth={isActive ? 2.5 : 2} 
        />
      </button>
    );
  };

  const slipColumns = useMemo<Column<Slip>[]>(
    () => [
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-start">
            {renderSortableHeader("Category & Reason", "category")}
          </div>
        ),
        className: "w-[35%] p-0",
        render: (slip: Slip) => (
          <div className="px-4 py-3 flex flex-col gap-1 text-left">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "border-white/45 bg-white/40 text-[11px]",
                  "font-medium backdrop-blur-xl",
                  "dark:border-white/10 dark:bg-white/[0.05]",
                )}
              >
                <Tag className="mr-1 h-3 w-3" />
                {slip.category?.name}
              </Badge>
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-1 mt-0.5">
              {slip.reason}
            </p>
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-start">
            {renderSortableHeader("Absence Date", "dateOfAbsence")}
          </div>
        ),
        className: "w-[20%] p-0",
        render: (slip: Slip) => (
          <div className="px-3 py-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={14} className="shrink-0" />
            <span className="whitespace-nowrap">{formatCompactDate(slip.dateOfAbsence)}</span>
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full flex items-center justify-start">
            {renderSortableHeader("Date Needed", "dateNeeded")}
          </div>
        ),
        className: "w-[20%] p-0",
        render: (slip: Slip) => (
          <div className="px-3 py-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={14} className="shrink-0" />
            <span className="whitespace-nowrap">{formatCompactDate(slip.dateNeeded)}</span>
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full">
            <SelectField
              label=""
              options={statsWithAll.map((s) => ({
                id: s.id,
                displayName: String(s.id) === "0" ? "All Statuses" : `${s.name} (${s.count || 0})`,
                disabled: String(s.id) !== "0" && (s.count || 0) === 0,
              }))}
              value={selectedStatus.id}
              onChange={(val) => {
                const found = statsWithAll.find((s) => String(s.id) === String(val));
                if (found) {
                  setSelectedStatus(found);
                  setCurrentPage(1);
                }
              }}
              labelKey="displayName"
              buttonClassName={cn(
                "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
                "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
                String(selectedStatus.id) === "0" ? "text-muted-foreground hover:text-foreground" : "text-[#800000] dark:text-red-400"
              )}
            />
          </div>
        ),
        className: "w-[25%] p-0",
        render: (slip: Slip) => (
          <div className="px-3 py-3 flex items-center">
            <Badge
              variant="outline"
              className={cn(
                "text-xs hover:opacity-95 font-semibold px-2.5 py-0.5",
                getStatusColor(slip.status?.name),
              )}
            >
              {slip.status?.name}
            </Badge>
          </div>
        ),
      },
    ],
    [selectedSort, selectedOrder, statsWithAll, selectedStatus]
  );

  const emptyState = useMemo(
    () => (
      <div className="px-4 py-10 sm:px-6 sm:py-12">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div
            className={cn(
              "mb-4 flex h-20 w-20 items-center justify-center rounded-full",
              GLASS_INNER,
            )}
          >
            <FileX className="h-9 w-9 text-muted-foreground" />
          </div>

          <h3 className="mb-2 text-xl font-semibold text-foreground">
            No slips found
          </h3>

          <p className="mb-6 text-sm text-muted-foreground">
            {String(selectedStatus?.id) === "0"
              ? "You haven't submitted any admission slips yet. " +
                "Submit your first slip now."
              : `No ${selectedStatus.name.toLowerCase()} slips found.`}
          </p>

          {String(selectedStatus?.id) === "0" && (
            <Button
              asChild={hasValidCor}
              disabled={!hasValidCor}
              className="rounded-xl shadow-lg shadow-primary/15"
              title={
                !user?.studentCorUrl
                  ? "Please upload your COR in your profile to submit a slip"
                  : !user?.isStudentCorValid
                    ? "Your COR is invalid or outdated for the " +
                      "current academic term"
                    : ""
              }
              onClick={(e) => {
                if (!hasValidCor) {
                  e.preventDefault();
                }
              }}
            >
              {hasValidCor ? (
                <Link to="/student/slips/submit">
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Admission Slip
                </Link>
              ) : (
                <div className="flex items-center">
                  <Plus className="mr-2 h-4 w-4 opacity-50" />
                  Submit Admission Slip
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    ),
    [selectedStatus, hasValidCor, user?.studentCorUrl, user?.isStudentCorValid],
  );

  return (
    <>
      <AnimationStyles />

      <div
        className={cn(
          "mx-auto flex w-full flex-col space-y-6",
          "px-4 sm:px-6 md:px-8",
          "relative isolate overflow-visible"
        )}
      >
        {!user?.studentCorUrl ? (
          <Alert
            variant="destructive"
            className={ACTION_REQUIRED_ALERT}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-base font-medium">
              Action Required: Missing Certificate of Registration
            </AlertTitle>
            <AlertDescription className="text-sm">
              You need to upload your COR before you can submit admission slips.{" "}
              <Link
                to="/student/cor-management"
                className="font-semibold underline hover:text-rose-700 dark:hover:text-rose-300"
              >
                Go to COR Management
              </Link>
            </AlertDescription>
          </Alert>
        ) : !user?.isStudentCorValid ? (
          <Alert
            variant="destructive"
            className={ACTION_REQUIRED_ALERT}
          >
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="text-base font-medium">
              Action Required: Invalid or Outdated Certificate of Registration
            </AlertTitle>
            <AlertDescription className="text-sm">
              Your uploaded COR is not valid for the current academic term.
              Please upload your updated COR to proceed.{" "}
              <Link
                to="/student/cor-management"
                className="font-semibold underline hover:text-rose-700 dark:hover:text-rose-300"
              >
                Go to COR Management
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className={cn(GLASS_CARD, "animate-fade-in-up overflow-hidden")}>
          <CardHeader
            className={cn(
              "border-b border-white/30 px-4 py-3.5",
              "dark:border-white/10",
            )}
          >
            {/* Mobile Dropdown - Preserved for small screens */}
            <div className="w-full max-w-xs md:hidden">
              {isLoading ? (
                <Skeleton className="h-10 w-full rounded-xl" />
              ) : (
                <SelectField
                  label="Admission Slip Status"
                  options={statsWithAll.map((s) => ({
                    id: s.id,
                    displayName: String(s.id) === "0" ? "All Statuses" : `${s.name} (${s.count || 0})`,
                    disabled: String(s.id) !== "0" && (s.count || 0) === 0,
                  }))}
                  value={selectedStatus.id}
                  onChange={(val) => {
                    const selected = statsWithAll.find(
                      (s) => String(s.id) === String(val),
                    );
                    if (selected) {
                      setSelectedStatus(selected);
                      setCurrentPage(1);
                    }
                  }}
                  labelKey="displayName"
                />
              )}
            </div>
            <div className="hidden md:block">
              {/* Optional: Add a subtle prompt or search bar here if desired later, keeping the header clean for now */}
              <span className="text-sm text-muted-foreground italic">Track and manage your admission slip requests.</span>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table
              data={sortedSlips}
              columns={slipColumns}
              isLoading={isSlipsLoading}
              emptyState={emptyState}
              onRowClick={(slip) => navigate(`/student/slips/${slip.id}`)}
              containerClassName="overflow-x-auto"
              tableClassName="w-full table-fixed min-w-[800px]"
            />

            <Separator className="bg-white/25 dark:bg-white/10" />

            <Pagination
              currentPage={data?.meta?.page || 1}
              totalPages={data?.meta?.totalPages || 1}
              onPageChange={(page) => setCurrentPage(page)}
              className="mt-0 border-t-0 px-4 py-3"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

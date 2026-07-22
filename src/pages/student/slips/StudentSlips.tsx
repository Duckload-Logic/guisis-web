import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Calendar,
  FileText,
  FileX,
  Plus,
  Tag,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnimationStyles } from "@/components/ui/animations";
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
import { Pagination, Spinner, Table } from "@/components/shared";
import Dropdown from "@/components/form/Dropdown";
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

  const { data, isLoading: isSlipsLoading } = useGetMySlips({
    page: currentPage,
    pageSize: 5,
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

  const dropdownOptions = useMemo(() => {
    return statsWithAll.map((filter) => ({
      id: filter.id,
      name: `${filter.name} (${filter.count || 0})`,
    }));
  }, [statsWithAll]);

  const slips = data?.slips || [];
  const statusCounts = (slipStats || []) as StatusCount[];

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
    isLoading,
    headerActions: pageHeaderActions,
  });

  const formatCompactDate = (value?: string) => {
    if (!value) return "—";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";

    return parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (statusName?: string) => {
    const key = getStatusColorKey(statusName);
    return STATUS_COLORS[key] || STATUS_COLORS.secondary;
  };

  const renderListItem = useCallback(
    (slip: Slip, index: number) => (
      <div
        key={slip.id}
        className={cn(
          "animate-fade-in-up cursor-pointer p-4",
          "transition-colors duration-200 hover:bg-muted/50",
          "sm:p-5",
        )}
        style={{
          animationDelay: `${0.05 * (index + 1)}s`,
          animationFillMode: "both",
        }}
        onClick={() => navigate(`/student/slips/${slip.id}`)}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={cn(
                "hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                "border border-primary/15 bg-primary/10 text-primary shadow-sm",
                "backdrop-blur-md sm:flex",
              )}
            >
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "border-white/45 bg-white/40 text-xs",
                    "font-medium backdrop-blur-xl",
                    "dark:border-white/10 dark:bg-white/[0.05]",
                  )}
                >
                  <Tag className="mr-1 h-3 w-3" />
                  {slip.category?.name}
                </Badge>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs hover:opacity-90",
                    getStatusColor(slip.status?.name),
                  )}
                >
                  {slip.status?.name}
                </Badge>
              </div>

              <p
                className={cn(
                  "mt-1.5 line-clamp-1 text-sm",
                  "text-muted-foreground/90",
                )}
              >
                {slip.reason}
              </p>
            </div>
          </div>

          <div
            className={cn(
              "flex shrink-0 flex-col gap-1.5 text-sm text-muted-foreground",
              "md:ml-auto md:flex-row md:items-center md:justify-end md:gap-4",
            )}
          >
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              <span>Date Requested: {formatCompactDate(slip.createdAt)}</span>
            </div>

            <span
              className={cn("hidden text-muted-foreground/40", "md:inline")}
            >
              •
            </span>

            <div className="flex items-center gap-2 whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              <span>Absence: {formatCompactDate(slip.dateOfAbsence)}</span>
            </div>

            <span
              className={cn("hidden text-muted-foreground/40", "md:inline")}
            >
              •
            </span>

            <div className="flex items-center gap-2 whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              <span>Needed: {formatCompactDate(slip.dateNeeded)}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    [navigate, formatCompactDate, getStatusColor],
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
          "mx-auto flex w-full flex-col space-y-6", // Forces full width uniformity
          "px-4 sm:px-6 md:px-8",                   // Matches standard padding
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

        <Card className={cn(GLASS_CARD, "animate-fade-in-up")}>
          <CardHeader
            className={cn(
              "border-b border-white/30 px-4 py-3.5",
              "dark:border-white/10",
            )}
          >
            {/* Mobile Dropdown */}
            <div className="w-full max-w-xs md:hidden">
              <Dropdown
                label="Admission Slip Status"
                options={dropdownOptions}
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
              />
            </div>

            {/* Desktop Tabs */}
            <div className="hidden flex-wrap gap-2 md:flex">
              {statsWithAll.map((filter) => {
                const isActive =
                  String(selectedStatus.id) === String(filter.id);

                return (
                  <Button
                    key={filter.id}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedStatus(filter);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "group h-9 rounded-xl px-4 text-xs font-bold transition-all",
                      isActive
                        ? "shadow-md"
                        : cn(
                            "border-glass-border bg-glass-bg",
                            "hover:bg-primary/10 hover:text-primary hover:opacity-90",
                          ),
                    )}
                  >
                    <span>{filter.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-2 rounded-lg px-1.5 py-0.5 text-[10px]",
                        "font-bold transition-all",
                        isActive
                          ? "bg-primary-foreground text-primary"
                          : "bg-muted/60 text-muted-foreground",
                      )}
                    >
                      {filter.count || 0}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table
              variant="list"
              data={slips}
              renderListItem={renderListItem}
              isLoading={isSlipsLoading}
              emptyState={emptyState}
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


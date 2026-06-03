import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  Calendar,
  FileCheck2,
  FileClock,
  FilePenLine,
  FileText,
  FileX,
  FileX2,
  Plus,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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

type SlipStatusMeta = {
  icon: LucideIcon;
  label: string;
  card: string;
  glow: string;
  iconBox: string;
};

const SLIP_STATUS_META: Record<string, SlipStatusMeta> = {
  pending: {
    icon: FileClock,
    label: "text-amber-700/85 dark:text-amber-200",
    card: "border-amber-300/25 bg-gradient-to-br from-amber-50/35 via-white/40 to-white/30 shadow-amber-100/10 dark:border-amber-400/15 dark:from-amber-400/5 dark:via-white/[0.035] dark:to-white/[0.02]",
    glow: "bg-amber-200/15 dark:bg-amber-400/10",
    iconBox:
      "border-amber-300/25 bg-amber-50/35 text-amber-700 dark:border-amber-400/15 dark:bg-amber-400/10 dark:text-amber-200",
  },
  rejected: {
    icon: FileX2,
    label: "text-rose-700/85 dark:text-rose-200",
    card: "border-rose-300/25 bg-gradient-to-br from-rose-50/35 via-white/40 to-white/30 shadow-rose-100/10 dark:border-rose-400/15 dark:from-rose-400/5 dark:via-white/[0.035] dark:to-white/[0.02]",
    glow: "bg-rose-200/15 dark:bg-rose-400/10",
    iconBox:
      "border-rose-300/25 bg-rose-50/35 text-rose-700 dark:border-rose-400/15 dark:bg-rose-400/10 dark:text-rose-200",
  },
  approved: {
    icon: FileCheck2,
    label: "text-emerald-700/85 dark:text-emerald-200",
    card: "border-emerald-300/25 bg-gradient-to-br from-emerald-50/35 via-white/40 to-white/30 shadow-emerald-100/10 dark:border-emerald-400/15 dark:from-emerald-400/5 dark:via-white/[0.035] dark:to-white/[0.02]",
    glow: "bg-emerald-200/15 dark:bg-emerald-400/10",
    iconBox:
      "border-emerald-300/25 bg-emerald-50/35 text-emerald-700 dark:border-emerald-400/15 dark:bg-emerald-400/10 dark:text-emerald-200",
  },
  "for-revision": {
    icon: FilePenLine,
    label: "text-slate-700/85 dark:text-slate-200",
    card: "border-slate-300/30 bg-gradient-to-br from-slate-50/50 via-white/40 to-white/30 shadow-slate-100/10 dark:border-slate-400/15 dark:from-slate-400/5 dark:via-white/[0.035] dark:to-white/[0.02]",
    glow: "bg-slate-200/15 dark:bg-slate-400/10",
    iconBox:
      "border-slate-300/30 bg-slate-50/45 text-slate-700 dark:border-slate-400/15 dark:bg-slate-400/10 dark:text-slate-200",
  },
  default: {
    icon: FileText,
    label: "text-primary/85 dark:text-white",
    card: "border-primary/15 bg-gradient-to-br from-primary/5 via-white/40 to-white/30 shadow-primary/5 dark:border-white/10 dark:from-white/[0.045] dark:via-white/[0.035] dark:to-white/[0.02]",
    glow: "bg-primary/10 dark:bg-white/10",
    iconBox:
      "border-primary/15 bg-primary/10 text-primary dark:border-white/10 dark:bg-white/[0.05] dark:text-white",
  },
};

const getSlipStatusCardMeta = (status?: Pick<SlipStatus, "name">) => {
  const normalizedName = (status?.name || "")
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  if (normalizedName.includes("revision"))
    return SLIP_STATUS_META["for-revision"];
  if (normalizedName.includes("approve")) return SLIP_STATUS_META.approved;
  if (normalizedName.includes("reject")) return SLIP_STATUS_META.rejected;
  if (normalizedName.includes("pending")) return SLIP_STATUS_META.pending;

  const key = getStatusColorKey(status?.name);

  if (key === "success") {
    return SLIP_STATUS_META.approved;
  }

  if (key === "danger") {
    return SLIP_STATUS_META.rejected;
  }

  if (key === "warning") {
    return SLIP_STATUS_META.pending;
  }

  return SLIP_STATUS_META.default;
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

  const pageBadgeIcon = useMemo(() => <FileText className="h-4 w-4" />, []);

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
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
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "hidden h-20 w-20 shrink-0 flex-col items-center",
              "justify-center rounded-[18px] sm:flex",
              GLASS_INNER,
            )}
          >
            <div
              className={cn(
                "mb-2 flex h-10 w-10 items-center justify-center",
                "rounded-xl border border-primary/15 bg-primary/10",
                "text-primary backdrop-blur-md",
              )}
            >
              <FileText className="h-5 w-5" />
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <div
              className={cn(
                "flex flex-col gap-2.5 sm:flex-row",
                "sm:items-center sm:justify-between",
              )}
            >
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

              <div
                className={cn(
                  "flex flex-col gap-1 text-xs",
                  "text-muted-foreground sm:flex-row",
                  "sm:items-center sm:gap-3",
                )}
              >
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Absence: {formatDate(slip.dateOfAbsence)}</span>
                </div>

                <span
                  className={cn("hidden text-muted-foreground/40", "sm:inline")}
                >
                  •
                </span>

                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Needed: {formatDate(slip.dateNeeded)}</span>
                </div>
              </div>
            </div>
            <p
              className={cn("line-clamp-1 text-xs", "text-muted-foreground/85")}
            >
              {slip.reason}
            </p>
          </div>
        </div>
      </div>
    ),
    [navigate, formatDate, getStatusColor],
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

      <div className="relative isolate space-y-6 overflow-visible">
        {/* <div className="pointer-events-none absolute -left-24 -top-24 -z-10 h-72 w-72 rounded-full bg-slate-300/10 blur-3xl dark:bg-slate-500/10" />
        <div className="pointer-events-none absolute right-0 top-10 -z-10 h-80 w-80 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 -z-10 h-72 w-72 rounded-full bg-emerald-200/10 blur-3xl dark:bg-emerald-400/10" /> */}

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

        <section
          className={cn("grid grid-cols-2 gap-3", "md:grid-cols-4 md:gap-4")}
        >
          {slipStatuses.map((stat: SlipStatus, index: number) => {
            const count =
              statusCounts?.find((s) => String(s.id) === String(stat.id))
                ?.count || 0;

            const statusMeta = getSlipStatusCardMeta(stat);
            const StatusIcon = statusMeta.icon;

            return (
              <Card
                key={stat.id}
                className={cn(
                  GLASS_CARD,
                  "animate-fade-in-up group relative h-[124px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.075)]",
                  statusMeta.card,
                )}
                style={{
                  animationDelay: `${0.06 * (index + 1)}s`,
                  animationFillMode: "both",
                }}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl",
                    statusMeta.glow,
                  )}
                />

                <div className="bg-glass-card pointer-events-none absolute inset-x-0 top-0 h-px" />
                <div className="from-white/28 pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent dark:from-black/15" />

                <CardContent className="relative flex h-full flex-col justify-between p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        title={stat.name}
                        className={cn(
                          "truncate text-[11px] font-bold uppercase tracking-[0.18em]",
                          statusMeta.label,
                        )}
                      >
                        {stat.name}
                      </p>

                      <p
                        className={cn(
                          "mt-1 hidden text-[11px] font-medium",
                          "text-muted-foreground/75 sm:block",
                        )}
                      >
                        Admission slip status
                      </p>
                    </div>

                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] transition-transform duration-300 group-hover:scale-105",
                        statusMeta.iconBox,
                      )}
                    >
                      <StatusIcon
                        className="h-5 w-5"
                        strokeWidth={2}
                      />
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <p className="text-[34px] tabular-nums leading-none tracking-tight text-foreground">
                      {count}
                    </p>

                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/85",
                        GLASS_INNER,
                      )}
                    >
                      Total
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

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
                label="Excuse Slip Status"
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

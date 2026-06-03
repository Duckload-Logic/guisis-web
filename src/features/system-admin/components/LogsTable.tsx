import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  CalendarRange,
  Sparkles,
  Activity,
  Terminal,
  User,
  Globe,
  Database,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, Table, Column } from "@/components/shared";
import { useDebounce } from "@/hooks/useDebounce";
import { usePageMetadata } from "@/context";
import type { SystemLog, SystemLogsParams, SystemLogsResponse } from "../types";
import type { UseQueryResult } from "@tanstack/react-query";
import { DatePicker, Dropdown } from "@/components/form";
import { cn } from "@/lib/utils";
import { capitalizeWords, formatDate, truncateText } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useTraceTracks } from "../hooks";
import { id } from "zod/v4/locales";

interface LogsTableProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  useLogsHook: (
    params?: SystemLogsParams,
  ) => UseQueryResult<SystemLogsResponse>;
  actionOptions: string[];
  showIPAddress?: boolean;
}

const ACTION_BADGE_COLORS: Record<string, string> = {
  LOGIN_SUCCESS:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  LOGIN_FAILED:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
  ACCESS_DENIED:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
  RATE_LIMIT_EXCEEDED:
    "border-amber-500/20 bg-amber-500/10 " +
    "text-amber-700 dark:text-amber-400",
  INVALID_TOKEN:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
  API_KEY_INVALID:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
  LOGOUT:
    "border-slate-500/20 bg-slate-500/10 " +
    "text-slate-700 dark:text-slate-400",
  TOKEN_REFRESHED:
    "border-blue-500/20 bg-blue-500/10 " + "text-blue-700 dark:text-blue-400",
  API_KEY_USED:
    "border-blue-500/20 bg-blue-500/10 " + "text-blue-700 dark:text-blue-400",
  API_KEY_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  API_KEY_REVOKED:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
  SETTING_CHANGED:
    "border-amber-500/20 bg-amber-500/10 " +
    "text-amber-700 dark:text-amber-400",
  USER_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  USER_UPDATED:
    "border-blue-500/20 bg-blue-500/10 " + "text-blue-700 dark:text-blue-400",
  USER_DELETED:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
  ROLE_CHANGED:
    "border-purple-500/20 bg-purple-500/10 " +
    "text-purple-700 dark:text-purple-400",
  SLIP_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  SLIP_STATUS_UPDATED:
    "border-blue-500/20 bg-blue-500/10 " + "text-blue-700 dark:text-blue-400",
  APPOINTMENT_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  APPOINTMENT_UPDATED:
    "border-blue-500/20 bg-blue-500/10 " + "text-blue-700 dark:text-blue-400",
  STUDENT_RECORD_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  STUDENT_RECORD_UPDATED:
    "border-blue-500/20 bg-blue-500/10 " + "text-blue-700 dark:text-blue-400",
  M2M_CLIENT_CREATED:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  M2M_CLIENT_REVOKED:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
  M2M_CLIENT_VERIFIED:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  M2M_CLIENT_SECRET_ROTATED:
    "border-amber-500/20 bg-amber-500/10 " +
    "text-amber-700 dark:text-amber-400",
  M2M_CLIENT_USED:
    "border-blue-500/20 bg-blue-500/10 " + "text-blue-700 dark:text-blue-400",
  M2M_CLIENT_INVALID:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
  M2M_AUTH_SUCCESS:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  M2M_AUTH_FAILED:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
  M2M_TOKEN_REFRESHED:
    "border-blue-500/20 bg-blue-500/10 " + "text-blue-700 dark:text-blue-400",
  M2M_DATA_ACCESS:
    "border-blue-500/20 bg-blue-500/10 " + "text-blue-700 dark:text-blue-400",
  M2M_DATA_ACCESS_DENIED:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
  EMAIL_SEND_SUCCESS:
    "border-emerald-500/20 bg-emerald-500/10 " +
    "text-emerald-700 dark:text-emerald-400",
  EMAIL_SEND_FAILED:
    "border-red-500/20 bg-red-500/10 " + "text-red-700 dark:text-red-400",
};

interface TraceTracksViewerProps {
  traceId: string;
  currentLogId: number;
}

export function TraceTracksViewer({
  traceId,
  currentLogId,
}: TraceTracksViewerProps) {
  const { data: tracks, isLoading, error } = useTraceTracks(traceId);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 py-4 text-sm",
          "animate-pulse text-muted-foreground",
        )}
      >
        <Clock className="h-4 w-4 animate-spin" />
        Loading trace tracks...
      </div>
    );
  }

  if (error || !tracks) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 py-4 text-sm",
          "text-destructive",
        )}
      >
        <AlertCircle className="h-4 w-4" />
        Failed to load trace tracks.
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="py-4 text-sm text-muted-foreground">
        No trace tracks found for this transaction.
      </div>
    );
  }

  return (
    <div
      className={cn("relative mt-4 space-y-4 border-l pl-4", "border-border")}
    >
      {tracks.map((track) => {
        const isCurrent = track.id === currentLogId;
        return (
          <div
            key={track.id}
            className="relative"
          >
            <div
              className={cn(
                "absolute -left-[24.5px] h-3.5 w-3.5",
                "rounded-full border-2",
                isCurrent
                  ? "scale-110 border-primary bg-primary shadow-sm"
                  : "border-muted-foreground/40 bg-background",
              )}
            />
            <div className="flex max-h-[20rem] flex-col space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {track.action.replace(/_/g, " ")}
                </span>
                <Badge
                  variant={track.level === "ERROR" ? "destructive" : "info"}
                  className="rounded px-1.5 py-0 text-[10px]"
                >
                  {track.level}
                </Badge>
                <span
                  className={cn("ml-auto text-[10px] text-muted-foreground")}
                >
                  {new Date(track.createdAt).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">{track.message}</p>

              {track.metadata && Object.keys(track.metadata).length > 0 && (
                <pre
                  className={cn(
                    "min-h-0 flex-1 overflow-auto rounded-lg p-2 text-[10px]",
                    "border border-border bg-background text-muted-foreground",
                  )}
                >
                  {JSON.stringify(track.metadata, null, 2)}
                </pre>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const PAGE_SIZE = 20;

export default function LogsTable({
  title,
  icon,
  description,
  useLogsHook,
  actionOptions,
  showIPAddress = false,
}: LogsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  const debouncedSearch = useDebounce(searchTerm, 500);

  const params = useMemo<SystemLogsParams>(() => {
    const p: SystemLogsParams = {
      page: currentPage,
      page_size: PAGE_SIZE,
    };

    if (debouncedSearch) p.search = debouncedSearch;
    if (actionFilter) p.action = actionFilter;
    if (startDate) p.start_date = startDate;
    if (endDate) p.end_date = endDate;

    return p;
  }, [currentPage, debouncedSearch, actionFilter, startDate, endDate]);

  const { data, isLoading, refetch, isFetching } = useLogsHook(params);

  const logs = useMemo(() => data?.logs ?? [], [data]);
  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;
  const hasActiveFilters = Boolean(actionFilter || startDate || endDate);

  const formatAction = (action: string) =>
    capitalizeWords(action.replace(/_/g, " "));

  const actionDropdownOptions = useMemo(() => {
    return [
      { id: "", label: "All Actions" },
      ...actionOptions.map((action) => ({
        id: action,
        label: formatAction(action),
      })),
    ];
  }, [actionOptions]);

  const highlightText = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));

    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span
          key={index}
          className="rounded-md bg-yellow-200 px-1 text-black dark:bg-yellow-500/20 dark:text-yellow-200"
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const handleReset = () => {
    setSearchTerm("");
    setActionFilter("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const pageMetaData = useMemo(
    () => ({
      title,
      description,
      badgeText: "Monitoring Module",
      badgeIcon: <Sparkles className="h-3.5 w-3.5" />,
      isLoading: false,
      headerActions: (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className={cn(
              "h-10 rounded-xl border-glass-border",
              "bg-glass-bg shadow-md",
            )}
          >
            <RefreshCw
              size={14}
              className={cn("mr-2", isFetching && "animate-spin")}
            />
            Refresh
          </Button>

          <Button
            variant={showFilters || hasActiveFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-10 rounded-xl",
              showFilters || hasActiveFilters
                ? "px-4"
                : "border-glass-border bg-glass-bg shadow-md",
            )}
          >
            <Filter
              size={14}
              className="mr-2"
            />
            Filters
          </Button>
        </div>
      ),
    }),
    [title, description, refetch, isFetching, showFilters, hasActiveFilters],
  );

  const columns = useMemo<Column<SystemLog>[]>(() => {
    const cols: Column<SystemLog>[] = [
      {
        header: "Timestamp",
        className: cn(
          "px-5 py-4 text-xs font-semibold uppercase",
          "tracking-[0.14em] text-muted-foreground",
        ),
        render: (log) => (
          <span
            className={cn(
              "whitespace-nowrap font-medium",
              "text-muted-foreground",
            )}
          >
            {formatDate(log.createdAt)}
          </span>
        ),
      },
      {
        header: "Action",
        className: cn(
          "px-5 py-4 text-xs font-semibold uppercase",
          "tracking-[0.14em] text-muted-foreground",
        ),
        render: (log) => (
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-1",
              "text-xs font-semibold",
              ACTION_BADGE_COLORS[log.action] ??
                "border-white/20 bg-white/40 text-muted-foreground " +
                  "dark:bg-white/[0.04]",
            )}
          >
            {formatAction(log.action)}
          </span>
        ),
      },
      {
        header: "Message",
        className: cn(
          "px-5 py-4 text-xs font-semibold uppercase",
          "tracking-[0.14em] text-muted-foreground",
        ),
        render: (log) => (
          <div
            className={cn(
              "line-clamp-2 max-w-[460px]",
              "leading-relaxed text-foreground",
            )}
          >
            {highlightText(
              truncateText(log.message, 25),
              debouncedSearch,
            )}
          </div>
        ),
      },
      {
        header: "Actor",
        className: cn(
          "px-5 py-4 text-xs font-semibold uppercase",
          "tracking-[0.14em] text-muted-foreground",
        ),
        render: (log) => (
          <span className="text-muted-foreground">
            {log.userEmail
              ? highlightText(log.userEmail, debouncedSearch)
              : "—"}
          </span>
        ),
      },
      {
        header: "Target",
        className: cn(
          "px-5 py-4 text-xs font-semibold uppercase",
          "tracking-[0.14em] text-muted-foreground",
        ),
        render: (log) => (
          <span className="text-muted-foreground">
            {log.targetEmail
              ? highlightText(log.targetEmail, debouncedSearch)
              : "—"}
          </span>
        ),
      },
    ];

    if (showIPAddress) {
      cols.push({
        header: "IP Address",
        className: cn(
          "px-5 py-4 text-xs font-semibold uppercase",
          "tracking-[0.14em] text-muted-foreground",
        ),
        render: (log) => (
          <span className="text-muted-foreground">
            {log.ipAddress || "—"}
          </span>
        ),
      });
    }

    return cols;
  }, [showIPAddress, debouncedSearch]);

  usePageMetadata(pageMetaData);

  return (
    <>
      <div className="mx-auto w-full max-w-[1700px] space-y-5">
        {showFilters && (
          <Card className="rounded-xl border-glass-border bg-glass-bg shadow-md">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <label
                    className={cn(
                      "text-xs font-semibold uppercase",
                      "tracking-[0.14em] text-muted-foreground",
                    )}
                  >
                    Action
                  </label>
                  <Dropdown
                    options={actionDropdownOptions}
                    value={actionFilter}
                    onChange={(val) => {
                      setActionFilter(val);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="start-date"
                    className={cn(
                      "text-xs font-semibold uppercase",
                      "tracking-[0.14em] text-muted-foreground",
                    )}
                  >
                    Start Date
                  </label>
                  <div className="relative">
                    <DatePicker
                      value={startDate}
                      onChange={(val) => {
                        setStartDate(val);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="end-date"
                    className={cn(
                      "text-xs font-semibold uppercase",
                      "tracking-[0.14em] text-muted-foreground",
                    )}
                  >
                    End Date
                  </label>
                  <div className="relative">
                    <DatePicker
                      value={endDate}
                      onChange={(val) => {
                        setEndDate(val);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-10 rounded-xl px-4"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="overflow-hidden rounded-xl bg-glass-bg shadow-md">
          <CardHeader className="border-b border-white/20 pb-4 dark:border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]">
                    {icon}
                  </span>
                  <span>{title}</span>
                </CardTitle>

                {total > 0 && (
                  <Badge
                    variant="secondary"
                    className="rounded-full border border-white/30 bg-muted/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur-md dark:border-white/10 dark:bg-muted/[0.05]"
                  >
                    {total.toLocaleString()} entries
                  </Badge>
                )}
              </div>

              <div className="relative w-full lg:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`h-10 rounded-xl border-white/30 bg-white/70 pl-10 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04] ${
                    searchTerm ? "border-primary/40" : ""
                  }`}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table
              data={logs}
              columns={columns}
              isLoading={isLoading}
              emptyState={
                <div
                  className={cn(
                    "flex flex-col items-center justify-center",
                    "px-6 py-14 text-center",
                  )}
                >
                  <div
                    className={cn(
                      "mb-4 flex h-14 w-14 items-center justify-center",
                      "rounded-2xl border border-white/30 bg-white/60",
                      "backdrop-blur-md dark:border-white/10",
                      "dark:bg-white/[0.05]",
                    )}
                  >
                    {icon}
                  </div>
                  <p className="text-lg font-semibold text-foreground">
                    No log entries found
                  </p>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Try adjusting your filters or clear them to load more
                    results.
                  </p>
                  {(hasActiveFilters || searchTerm) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                      className="mt-4 rounded-xl"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              }
              onRowClick={(log) => {
                const pathName = title.replace(" ", "-").toLowerCase();
                navigate(`/superadmin/${pathName}/${log.id}`);
              }}
              containerClassName="px-3 py-3"
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

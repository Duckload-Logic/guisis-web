import { useState, useMemo } from "react";
import {
  Filter,
  RefreshCw,
  Sparkles,
  Clock,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Inbox,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, Table, Column } from "@/components/shared";
import { usePageMetadata } from "@/context";
import { Dropdown, DatePicker } from "@/components/form";
import { cn } from "@/lib/utils";
import { capitalizeWords, truncateText } from "@/utils";
import { useNavigate } from "react-router-dom";
import { useTraceTracks } from "../hooks";
import type { SystemLog, SystemLogsParams, SystemLogsResponse } from "../types";
import type { UseQueryResult } from "@tanstack/react-query";

interface LogsTableProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  useLogsHook: (params?: SystemLogsParams) => UseQueryResult<SystemLogsResponse>;
  actionOptions: string[];
  showIPAddress?: boolean;
}

type SortOrder = "asc" | "desc";
const PAGE_SIZE = 20;

const ACTION_BADGE_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  LOGIN_FAILED: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  ACCESS_DENIED: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  RATE_LIMIT_EXCEEDED: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  INVALID_TOKEN: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  API_KEY_INVALID: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  LOGOUT: "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400",
  TOKEN_REFRESHED: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  API_KEY_USED: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  API_KEY_CREATED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  API_KEY_REVOKED: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  SETTING_CHANGED: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  USER_CREATED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  USER_UPDATED: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  USER_DELETED: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  ROLE_CHANGED: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400",
  SLIP_CREATED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  SLIP_STATUS_UPDATED: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  APPOINTMENT_CREATED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  APPOINTMENT_UPDATED: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  STUDENT_RECORD_CREATED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  STUDENT_RECORD_UPDATED: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  M2M_CLIENT_CREATED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  M2M_CLIENT_REVOKED: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  M2M_CLIENT_VERIFIED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  M2M_CLIENT_SECRET_ROTATED: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  M2M_CLIENT_USED: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  M2M_CLIENT_INVALID: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  M2M_AUTH_SUCCESS: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  M2M_AUTH_FAILED: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  M2M_TOKEN_REFRESHED: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  M2M_DATA_ACCESS: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  M2M_DATA_ACCESS_DENIED: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  EMAIL_SEND_SUCCESS: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  EMAIL_SEND_FAILED: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
};

function formatLogDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const formatAction = (action: string) => capitalizeWords(action.replace(/_/g, " "));

export function TraceTracksViewer({ traceId, currentLogId }: { traceId: string; currentLogId: number }) {
  const { data: tracks, isLoading, error } = useTraceTracks(traceId);

  if (isLoading) return <div className="flex items-center gap-2 py-4 text-sm animate-pulse text-muted-foreground"><Clock className="h-4 w-4 animate-spin" /> Loading trace tracks...</div>;
  if (error || !tracks) return <div className="flex items-center gap-2 py-4 text-sm text-destructive"><AlertCircle className="h-4 w-4" /> Failed to load trace tracks.</div>;
  if (tracks.length === 0) return <div className="py-4 text-sm text-muted-foreground">No trace tracks found for this transaction.</div>;

  return (
    <div className="relative mt-4 space-y-4 border-l pl-4 border-border">
      {tracks.map((track) => {
        const isCurrent = track.id === currentLogId;
        return (
          <div key={track.id} className="relative">
            <div className={cn("absolute -left-[24.5px] h-3.5 w-3.5 rounded-full border-2", isCurrent ? "scale-110 border-primary bg-primary shadow-sm" : "border-muted-foreground/40 bg-background")} />
            <div className="flex max-h-[20rem] flex-col space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-foreground">{track.action.replace(/_/g, " ")}</span>
                <Badge variant={track.level === "ERROR" ? "destructive" : "info"} className="rounded px-1.5 py-0 text-[10px]">{track.level}</Badge>
                <span className="ml-auto text-[10px] text-muted-foreground">{new Date(track.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">{track.message}</p>
              {track.metadata && Object.keys(track.metadata).length > 0 && (
                <pre className="min-h-0 flex-1 overflow-auto rounded-lg p-2 text-[10px] border border-border bg-background text-muted-foreground">{JSON.stringify(track.metadata, null, 2)}</pre>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function LogsTable({
  title,
  icon,
  description,
  useLogsHook,
  actionOptions,
  showIPAddress = false,
}: LogsTableProps) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedSort, setSelectedSort] = useState<string>("timestamp");
  const [selectedOrder, setSelectedOrder] = useState<SortOrder>("desc");

  const params = useMemo<SystemLogsParams & { sort_by?: string; sort_order?: string }>(() => {
    const p: SystemLogsParams & { sort_by?: string; sort_order?: string } = { 
      page: currentPage, 
      page_size: PAGE_SIZE,
      sort_by: selectedSort,
      sort_order: selectedOrder,
    };
    if (startDate) p.start_date = startDate;
    if (endDate) p.end_date = endDate;
    return p;
  }, [currentPage, startDate, endDate, selectedSort, selectedOrder]);

  const { data, isLoading, refetch, isFetching } = useLogsHook(params);

  const processedLogs = useMemo(() => {
    let list = [...(data?.logs ?? [])];

    if (selectedAction !== "all") {
      list = list.filter((log) => log.action === selectedAction);
    }

    // Frontend sorting removed here!

    return list;
  }, [data?.logs, selectedAction]);

  const totalPages = data?.meta?.totalPages ?? 1;
  const total = data?.meta?.total ?? 0;
  const hasActiveFilters = Boolean(startDate || endDate || selectedAction !== "all");

  const handleReset = () => {
    setSelectedAction("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  usePageMetadata({
    title,
    description,
    badgeText: "Monitoring Module",
    badgeIcon: <Sparkles className="h-3.5 w-3.5" />,
    isLoading: false,
  });

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
          isActive ? "text-[#800000]" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "opacity-100" : "opacity-40")} strokeWidth={isActive ? 2.5 : 2} />
      </button>
    );
  };

  const columns = useMemo<Column<SystemLog>[]>(() => {
    const cols: Column<SystemLog>[] = [
      {
        header: <div className="px-3 py-3 w-full flex items-center justify-start">{renderSortableHeader("Timestamp", "timestamp")}</div>,
        className: "w-[15%] p-0",
        render: (log) => (
          <div className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-foreground">
            {formatLogDate(log.createdAt)}
          </div>
        ),
      },
      {
        header: (
          <div className="px-3 py-3 w-full">
            <Dropdown
              label=""
              options={[
                { id: "all", displayName: "All Actions" },
                ...actionOptions.map((action) => ({ id: action, displayName: formatAction(action) })),
              ]}
              value={selectedAction}
              onChange={(val) => {
                setSelectedAction(String(val));
                setCurrentPage(1);
              }}
              labelKey="displayName"
              buttonClassName={cn(
                "h-auto w-full justify-start gap-1.5 rounded-xl border-0 bg-transparent px-2 py-1 shadow-none outline-none hover:bg-muted/70 focus:border-0 focus:ring-0",
                "text-[11px] font-bold uppercase tracking-[0.14em] transition-colors whitespace-nowrap",
                selectedAction === "all" ? "text-muted-foreground hover:text-foreground" : "text-[#800000]"
              )}
            />
          </div>
        ),
        className: "w-[18%] p-0",
        render: (log) => (
          <div className="px-3 py-3">
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide leading-none",
                ACTION_BADGE_COLORS[log.action] ?? "border-white/20 bg-white/40 text-muted-foreground",
              )}
            >
              {formatAction(log.action)}
            </span>
          </div>
        ),
      },
      {
        header: <div className="px-3 py-3 w-full flex items-center justify-start">{renderSortableHeader("Message", "message")}</div>,
        className: "w-[30%] p-0",
        render: (log) => (
          <div className="px-3 py-3 line-clamp-2 text-sm text-foreground pr-4">
            {truncateText(log.message, 80)}
          </div>
        ),
      },
      {
        header: <div className="px-3 py-3 w-full flex items-center justify-start">{renderSortableHeader("Actor", "actor")}</div>,
        className: "w-[17%] p-0",
        render: (log) => <div className="px-3 py-3 text-sm text-muted-foreground truncate pr-2">{log.userEmail || "—"}</div>,
      },
      {
        header: <div className="px-3 py-3 w-full flex items-center justify-start"><span className="px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Target</span></div>,
        className: "w-[10%] p-0",
        render: (log) => <div className="px-3 py-3 text-sm text-muted-foreground truncate pr-2">{log.targetEmail || "—"}</div>,
      },
    ];

    if (showIPAddress) {
      cols.push({
        header: <div className="px-3 py-3 w-full flex items-center justify-start">{renderSortableHeader("IP Address", "ipAddress")}</div>,
        className: "w-[10%] p-0",
        render: (log) => <div className="px-3 py-3 font-mono text-[11px] text-muted-foreground">{log.ipAddress || "—"}</div>,
      });
    }

    return cols;
  }, [showIPAddress, selectedSort, selectedOrder, selectedAction, actionOptions]);

  const renderMobileItem = (log: SystemLog) => (
    <button
      type="button"
      onClick={() => navigate(`/superadmin/${title.replace(/\s+/g, "-").toLowerCase()}/${log.id}`)}
      className={cn(
        "block w-full rounded-2xl border border-border/70 bg-card p-4",
        "text-left shadow-md backdrop-blur-xl transition-all active:scale-[0.98]",
        "dark:border-white/10 dark:bg-white/[0.04]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {formatLogDate(log.createdAt)}
          </p>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-foreground">
            {log.message}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold",
            ACTION_BADGE_COLORS[log.action] ?? "border-white/20 bg-white/40 text-muted-foreground",
          )}
        >
          {formatAction(log.action)}
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <span>Actor: {log.userEmail || "—"}</span>
        <span>Target: {log.targetEmail || "—"}</span>
        {showIPAddress && <span>IP: {log.ipAddress || "—"}</span>}
      </div>
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-6">
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-xl border-border bg-muted/30 px-2.5 py-0.5 text-[10px] text-muted-foreground shadow-sm">
                {total.toLocaleString()} entries
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("h-10 rounded-xl transition-all", showFilters ? "px-4" : "border-border/70 shadow-sm")}
          >
            <Filter size={14} className="mr-2" />
            Date Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-10 rounded-xl border-border/70 shadow-sm"
          >
            <RefreshCw size={14} className={cn("mr-2", isFetching && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="rounded-2xl border border-border/70 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950/40">
          <CardContent className="p-5 flex flex-wrap items-end gap-4">
            <div className="space-y-2 flex-1 min-w-[200px] max-w-[300px]">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Start Date</label>
              <DatePicker value={startDate} onChange={(val) => { setStartDate(val); setCurrentPage(1); }} />
            </div>
            <div className="space-y-2 flex-1 min-w-[200px] max-w-[300px]">
              <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">End Date</label>
              <DatePicker value={endDate} onChange={(val) => { setEndDate(val); setCurrentPage(1); }} />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950/40">
        <CardContent className="p-0">
          <Table
            data={processedLogs}
            columns={columns}
            renderMobileItem={renderMobileItem}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-semibold text-foreground">No log entries found</p>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Try adjusting your filters or clear them to load more results.
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={handleReset} className="mt-5 rounded-xl shadow-md">
                    Clear filters
                  </Button>
                )}
              </div>
            }
            onRowClick={(log) => {
              const pathName = title.replace(/\s+/g, "-").toLowerCase();
              navigate(`/superadmin/${pathName}/${log.id}`);
            }}
            containerClassName="px-0 py-0 overflow-x-auto"
            tableClassName="w-full table-fixed min-w-[1000px]"
          />

          {totalPages > 1 && (
            <div className="border-t border-border/50 bg-slate-50/50 dark:bg-transparent">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isLoading={isLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
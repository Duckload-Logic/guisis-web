import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  ChevronDown,
  ArrowLeft,
  Search,
  X,
  Inbox,
  CheckCheck,
} from "lucide-react";

import { usePageMetadata } from "@/context";
import { Message, Ticket } from "../../features/support/types";
import {
  GetSupportTickets,
  GetSupportTicketMessages,
  PostSupportTicketMessage,
  PatchSupportTicketStatus,
  PatchSupportTicketRead,
} from "../../features/support/services/supportService";
import { getProfilePictureUrl } from "../../lib/profilePicture";
import { FormField } from "@/components/ui/form-field";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MAX_MESSAGE_WORDS = 100;
const TICKETS_POLL_INTERVAL_MS = 10000;
const MESSAGES_POLL_INTERVAL_MS = 3000;
const DEFAULT_PAGE_SIZE = 10;

interface TicketGroup {
  key: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  tickets: Ticket[];
}

const getInitials = (name: string): string => {
  const clean = name.replace(/^\(Guest\)\s+/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return parts[0][0].toUpperCase();
};

export function SupportManagement() {
  const pageMetadata = useMemo(
    () => ({
      title: "Support Chat",
      description: "Manage customer support and resolve user concerns.",
      badgeText: "Admin Support",
      badgeIcon: <MessageSquare className="h-3.5 w-3.5" />,
      isLoading: false,
    }),
    [],
  );

  usePageMetadata(pageMetadata);

  const [searchParams] = useSearchParams();
  const queryTicketId = searchParams.get("ticketId");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<{
    total: number;
    page: number;
    pagesSize: number;
    totalPages: number;
  } | null>(null);

  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupMessages, setGroupMessages] = useState<{
    [ticketId: string]: Message[];
  }>({});
  const [replyText, setReplyText] = useState("");
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const groupedUsers = useMemo(() => {
    const groups: { [key: string]: TicketGroup } = {};

    tickets.forEach((t) => {
      let key = "";
      if (t.userId) {
        key = `user:${t.userId}`;
      } else {
        key = `guest:${t.guestEmail || t.guestName || t.id}`;
      }

      if (!groups[key]) {
        groups[key] = {
          key,
          userId: t.userId,
          guestName: t.guestName,
          guestEmail: t.guestEmail,
          tickets: [],
        };
      }
      groups[key].tickets.push(t);
    });

    // Sort tickets inside each group by oldest first
    Object.values(groups).forEach((g) => {
      g.tickets.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });

    // Return groups sorted by the most recent ticket's updatedAt
    return Object.values(groups).sort((a, b) => {
      const latestA = Math.max(
        ...a.tickets.map((t) => new Date(t.updatedAt).getTime()),
      );
      const latestB = Math.max(
        ...b.tickets.map((t) => new Date(t.updatedAt).getTime()),
      );
      return sortBy === "recent" ? latestB - latestA : latestA - latestB;
    });
  }, [tickets, sortBy]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return groupedUsers.filter((g) => {
      const hasOpen = g.tickets.some(
        (t) => t.status.toLowerCase() === "open",
      );
      if (statusFilter === "open" && !hasOpen) return false;
      if (statusFilter === "closed" && hasOpen) return false;

      if (!query) return true;

      const latestTicket = g.tickets[g.tickets.length - 1];
      const name = (
        latestTicket?.studentName ||
        latestTicket?.guestName ||
        ""
      ).toLowerCase();
      const email = (
        latestTicket?.studentEmail ||
        latestTicket?.guestEmail ||
        ""
      ).toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [groupedUsers, statusFilter, searchQuery]);

  const selectedGroup = useMemo(() => {
    if (!selectedGroupKey) return null;
    return groupedUsers.find((g) => g.key === selectedGroupKey) || null;
  }, [selectedGroupKey, groupedUsers]);

  const activeTicket = useMemo(() => {
    if (!selectedGroup) return null;
    const latestTicket =
      selectedGroup.tickets[selectedGroup.tickets.length - 1];
    return latestTicket.status.toLowerCase() === "open" ? latestTicket : null;
  }, [selectedGroup]);

  const wordCount = useMemo(() => {
    const trimmed = replyText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [replyText]);

  const isOverWordLimit = wordCount > MAX_MESSAGE_WORDS;

  const fetchTickets = async (showLoading = false) => {
    if (showLoading) setIsLoadingTickets(true);
    try {
      const data = await GetSupportTickets(
        page,
        DEFAULT_PAGE_SIZE,
        statusFilter,
      );
      if (data && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
        setMeta(data.meta);
      }
    } catch (err) {
      console.error("[SupportManagement] {FetchTickets}:", err);
    } finally {
      if (showLoading) setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchTickets(true);
    const interval = setInterval(
      () => fetchTickets(false),
      TICKETS_POLL_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [page, statusFilter]);

  useEffect(() => {
    if (queryTicketId && tickets.length > 0) {
      const ticket = tickets.find((t) => t.id === queryTicketId);
      if (ticket) {
        let key = "";
        if (ticket.userId) {
          key = `user:${ticket.userId}`;
        } else {
          key = `guest:${ticket.guestEmail || ticket.guestName || ticket.id}`;
        }
        setSelectedGroupKey(key);
        setStatusFilter("all");
      }
    }
  }, [queryTicketId, tickets]);

  // Poll messages for selected group
  useEffect(() => {
    if (!selectedGroup) {
      setGroupMessages({});
      return;
    }

    const fetchGroupMessages = async () => {
      try {
        const results: { [ticketId: string]: Message[] } = {};
        await Promise.all(
          selectedGroup.tickets.map(async (t) => {
            const data = await GetSupportTicketMessages(t.id);
            if (Array.isArray(data)) {
              results[t.id] = data;
            }
          }),
        );
        setGroupMessages(results);
      } catch (err) {
        console.error("[SupportManagement] {FetchGroupMessages}:", err);
      }
    };

    fetchGroupMessages();
    const interval = setInterval(
      fetchGroupMessages,
      MESSAGES_POLL_INTERVAL_MS,
    );

    return () => clearInterval(interval);
  }, [selectedGroup]);

  // Mark selected conversation as read
  useEffect(() => {
    if (!selectedGroup) return;
    const latestTicket =
      selectedGroup.tickets[selectedGroup.tickets.length - 1];
    if (latestTicket && !latestTicket.isRead) {
      PatchSupportTicketRead(latestTicket.id)
        .then(() => {
          setTickets((prev) =>
            prev.map((t) =>
              t.id === latestTicket.id ? { ...t, isRead: true } : t,
            ),
          );
        })
        .catch((err) =>
          console.error("[SupportManagement] {MarkAsRead}:", err),
        );
    }
  }, [selectedGroupKey, selectedGroup]);

  // Scroll to bottom only when selecting a different conversation
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [selectedGroupKey]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isFarUp =
      target.scrollHeight - target.scrollTop - target.clientHeight > 200;
    setShowScrollBottom(isFarUp);
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isOverWordLimit || !activeTicket) return;

    setIsSending(true);
    const textToSend = replyText;
    setReplyText("");

    try {
      await PostSupportTicketMessage(activeTicket.id, {
        message: textToSend,
      });

      // Refresh messages for the active ticket
      const data = await GetSupportTicketMessages(activeTicket.id);
      if (Array.isArray(data)) {
        setGroupMessages((prev) => ({
          ...prev,
          [activeTicket.id]: data,
        }));
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
              messagesContainerRef.current.scrollHeight;
          }
        }, 50);
      }
    } catch (err) {
      console.error("[SupportManagement] {SendReply}:", err);
      setReplyText(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!activeTicket) return;

    setIsResolving(true);
    try {
      await PatchSupportTicketStatus(activeTicket.id);
      fetchTickets();
    } catch (err) {
      console.error("[SupportManagement] {ResolveTicket}:", err);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col px-1 pb-4 sm:px-6 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "flex h-[calc(100dvh-5.5rem)] min-h-[420px] flex-col overflow-hidden",
          "rounded-2xl border border-glass-border bg-card/60 shadow-md",
          "backdrop-blur-xl md:h-[calc(100vh-11rem)] md:min-h-[580px]",
          "md:flex-row",
        )}
      >
        {/* Tickets List Sidebar */}
        <div
          className={cn(
            "flex w-full shrink-0 flex-col border-b border-glass-border",
            "md:w-96 md:border-b-0 md:border-r",
            selectedGroupKey ? "hidden md:flex" : "flex flex-1",
          )}
        >
          <div className="border-b border-glass-border p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <h2
                className={cn(
                  "flex items-center gap-2 text-xs font-bold sm:text-sm",
                )}
              >
                <MessageSquare className="h-4 w-4 text-primary" />
                Active Conversations
              </h2>
              {meta ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-lg border-primary/20 bg-primary/10 px-2 py-0.5",
                    "text-[10px] font-bold text-primary",
                  )}
                >
                  {meta.total} {meta.total === 1 ? "ticket" : "tickets"}
                </Badge>
              ) : null}
            </div>

            {/* Instant Search Bar */}
            <div className="relative mt-2.5">
              <Search
                className={cn(
                  "absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5",
                  "text-muted-foreground",
                )}
              />
              <input
                type="text"
                placeholder="Search student or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full rounded-xl border border-glass-border bg-muted/20",
                  "pl-8 pr-7 py-1.5 text-xs text-foreground",
                  "placeholder:text-muted-foreground/70",
                  "focus:outline-none focus:ring-1 focus:ring-primary",
                  "shadow-inner",
                )}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className={cn(
                    "absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-5",
                    "rounded-full p-0 text-muted-foreground",
                    "hover:text-foreground",
                  )}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="mt-2.5 flex gap-1 rounded-xl bg-muted/30 p-1">
              {(["all", "open", "closed"] as const).map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <Button
                    key={filter}
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(filter)}
                    className={cn(
                      "flex-1 h-7 rounded-lg text-[10px] font-bold uppercase",
                      "tracking-wider transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-muted/50 " +
                          "hover:text-foreground",
                    )}
                  >
                    {filter}
                  </Button>
                );
              })}
            </div>

            {/* Sort Selector */}
            <div
              className={cn(
                "mt-2 flex items-center justify-between text-[10px]",
                "text-muted-foreground sm:text-[11px]",
              )}
            >
              <span className="font-medium">Sort Order:</span>
              <SelectField
                options={[
                  { id: "recent", label: "Most Recent" },
                  { id: "oldest", label: "Oldest First" },
                ]}
                value={sortBy}
                onChange={(val) => {
                  if (val) setSortBy(val as any);
                }}
                buttonClassName={cn(
                  "h-7 w-28 px-2 py-0.5 text-xs border border-glass-border",
                  "bg-muted/20 shadow-xs rounded-lg font-medium",
                )}
              />
            </div>
          </div>

          {/* Ticket List View */}
          <div className="flex-1 divide-y divide-glass-border overflow-y-auto">
            {isLoadingTickets && filteredGroups.length === 0 ? (
              <div className="space-y-3 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-2.5">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-3.5 w-28 rounded" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-36 rounded" />
                      <Skeleton className="h-2.5 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-8 text-center",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    "border border-glass-border bg-muted/40",
                    "text-muted-foreground",
                  )}
                >
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="mt-2.5 text-xs font-semibold text-foreground">
                  No conversations found
                </p>
                <p
                  className={cn(
                    "mt-0.5 max-w-[200px] text-[11px] text-muted-foreground",
                  )}
                >
                  {searchQuery
                    ? "Try adjusting your search keywords."
                    : "No tickets match the selected status filter."}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="mt-3 h-7 rounded-lg px-2.5 text-xs"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              filteredGroups.map((g) => {
                const latestTicket = g.tickets[g.tickets.length - 1];
                const name = latestTicket.studentName
                  ? latestTicket.studentName
                  : latestTicket.guestName
                    ? `(Guest) ${latestTicket.guestName}`
                    : "Guest";
                const email =
                  latestTicket.studentEmail || latestTicket.guestEmail || "";
                const isSelected = selectedGroupKey === g.key;

                const hasOpen = g.tickets.some(
                  (t) => t.status.toLowerCase() === "open",
                );

                return (
                  <motion.button
                    key={g.key}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedGroupKey(g.key)}
                    className={cn(
                      "w-full p-3 text-left transition-colors sm:p-4",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted/20",
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="relative mt-0.5 shrink-0">
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center",
                            "overflow-hidden rounded-full border",
                            "border-glass-border bg-muted",
                          )}
                        >
                          {latestTicket.profilePicture ? (
                            <img
                              src={getProfilePictureUrl(
                                latestTicket.profilePicture,
                              )}
                              alt={name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span
                              className={cn(
                                "select-none text-xs font-bold text-primary",
                              )}
                            >
                              {getInitials(name)}
                            </span>
                          )}
                        </div>
                        {!latestTicket.isRead && (
                          <span
                            className={cn(
                              "absolute -right-0.5 -top-0.5 h-2.5 w-2.5",
                              "animate-pulse rounded-full bg-blue-500",
                              "ring-2 ring-background",
                            )}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "flex items-center justify-between gap-1",
                          )}
                        >
                          <span
                            className={cn(
                              "truncate text-xs font-bold sm:text-sm",
                              !latestTicket.isRead
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {name}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5",
                              "text-[9px] font-bold uppercase",
                              hasOpen
                                ? "bg-emerald-500/15 text-emerald-600 " +
                                  "dark:text-emerald-400"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {hasOpen ? "Open" : "Resolved"}
                          </span>
                        </div>
                        {email && (
                          <div
                            className={cn(
                              "truncate text-[11px] text-muted-foreground",
                            )}
                          >
                            {email}
                          </div>
                        )}
                        {latestTicket.lastMessage && (
                          <div
                            className={cn(
                              "mt-1 truncate text-xs font-normal italic",
                              "text-muted-foreground",
                            )}
                          >
                            {latestTicket.lastMessage}
                          </div>
                        )}
                        <div
                          className={cn(
                            "mt-2 flex items-center gap-1 text-[10px]",
                            "text-muted-foreground",
                          )}
                        >
                          <Clock className="h-3 w-3" />
                          {new Date(
                            latestTicket.updatedAt,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Standardized Pagination */}
          {meta && meta.totalPages > 1 && (
            <div
              className={cn(
                "flex items-center justify-between border-t",
                "border-glass-border px-3 py-2 text-xs",
              )}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="h-7 rounded-lg px-2.5 text-xs font-semibold"
              >
                Previous
              </Button>
              <span className="text-[11px] font-medium text-muted-foreground">
                Page {page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(p + 1, meta.totalPages))
                }
                disabled={page === meta.totalPages}
                className="h-7 rounded-lg px-2.5 text-xs font-semibold"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Conversation Area */}
        <div
          className={cn(
            "relative min-h-0 flex-1 flex-col bg-background/20",
            selectedGroup ? "flex h-full w-full" : "hidden md:flex",
          )}
        >
          {selectedGroup ? (
            <>
              {/* Conversation Header */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-2",
                  "border-b border-glass-border bg-muted/20 p-3 sm:p-4",
                )}
              >
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8 shrink-0 rounded-lg border",
                      "border-glass-border md:hidden",
                    )}
                    onClick={() => setSelectedGroupKey(null)}
                    title="Back to conversations"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {(() => {
                    const latestTicket =
                      selectedGroup.tickets[selectedGroup.tickets.length - 1];
                    const headerName = latestTicket?.studentName
                      ? latestTicket.studentName
                      : latestTicket?.guestName
                        ? `(Guest) ${latestTicket.guestName}`
                        : "Guest";
                    const headerEmail =
                      latestTicket?.studentEmail ||
                      latestTicket?.guestEmail ||
                      "";
                    return (
                      <>
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center",
                            "overflow-hidden rounded-full border",
                            "border-glass-border bg-muted sm:h-9 sm:w-9",
                          )}
                        >
                          {latestTicket?.profilePicture ? (
                            <img
                              src={getProfilePictureUrl(
                                latestTicket.profilePicture,
                              )}
                              alt={headerName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span
                              className={cn(
                                "select-none text-xs font-bold text-primary",
                              )}
                            >
                              {getInitials(headerName)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-xs font-bold sm:text-sm">
                            {headerName}
                          </h3>
                          {headerEmail && (
                            <p
                              className={cn(
                                "truncate text-[10px] text-muted-foreground",
                                "sm:text-xs",
                              )}
                            >
                              {headerEmail}
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {activeTicket ? (
                  <Button
                    size="sm"
                    onClick={handleResolveTicket}
                    disabled={isResolving}
                    className={cn(
                      "h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold",
                      "shadow-xs",
                    )}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Mark as </span>Resolved
                  </Button>
                ) : (
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-lg border-emerald-500/30 bg-emerald-500/10",
                      "px-2.5 py-1 text-[10px] font-bold uppercase",
                      "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    <CheckCheck className="mr-1 h-3.5 w-3.5 inline" />
                    Resolved
                  </Badge>
                )}
              </motion.div>

              {/* Conversation Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4"
              >
                {selectedGroup.tickets.map((t) => {
                  const msgs = groupMessages[t.id] || [];
                  const isResolved = t.status.toLowerCase() !== "open";

                  return (
                    <div key={t.id} className="flex flex-col">
                      {msgs.map((msg, idx) => {
                        const isStaff =
                          msg.senderId && msg.senderId !== t.userId;

                        const prevMsg = idx > 0 ? msgs[idx - 1] : null;
                        const isPrevStaff = prevMsg
                          ? prevMsg.senderId && prevMsg.senderId !== t.userId
                          : null;
                        const timeDiff = prevMsg
                          ? new Date(msg.createdAt).getTime() -
                            new Date(prevMsg.createdAt).getTime()
                          : 0;
                        const isNewStack =
                          idx === 0 ||
                          isStaff !== isPrevStaff ||
                          msg.senderName !== prevMsg?.senderName ||
                          timeDiff > 3 * 60 * 1000;
                        const showSenderLabel =
                          idx === 0 ||
                          isStaff !== isPrevStaff ||
                          msg.senderName !== prevMsg?.senderName;

                        const formattedDate = new Date(
                          msg.createdAt,
                        ).toLocaleString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex flex-col",
                              isStaff ? "items-end" : "items-start",
                              isNewStack
                                ? idx === 0
                                  ? "mt-0"
                                  : "mt-3.5"
                                : "mt-[1px]",
                            )}
                          >
                            {showSenderLabel && (
                              <span
                                className={cn(
                                  "px-1 text-[10px] text-muted-foreground",
                                )}
                              >
                                {isStaff
                                  ? `Staff (${msg.senderName})`
                                  : msg.senderName}
                              </span>
                            )}
                            <div
                              onClick={() =>
                                setActiveMessageId((prev) =>
                                  prev === msg.id ? null : msg.id,
                                )
                              }
                              className={cn(
                                "max-w-[88%] cursor-pointer select-none",
                                "rounded-2xl px-3.5 py-2 text-xs",
                                "sm:max-w-[80%] sm:text-sm",
                                showSenderLabel ? "mt-1" : "mt-0",
                                isStaff
                                  ? "rounded-tr-none bg-primary " +
                                    "text-primary-foreground shadow-xs"
                                  : "rounded-tl-none bg-muted/80 " +
                                    "text-foreground border " +
                                    "border-glass-border/60",
                              )}
                              title={formattedDate}
                            >
                              <p
                                className={cn(
                                  "whitespace-pre-wrap break-words",
                                  "leading-relaxed",
                                )}
                              >
                                {msg.message}
                              </p>
                            </div>
                            {activeMessageId === msg.id && (
                              <span
                                className={cn(
                                  "mt-1 animate-in fade-in px-1 text-[9px]",
                                  "text-muted-foreground duration-150",
                                )}
                              >
                                {formattedDate}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {isResolved && (
                        <div className="my-6 flex items-center">
                          <div
                            className="flex-1 border-t border-glass-border"
                          />
                          <span
                            className={cn(
                              "mx-4 inline-flex items-center gap-1",
                              "rounded-full border border-glass-border",
                              "bg-muted/40 px-2.5 py-0.5 text-[10px]",
                              "font-bold uppercase tracking-wider",
                              "text-muted-foreground",
                            )}
                          >
                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                            Ticket Resolved
                          </span>
                          <div
                            className="flex-1 border-t border-glass-border"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Scroll to Bottom Button */}
              {showScrollBottom && (
                <Button
                  type="button"
                  size="icon"
                  onClick={scrollToBottom}
                  className={cn(
                    "absolute bottom-20 right-4 z-20 h-8 w-8 rounded-full",
                    "bg-primary text-primary-foreground shadow-lg",
                    "transition-all hover:bg-primary/90 active:scale-95",
                    "sm:bottom-24 sm:right-6",
                  )}
                  aria-label="Scroll to newest messages"
                >
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>
              )}

              {/* Conversation Input */}
              {activeTicket ? (
                <form
                  onSubmit={handleSendReply}
                  className={cn(
                    "space-y-1.5 border-t border-glass-border p-3 sm:p-4",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <FormField
                      label=""
                      value={replyText}
                      onChange={setReplyText}
                      placeholder="Type a response to assist this student..."
                      noSpecialCharacters={false}
                      disabled={isSending}
                      className="flex-1"
                      error={
                        isOverWordLimit
                          ? `Message cannot exceed ${MAX_MESSAGE_WORDS} words`
                          : undefined
                      }
                    />
                    <AnimatePresence>
                      {replyText.trim() && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="shrink-0"
                        >
                          <Button
                            type="submit"
                            disabled={
                              !replyText.trim() ||
                              isOverWordLimit ||
                              isSending
                            }
                            size="icon"
                            className="h-10 w-10 shrink-0 text-white shadow-xs"
                            aria-label="Send message"
                          >
                            <Send className="h-4 w-4 shrink-0" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {replyText.trim() && (
                    <div
                      className={cn(
                        "flex justify-end text-[10px] px-1 font-medium",
                        isOverWordLimit
                          ? "text-destructive font-bold"
                          : "text-muted-foreground",
                      )}
                    >
                      {wordCount}/{MAX_MESSAGE_WORDS} words
                    </div>
                  )}
                </form>
              ) : (
                <div
                  className={cn(
                    "border-t border-glass-border bg-muted/10 p-4",
                    "text-center text-xs text-muted-foreground font-medium",
                  )}
                >
                  All conversations with this user have been resolved.
                </div>
              )}
            </>
          ) : (
            <div
              className={cn(
                "flex flex-1 flex-col items-center justify-center",
                "p-8 text-center",
              )}
            >
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl",
                  "border border-glass-border bg-primary/10 text-primary",
                  "shadow-inner",
                )}
              >
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">
                Support Conversation Inbox
              </h3>
              <p
                className={cn(
                  "mt-1 max-w-sm text-xs text-muted-foreground",
                  "leading-relaxed",
                )}
              >
                Select an active ticket from the left panel to review message
                history, reply to students, and manage support resolutions.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default SupportManagement;

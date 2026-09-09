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
  Copy,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  User,
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
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

const MAX_MESSAGE_WORDS = 100;
const TICKETS_POLL_INTERVAL_MS = 10000;
const MESSAGES_POLL_INTERVAL_MS = 3000;
const DEFAULT_PAGE_SIZE = 10;
const SCROLL_THRESHOLD_PX = 80;
const MAX_TEXTAREA_HEIGHT_PX = 120;
const STACK_TIME_THRESHOLD_MS = 2 * 60 * 1000;
const DEFAULT_SIDEBAR_WIDTH = 320;
const MIN_SIDEBAR_WIDTH = 260;
const MAX_SIDEBAR_WIDTH = 480;
const SIDEBAR_WIDTH_STORAGE_KEY = "guisis_support_sidebar_width";

const CANNED_RESPONSES = [
  "Hello! How may I assist you today?",
  "Could you clarify your student ID or department?",
  "Looking into this with our records now...",
  "Your concern has been resolved. Take care!",
] as const;

interface TicketGroup {
  key: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  tickets: Ticket[];
}

interface OptimisticMessage extends Message {
  isPending?: boolean;
}

const getInitials = (name: string): string => {
  const clean = name.replace(/^\(Guest\)\s+/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return parts[0][0].toUpperCase();
};

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const formatDateDivider = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [statusFilter, setStatusFilter] = useState<
    "all" | "unread" | "open" | "closed"
  >("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupMessages, setGroupMessages] = useState<{
    [ticketId: string]: OptimisticMessage[];
  }>({});
  const [replyText, setReplyText] = useState("");
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastScrollPosRef = useRef<number>(0);

  const isMobile = useIsMobile();
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;
    const saved = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed >= MIN_SIDEBAR_WIDTH && parsed <= MAX_SIDEBAR_WIDTH) {
        return parsed;
      }
    }
    return DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    setIsResizing(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startXRef.current;
      const nextWidth = Math.min(
        Math.max(startWidthRef.current + deltaX, MIN_SIDEBAR_WIDTH),
        MAX_SIDEBAR_WIDTH,
      );
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      setIsResizing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      setSidebarWidth((current) => {
        localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, current.toString());
        return current;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleResetSidebarWidth = () => {
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
    localStorage.setItem(
      SIDEBAR_WIDTH_STORAGE_KEY,
      DEFAULT_SIDEBAR_WIDTH.toString(),
    );
  };

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

    Object.values(groups).forEach((g) => {
      g.tickets.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });

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

  const unreadCount = useMemo(() => {
    return groupedUsers.filter((g) => {
      const latest = g.tickets[g.tickets.length - 1];
      return latest && !latest.isRead;
    }).length;
  }, [groupedUsers]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return groupedUsers.filter((g) => {
      const latestTicket = g.tickets[g.tickets.length - 1];
      const hasOpen = g.tickets.some((t) => t.status.toLowerCase() === "open");

      if (statusFilter === "unread" && latestTicket?.isRead) return false;
      if (statusFilter === "open" && !hasOpen) return false;
      if (statusFilter === "closed" && hasOpen) return false;

      if (!query) return true;

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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const nextHeight = Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT_PX);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, [replyText]);

  const fetchTickets = async (showLoading = false) => {
    if (showLoading) setIsLoadingTickets(true);
    try {
      const apiStatus =
        statusFilter === "open" || statusFilter === "closed"
          ? statusFilter
          : "";
      const data = await GetSupportTickets(
        page,
        DEFAULT_PAGE_SIZE,
        apiStatus,
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

  // Poll messages for selected group with smart sticky bottom
  useEffect(() => {
    if (!selectedGroup) {
      setGroupMessages({});
      return;
    }

    const fetchGroupMessages = async () => {
      try {
        const results: { [ticketId: string]: OptimisticMessage[] } = {};
        await Promise.all(
          selectedGroup.tickets.map(async (t) => {
            const data = await GetSupportTicketMessages(t.id);
            if (Array.isArray(data)) {
              results[t.id] = data;
            }
          }),
        );

        setGroupMessages((prev) => {
          const container = messagesContainerRef.current;
          if (container) {
            const isNearBottom =
              container.scrollHeight -
                container.scrollTop -
                container.clientHeight <=
              SCROLL_THRESHOLD_PX;

            let prevTotal = 0;
            Object.values(prev).forEach((arr) => {
              prevTotal += arr.length;
            });

            let newTotal = 0;
            Object.values(results).forEach((arr) => {
              newTotal += arr.length;
            });

            if (isNearBottom) {
              setTimeout(() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop =
                    messagesContainerRef.current.scrollHeight;
                }
              }, 40);
              setNewMessagesCount(0);
            } else if (newTotal > prevTotal) {
              setNewMessagesCount((c) => c + (newTotal - prevTotal));
            }
          }
          return results;
        });
      } catch (err) {
        console.error("[SupportManagement] {FetchGroupMessages}:", err);
      }
    };

    fetchGroupMessages();
    const interval = setInterval(fetchGroupMessages, MESSAGES_POLL_INTERVAL_MS);
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

  // Initial scroll to bottom when group switches
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
      setNewMessagesCount(0);
    }
  }, [selectedGroupKey]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    lastScrollPosRef.current = target.scrollTop;
    const isFarUp =
      target.scrollHeight - target.scrollTop - target.clientHeight >
      SCROLL_THRESHOLD_PX;
    setShowScrollBottom(isFarUp);
    if (!isFarUp) {
      setNewMessagesCount(0);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      setNewMessagesCount(0);
    }
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || isOverWordLimit || !activeTicket || isSending) {
      return;
    }

    setIsSending(true);
    const textToSend = replyText;
    setReplyText("");

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: OptimisticMessage = {
      id: optimisticId,
      ticketId: activeTicket.id,
      senderId: "staff",
      senderName: "Counselor",
      message: textToSend,
      createdAt: new Date().toISOString(),
      isPending: true,
    };

    setGroupMessages((prev) => ({
      ...prev,
      [activeTicket.id]: [...(prev[activeTicket.id] || []), optimisticMessage],
    }));

    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }
    }, 40);

    try {
      await PostSupportTicketMessage(activeTicket.id, {
        message: textToSend,
      });

      const data = await GetSupportTicketMessages(activeTicket.id);
      if (Array.isArray(data)) {
        setGroupMessages((prev) => ({
          ...prev,
          [activeTicket.id]: data,
        }));
      }
    } catch (err) {
      console.error("[SupportManagement] {SendReply}:", err);
      setGroupMessages((prev) => ({
        ...prev,
        [activeTicket.id]: (prev[activeTicket.id] || []).filter(
          (m) => m.id !== optimisticId,
        ),
      }));
      setReplyText(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
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

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
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
        {/* Left Panel: Tickets List */}
        <div
          style={!isMobile ? { width: `${sidebarWidth}px` } : undefined}
          className={cn(
            "flex w-full shrink-0 flex-col border-b border-glass-border",
            "md:border-b-0",
            selectedGroupKey ? "hidden md:flex" : "flex flex-1",
          )}
        >
          <div className="border-b border-glass-border p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <h2 className={cn(
                "flex items-center gap-2 text-xs font-bold sm:text-sm",
              )}>
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

            {/* Search */}
            <div className="relative mt-2.5">
              <Search
                className={cn(
                  "absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2",
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
                  "py-1.5 pl-8 pr-7 text-xs text-foreground shadow-inner",
                  "placeholder:text-muted-foreground/70",
                  "focus:outline-none focus:ring-1",
                            "focus:ring-primary",
                )}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchQuery("")}
                  className={cn(
                    "absolute right-1.5 top-1/2 h-5 w-5 -translate-y-1/2",
                    "rounded-full p-0 text-muted-foreground",
                    "hover:text-foreground",
                  )}
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="mt-2.5 flex gap-1 rounded-xl bg-muted/30 p-1">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "unread", label: "Unread", count: unreadCount },
                  { id: "open", label: "Open" },
                  { id: "closed", label: "Closed" },
                ] as Array<{
                  id: "all" | "unread" | "open" | "closed";
                  label: string;
                  count?: number;
                }>
              ).map((tab) => {
                const isActive = statusFilter === tab.id;
                const hasCount = Boolean(tab.count && tab.count > 0);
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(tab.id)}
                    className={cn(
                      "h-7 flex-1 rounded-lg text-[10px] font-bold uppercase",
                      "tracking-wider transition-all",
                      isActive
                        ? "shadow-xs bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted/50 " +
                            "hover:text-foreground",
                    )}
                  >
                    <span>{tab.label}</span>
                    {hasCount && (
                      <span
                        className={cn(
                          "ml-1 rounded-full px-1.5 py-0.2 text-[9px]",
                          isActive
                            ? "bg-primary-foreground text-primary"
                            : "bg-blue-500 text-white",
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Sort Order */}
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
                  if (val) setSortBy(val as "recent" | "oldest");
                }}
                buttonClassName={cn(
                  "h-7 w-28 px-2 py-0.5 text-xs border border-glass-border",
                  "bg-muted/20 shadow-xs rounded-lg font-medium",
                )}
              />
            </div>
          </div>

          {/* Ticket Cards List */}
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
              <div className={cn(
                "flex flex-col items-center justify-center p-8 text-center",
              )}>
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
                <p className={cn(
                  "mt-0.5 max-w-[200px] text-[11px] text-muted-foreground",
                )}>
                  {searchQuery
                    ? "Try adjusting your search keywords."
                    : "No tickets match the selected status filter."}
                </p>
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
                const isUnread = !latestTicket.isRead;

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
                        {isUnread && (
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
                          className="flex items-center justify-between gap-1"
                        >
                          <span
                            className={cn(
                              "truncate text-xs font-bold sm:text-sm",
                              isUnread
                                ? "font-extrabold text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isUnread && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-md border-blue-500/30",
                                  "bg-blue-500/10",
                                  "px-1.5 py-0 text-[9px] font-bold",
                                  "text-blue-500",
                                )}
                              >
                                Unread
                              </Badge>
                            )}
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
                          <div className={cn(
                            "mt-1 truncate text-xs font-normal italic",
                            "text-muted-foreground",
                          )}>
                            {latestTicket.lastMessage}
                          </div>
                        )}

                        <div className={cn(
                          "mt-2 flex items-center justify-between",
                          "text-[10px] text-muted-foreground",
                        )}>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(latestTicket.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Pagination */}
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
                onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                disabled={page === meta.totalPages}
                className="h-7 rounded-lg px-2.5 text-xs font-semibold"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Draggable Divider (Jakob's, Fitts's, & Tesler's Law) */}
        {!isMobile && (
          <div
            onMouseDown={handleMouseDownResize}
            onDoubleClick={handleResetSidebarWidth}
            className={cn(
              "group relative hidden w-1 shrink-0 cursor-col-resize",
              "select-none border-r border-glass-border bg-transparent",
              "transition-colors hover:bg-primary/50 md:block",
              isResizing && "bg-primary shadow-xs",
            )}
            title="Drag to resize • Double-click to reset"
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={sidebarWidth}
            aria-valuemin={MIN_SIDEBAR_WIDTH}
            aria-valuemax={MAX_SIDEBAR_WIDTH}
          >
            {/* Invisible 10px Hitbox for Fitts's Law */}
            <div className="absolute inset-y-0 -left-1 -right-1 z-20" />
          </div>
        )}

        {/* Center Panel: Conversation Area */}
        <div
          className={cn(
            "relative min-h-0 flex-1 flex-col bg-background/20",
            selectedGroup ? "flex h-full w-full" : "hidden md:flex",
          )}
        >
          {selectedGroup ? (
            <>
              {/* Header */}
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
                          <h3
                            className="truncate text-xs font-bold sm:text-sm"
                          >
                            {headerName}
                          </h3>
                          {headerEmail && (
                            <p className={cn(
                              "truncate text-[10px] text-muted-foreground",
                              "sm:text-xs",
                            )}>
                              {headerEmail}
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2">
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
                      <CheckCheck className="mr-1 inline h-3.5 w-3.5" />
                      Resolved
                    </Badge>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowContextPanel((v) => !v)}
                    className="h-8 w-8 rounded-lg border border-glass-border"
                    title="Toggle details panel"
                  >
                    {showContextPanel ? (
                      <PanelRightClose className="h-4 w-4" />
                    ) : (
                      <PanelRightOpen className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </motion.div>

              {/* Message Stream */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-4"
              >
                {selectedGroup.tickets.map((t) => {
                  const msgs = groupMessages[t.id] || [];
                  const isResolved = t.status.toLowerCase() !== "open";

                  return (
                    <div key={t.id} className="flex flex-col space-y-1">
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

                        const isNewSenderStack =
                          idx === 0 ||
                          isStaff !== isPrevStaff ||
                          msg.senderName !== prevMsg?.senderName ||
                          timeDiff > STACK_TIME_THRESHOLD_MS;

                        // Date divider calculation
                        const currDateStr = new Date(
                          msg.createdAt,
                        ).toDateString();
                        const prevDateStr = prevMsg
                          ? new Date(prevMsg.createdAt).toDateString()
                          : null;
                        const showDateDivider =
                          idx === 0 || currDateStr !== prevDateStr;

                        const formattedFullDate = new Date(
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
                          <div key={msg.id} className="flex flex-col">
                            {showDateDivider && (
                              <div
                                className={cn(
                                  "my-3 flex items-center justify-center",
                                )}
                              >
                                <span
                                  className={cn(
                                    "rounded-full border border-glass-border",
                                    "bg-muted/40 px-3 py-0.5 text-[10px]",
                                    "font-semibold uppercase tracking-wider",
                                    "text-muted-foreground shadow-xs",
                                  )}
                                >
                                  {formatDateDivider(msg.createdAt)}
                                </span>
                              </div>
                            )}

                            <div
                              className={cn(
                                "flex flex-col",
                                isStaff ? "items-end" : "items-start",
                                isNewSenderStack ? "mt-2.5" : "mt-0.5",
                              )}
                            >
                              {isNewSenderStack && (
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
                                  "sm:max-w-[78%] sm:text-sm",
                                  isNewSenderStack ? "mt-1" : "mt-0",
                                  isStaff
                                    ? "rounded-tr-none bg-primary " +
                                      "text-primary-foreground shadow-xs"
                                    : "rounded-tl-none border " +
                                      "border-glass-border/60 bg-muted/80 " +
                                      "text-foreground",
                                  msg.isPending && "opacity-75",
                                )}
                                title={formattedFullDate}
                              >
                                <p className={cn(
                                    "whitespace-pre-wrap break-words",
                                    "leading-relaxed",
                                  )}>
                                  {msg.message}
                                </p>
                              </div>

                              {/* Timestamp / Status */}
                              <div
                                className={cn(
                                  "mt-0.5 flex items-center gap-1 px-1",
                                  "text-[9px] text-muted-foreground",
                                  "text-muted-foreground",
                                )}
                              >
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                                {isStaff && msg.isPending && (
                                  <span className="animate-pulse">
                                    Sending...
                                  </span>
                                )}
                              </div>

                              {activeMessageId === msg.id && (
                                <span className={cn(
                                    "animate-in fade-in mt-0.5 px-1 text-[9px]",
                                    "text-muted-foreground duration-150",
                                  )}>
                                  {formattedFullDate}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {isResolved && (
                        <div className="my-5 flex items-center">
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

              {/* Floating New Messages or Scroll Bottom Button */}
              {showScrollBottom && (
                <div className={cn(
                  "absolute bottom-24 right-6 z-20 flex flex-col",
                  "items-end gap-2",
                )}>
                  {newMessagesCount > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={scrollToBottom}
                      className={cn(
                        "h-8 gap-1.5 rounded-full bg-blue-600 px-3 text-xs",
                        "text-white shadow-lg transition-all hover:bg-blue-700",
                        "active:scale-95 animate-bounce",
                      )}
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                      <span>{newMessagesCount} new message(s)</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    onClick={scrollToBottom}
                    className={cn(
                      "h-8 w-8 rounded-full bg-primary text-primary-foreground",
                      "shadow-lg transition-all hover:bg-primary/90",
                      "active:scale-95",
                    )}
                    aria-label="Scroll to bottom"
                  >
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  </Button>
                </div>
              )}

              {/* Bottom Input with Canned Responses */}
              {activeTicket ? (
                <div className={cn(
                  "border-t border-glass-border bg-card/40 p-2.5 sm:p-3",
                )}>
                  {/* Canned Quick Reply Chips */}
                  <div className={cn(
                    "mb-2 flex items-center gap-1.5 overflow-x-auto pb-1",
                    "scrollbar-none",
                  )}>
                    <span className={cn(
                      "flex shrink-0 items-center gap-1 text-[10px]",
                      "font-semibold text-muted-foreground",
                    )}>
                      <Sparkles className="h-3 w-3 text-primary" />
                      Quick:
                    </span>
                    {CANNED_RESPONSES.map((snippet) => (
                      <button
                        key={snippet}
                        type="button"
                        onClick={() => {
                          setReplyText((prev) =>
                            prev ? `${prev} ${snippet}` : snippet,
                          );
                          textareaRef.current?.focus();
                        }}
                        className={cn(
                          "shrink-0 rounded-full border border-glass-border",
                          "bg-muted/30 px-2.5 py-0.5 text-[11px]",
                          "text-muted-foreground",
                          "transition-colors hover:bg-muted",
                          "hover:text-foreground",
                        )}
                      >
                        {snippet}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendReply} className="space-y-1.5">
                    <div className="flex items-end gap-2">
                      <div className="relative min-w-0 flex-1">
                        <textarea
                          ref={textareaRef}
                          rows={1}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={
                            "Type a reply... " +
                            "(Enter to send, Shift+Enter for new line)"
                          }
                          disabled={isSending}
                          className={cn(
                            "w-full resize-none rounded-xl border",
                            "border-glass-border",
                            "bg-muted/20 px-3 py-2 text-xs text-foreground",
                            "sm:text-sm",
                            "placeholder:text-muted-foreground/70",
                            "focus:outline-none focus:ring-1",
                            "focus:ring-primary",
                            isOverWordLimit &&
                              "border-destructive ring-destructive",
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={
                          !replyText.trim() || isOverWordLimit || isSending
                        }
                        size="icon"
                        className={cn(
                          "h-9 w-9 shrink-0 rounded-xl text-white shadow-xs",
                        )}
                        aria-label="Send message"
                      >
                        <Send className="h-4 w-4 shrink-0" />
                      </Button>
                    </div>

                    <div className={cn(
                      "flex items-center justify-between px-1 text-[10px]",
                      "text-muted-foreground",
                    )}>
                      <span>Enter ↵ to send • Shift + Enter for new line</span>
                      <span
                        className={cn(
                          "font-medium",
                          isOverWordLimit && "font-bold text-destructive",
                        )}
                      >
                        {wordCount}/{MAX_MESSAGE_WORDS} words
                      </span>
                    </div>
                  </form>
                </div>
              ) : (
                <div className={cn(
                  "border-t border-glass-border bg-muted/10 p-4",
                  "text-center text-xs font-medium text-muted-foreground",
                )}>
                  All conversations with this user have been resolved.
                </div>
              )}
            </>
          ) : (
            <div className={cn(
              "flex flex-1 flex-col items-center justify-center p-8",
              "text-center",
            )}>
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
              <p className={cn(
                "mt-1 max-w-sm text-xs leading-relaxed",
                "text-muted-foreground",
              )}>
                Select an active ticket from the left panel to review message
                history, reply to students, and manage support resolutions.
              </p>
            </div>
          )}
        </div>

        {/* Right Panel: Collapsible Student & Ticket Details Drawer */}
        {selectedGroup && showContextPanel && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 280 }}
            exit={{ opacity: 0, width: 0 }}
            className={cn(
              "hidden shrink-0 border-l border-glass-border bg-muted/10 p-4",
              "lg:flex lg:flex-col lg:overflow-y-auto",
            )}
          >
            {(() => {
              const latestTicket =
                selectedGroup.tickets[selectedGroup.tickets.length - 1];
              const name = latestTicket?.studentName
                ? latestTicket.studentName
                : latestTicket?.guestName
                  ? `(Guest) ${latestTicket.guestName}`
                  : "Guest";
              const email =
                latestTicket?.studentEmail || latestTicket?.guestEmail || "";
              const hasOpen = selectedGroup.tickets.some(
                (t) => t.status.toLowerCase() === "open",
              );

              return (
                <div className="space-y-5">
                  <div className={cn(
                    "flex items-center justify-between border-b",
                    "border-glass-border pb-3",
                  )}>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      "text-muted-foreground",
                    )}>
                      Student Context
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-lg text-[9px] font-bold"
                    >
                      {latestTicket.userId ? "Student" : "Guest"}
                    </Badge>
                  </div>

                  {/* Profile info */}
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center",
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
                        <User className="h-7 w-7 text-primary" />
                      )}
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-foreground">
                      {name}
                    </h4>
                    {email && (
                      <div className={cn(
                        "mt-0.5 flex items-center gap-1 text-xs",
                        "text-muted-foreground",
                      )}>
                        <span className="max-w-[190px] truncate">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(email, "email")}
                          className="rounded p-0.5 hover:bg-muted"
                          title="Copy email"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {copiedKey === "email" && (
                      <span className="text-[10px] text-emerald-500">
                        Email copied!
                      </span>
                    )}
                  </div>

                  {/* Ticket Details */}
                  <div className={cn(
                    "space-y-3 rounded-xl border border-glass-border",
                    "bg-card/40 p-3 text-xs",
                  )}>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-md text-[10px] font-bold uppercase",
                          hasOpen
                            ? "bg-emerald-500/15 text-emerald-600 " +
                              "dark:text-emerald-400"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {hasOpen ? "Open" : "Resolved"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Ticket ID</span>
                      <div className={cn(
                        "flex items-center gap-1 font-mono text-[11px]",
                      )}>
                        <span>{latestTicket.id.slice(0, 8)}...</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyText(latestTicket.id, "ticketId")
                          }
                          className="rounded p-0.5 hover:bg-muted"
                          title="Copy Ticket ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {copiedKey === "ticketId" && (
                      <span className="text-[10px] text-emerald-500">
                        Ticket ID copied!
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Opened</span>
                      <span>
                        {new Date(latestTicket.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>


                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Total Tickets
                      </span>
                      <span className="font-bold">
                        {selectedGroup.tickets.length}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default SupportManagement;

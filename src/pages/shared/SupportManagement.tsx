import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageMetadata } from "@/context";
import {
  MessageSquare,
  Send,
  CheckCircle,
  Clock,
  User,
  ChevronDown,
} from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

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
      badgeText: "Admin",
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
  const pageSize = 10;
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"recent" | "oldest">("recent");
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
    return groupedUsers.filter((g) => {
      const hasOpen = g.tickets.some((t) => t.status.toLowerCase() === "open");
      if (statusFilter === "open") return hasOpen;
      if (statusFilter === "closed") return !hasOpen;
      return true;
    });
  }, [groupedUsers, statusFilter]);

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

  const fetchTickets = async (showLoading = false) => {
    if (showLoading) setIsLoadingTickets(true);
    try {
      const data = await GetSupportTickets(page, pageSize, statusFilter);
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
    const interval = setInterval(() => fetchTickets(false), 10000);
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
    const interval = setInterval(fetchGroupMessages, 3000);

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
    if (!replyText.trim() || !activeTicket) return;

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
    <div className="mx-auto flex w-full flex-col px-4 pb-12 sm:px-6 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={
          "flex h-[calc(100dvh-9rem)] min-h-[560px] flex-col overflow-hidden " +
          "rounded-xl border border-glass-border bg-background/50 shadow-md" +
          "backdrop-blur-xl md:h-[calc(100vh-12rem)] md:flex-row"
        }
      >
        {/* Tickets List Sidebar */}
        <div
          className={
            "flex max-h-[42%] w-full shrink-0 flex-col border-b " +
            "border-glass-border md:max-h-none md:w-96 md:border-b-0 md:border-r"
          }
        >
          <div className="border-b border-glass-border p-4">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <MessageSquare className="h-4 w-4 text-primary" />
              Active Conversations
            </h2>
            <div className="mt-3 flex gap-1 rounded-lg bg-muted/30 p-0.5">
              {(["all", "open", "closed"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={
                    `flex-1 rounded-md py-1 text-center text-[8px] ` +
                    `font-bold uppercase transition-colors ${
                      statusFilter === filter
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50"
                    }`
                  }
                >
                  {filter}
                </button>
              ))}
            </div>
            <div
              className={
                "mt-2.5 flex items-center justify-between " +
                "text-[11px] text-muted-foreground"
              }
            >
              <span>Sort by activity:</span>
              <SelectField
                options={[
                  { id: "recent", label: "Recent" },
                  { id: "oldest", label: "Oldest" },
                ]}
                value={sortBy}
                onChange={(val) => {
                  if (val) setSortBy(val as any);
                }}
                buttonClassName={
                  "h-7 w-28 px-2.5 py-1 text-xs border " +
                  "border-glass-border bg-muted/20 shadow-sm"
                }
              />
            </div>
          </div>

          <div className="flex-1 divide-y divide-glass-border overflow-y-auto">
            {isLoadingTickets && filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Loading tickets...
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No tickets found
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
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedGroupKey(g.key)}
                    className={`w-full p-4 text-left transition-colors ${isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/20"}`}
                  >
                    <div className="flex gap-3">
                      <div className="relative mt-0.5 flex-shrink-0">
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-glass-border bg-muted">
                          {latestTicket.profilePicture ? (
                            <img
                              src={getProfilePictureUrl(
                                latestTicket.profilePicture,
                              )}
                              alt={name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="select-none text-xs font-bold text-primary">
                              {getInitials(name)}
                            </span>
                          )}
                        </div>
                        {!latestTicket.isRead && (
                          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500 ring-2 ring-background" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`truncate text-sm ${
                              !latestTicket.isRead
                                ? "font-bold text-foreground"
                                : "font-semibold text-muted-foreground"
                            }`}
                          >
                            {name}
                          </span>
                          <span
                            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              hasOpen
                                ? "bg-emerald-500/15 text-emerald-500"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {hasOpen ? "Open" : "Resolved"}
                          </span>
                        </div>
                        {email && (
                          <div className="truncate text-[11px] text-muted-foreground">
                            {email}
                          </div>
                        )}
                        {latestTicket.lastMessage && (
                          <div className="mt-1 truncate text-xs font-normal italic text-muted-foreground">
                            {latestTicket.lastMessage}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(latestTicket.updatedAt).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-glass-border p-3 text-xs">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="rounded bg-muted px-2.5 py-1.5 font-medium hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-muted-foreground">
                Page {page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                disabled={page === meta.totalPages}
                className="rounded bg-muted px-2.5 py-1.5 font-medium hover:bg-muted/80 disabled:pointer-events-none disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Conversation Area */}
        <div className="relative flex min-h-0 flex-1 flex-col bg-background/20">
          {selectedGroup ? (
            <>
              {/* Conversation Header */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-glass-border bg-muted/20 p-4"
              >
                <div className="flex items-center gap-3">
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
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-glass-border bg-muted">
                          {latestTicket?.profilePicture ? (
                            <img
                              src={getProfilePictureUrl(
                                latestTicket.profilePicture,
                              )}
                              alt={headerName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="select-none text-xs font-bold text-primary">
                              {getInitials(headerName)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">{headerName}</h3>
                          {headerEmail && (
                            <p className="text-xs text-muted-foreground">
                              {headerEmail}
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {activeTicket && (
                  <button
                    onClick={handleResolveTicket}
                    disabled={isResolving}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Mark as Resolved
                  </button>
                )}
              </motion.div>

              {/* Conversation Messages */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 space-y-4 overflow-y-auto p-4"
              >
                {selectedGroup.tickets.map((t) => {
                  const msgs = groupMessages[t.id] || [];
                  const isResolved = t.status.toLowerCase() !== "open";

                  return (
                    <div
                      key={t.id}
                      className="space-y-4"
                    >
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
                            className={`flex flex-col ${
                              isStaff ? "items-end" : "items-start"
                            } ${
                              isNewStack
                                ? idx === 0
                                  ? "mt-0"
                                  : "mt-3.5"
                                : "mt-1"
                            }`}
                          >
                            {isNewStack && (
                              <span
                                className={
                                  "px-1 text-[10px] text-muted-foreground"
                                }
                              >
                                {isStaff
                                  ? `Admin (${msg.senderName})`
                                  : msg.senderName}
                              </span>
                            )}
                            <div
                              onClick={() =>
                                setActiveMessageId((prev) =>
                                  prev === msg.id ? null : msg.id,
                                )
                              }
                              className={
                                `mt-1 max-w-[80%] rounded-2xl px-3 py-2 ` +
                                `cursor-pointer select-none text-sm ${
                                  isStaff
                                    ? "bg-primary text-primary-foreground " +
                                      "rounded-tr-none"
                                    : "rounded-tl-none bg-muted text-foreground"
                                }`
                              }
                              title={formattedDate}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                            </div>
                            {activeMessageId === msg.id && (
                              <span
                                className={
                                  "mt-1 px-1 text-[9px] " +
                                  "animate-in text-muted-foreground " +
                                  "fade-in duration-150"
                                }
                              >
                                {formattedDate}
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {isResolved && (
                        <div className="my-6 flex items-center">
                          <div className="flex-1 border-t border-glass-border"></div>
                          <span className="mx-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Resolved
                          </span>
                          <div className="flex-1 border-t border-glass-border"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {showScrollBottom && (
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className={
                    "absolute bottom-28 right-6 z-20 " +
                    "flex h-9 w-9 items-center justify-center p-0 " +
                    "rounded-full bg-primary text-primary-foreground " +
                    "shadow-lg hover:bg-primary/95 " +
                    "transition-all duration-300 active:scale-95"
                  }
                >
                  <ChevronDown className="h-5 w-5 shrink-0" />
                </button>
              )}

              {/* Conversation Input */}
              {activeTicket ? (
                <form
                  onSubmit={handleSendReply}
                  className="space-y-2 border-t border-glass-border p-4"
                >
                  <div className="flex items-start gap-2">
                    <FormField
                      label=""
                      value={replyText}
                      onChange={setReplyText}
                      placeholder="Type a message to reply..."
                      noSpecialCharacters={false}
                      disabled={isSending}
                      className="flex-1"
                      error={
                        replyText.trim().split(/\s+/).filter(Boolean).length >
                        100
                          ? "Message cannot exceed 100 words"
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
                          className="flex-shrink-0"
                        >
                          <Button
                            type="submit"
                            disabled={
                              !replyText.trim() ||
                              replyText.trim().split(/\s+/).filter(Boolean)
                                .length > 100
                            }
                            size="icon"
                            className="flex-shrink-0 text-white"
                          >
                            <Send className="h-5 w-5 min-w-5 shrink-0" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {replyText.trim() && (
                    <div
                      className={
                        "flex justify-end text-[10px] " +
                        "px-1 text-muted-foreground"
                      }
                    >
                      {replyText.trim().split(/\s+/).filter(Boolean).length}
                      /100 words
                    </div>
                  )}
                </form>
              ) : (
                <div className="border-t border-glass-border bg-muted/10 p-4 text-center text-xs text-muted-foreground">
                  All conversations with this user have been resolved.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8">
              <MessageSquare className="mb-3 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm font-semibold text-muted-foreground">
                Select a student to view their support history
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default SupportManagement;

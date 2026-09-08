import React, { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  Send,
  X,
  Loader2,
  History,
  ArrowLeft,
  Clock,
  Sliders,
  AudioLines,
  PersonStanding,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useSupportChat } from "../hooks/useSupportChat";
import { useAuth } from "@/context";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const MAX_STUDENT_WORDS = 100;
const SCROLL_THRESHOLD_PX = 80;
const MAX_TEXTAREA_HEIGHT_PX = 100;
const STACK_TIME_THRESHOLD_MS = 2 * 60 * 1000;

const TOPIC_STARTERS = [
  "Admission Slip Inquiry",
  "Appointment Reschedule",
  "Account or Login Issue",
  "Guidance Consultation",
] as const;

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
  });
};

export function SupportChatWidget() {
  const { isAdmin, isSuperAdmin, isDeveloper } = useAuth();
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLenRef = useRef<number>(0);

  const {
    isAuthenticated,
    user,
    isOpen,
    setIsOpen,
    ticketId,
    name,
    setName,
    email,
    setEmail,
    message,
    setMessage,
    messages,
    isSubmitting,
    isPolling,
    messagesEndRef,
    handleStartTicket,
    handleSendMessage,
    handleClose,
    // History features
    viewMode,
    setViewMode,
    historyTickets,
    historyMessages,
    isLoadingHistory,
    fetchHistoryTickets,
    selectHistoryTicket,
  } = useSupportChat();

  const isStaff = isAdmin || isSuperAdmin || isDeveloper;
  const isMobile = useIsMobile();

  const messageWordCount = useMemo(() => {
    const trimmed = message.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [message]);

  const isOverWordLimit = messageWordCount > MAX_STUDENT_WORDS;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const nextHeight = Math.min(scrollHeight, MAX_TEXTAREA_HEIGHT_PX);
      textareaRef.current.style.height = `${nextHeight}px`;
    }
  }, [message]);

  // Track incoming messages and auto-scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight -
        container.scrollTop -
        container.clientHeight <=
      SCROLL_THRESHOLD_PX;

    const currentLen = messages.length;
    if (isNearBottom) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop =
            scrollContainerRef.current.scrollHeight;
        }
      }, 40);
      setNewMessagesCount(0);
    } else if (currentLen > prevMessagesLenRef.current) {
      setNewMessagesCount(
        (prev) => prev + (currentLen - prevMessagesLenRef.current),
      );
    }
    prevMessagesLenRef.current = currentLen;
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isFarUp =
      target.scrollHeight - target.scrollTop - target.clientHeight >
      SCROLL_THRESHOLD_PX;
    setShowScrollBottom(isFarUp);
    if (!isFarUp) {
      setNewMessagesCount(0);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
      setNewMessagesCount(0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isOverWordLimit) {
        handleSendMessage(e as any);
      }
    }
  };

  useEffect(() => {
    if (!isMobile || !isOpen || typeof document === "undefined") return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (isStaff && isOpen) {
      handleClose();
    }
  }, [isStaff, isOpen, handleClose]);

  const renderChatContent = () => {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {/* Header */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-between bg-primary px-4 py-3",
            "text-primary-foreground shadow-xs",
          )}
        >
          <div className="flex items-center gap-2">
            {viewMode === "history" || viewMode === "history-detail" ? (
              <button
                onClick={() => {
                  if (viewMode === "history-detail") {
                    setViewMode("history");
                  } else {
                    setViewMode("chat");
                  }
                }}
                className="rounded-full p-1 hover:bg-white/10"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"
              />
            )}
            <div>
              <h3 className="text-sm font-bold">
                {viewMode === "history"
                  ? "Chat History"
                  : viewMode === "history-detail"
                    ? "Ticket Messages"
                    : "GuiSIS Support"}
              </h3>
              <p className="text-[10px] opacity-80">
                {viewMode === "history"
                  ? "Your past conversations"
                  : viewMode === "history-detail"
                    ? "Read-only view"
                    : isPolling
                      ? "Live Chat"
                      : "Typically replies in minutes"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isAuthenticated && viewMode === "chat" && (
              <button
                onClick={() => {
                  setViewMode("history");
                  fetchHistoryTickets();
                }}
                className="rounded-full p-1 hover:bg-white/10"
                title="View chat history"
                aria-label="View chat history"
              >
                <History className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={cn(
            "scrollbar-thin relative min-h-0 flex-1 overflow-y-auto",
            "overscroll-contain p-3 sm:p-4",
          )}
        >
          {viewMode === "history" ? (
            isLoadingHistory ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : historyTickets.length === 0 ? (
              <div
                className={cn(
                  "flex h-full flex-col items-center justify-center",
                  "p-4 text-center",
                )}
              >
                <Clock className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-semibold text-muted-foreground">
                  No chat history
                </p>
                <p className="mt-1 text-xs text-muted-foreground/75">
                  Your closed and active tickets will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {historyTickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectHistoryTicket(t.id)}
                    className={cn(
                      "flex w-full items-center justify-between",
                      "rounded-2xl border border-glass-border p-3",
                      "text-left transition-colors hover:bg-muted/50",
                    )}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-xs font-bold">
                        Ticket #{t.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px]",
                        "font-bold uppercase",
                        t.status.toLowerCase() === "open"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {t.status}
                    </span>
                  </button>
                ))}
              </div>
            )
          ) : viewMode === "history-detail" ? (
            /* History Message Thread */
            <div className="flex flex-col space-y-1">
              {historyMessages.map((msg, idx) => {
                const isMe =
                  (user && msg.senderId === user.id) ||
                  (!user && !msg.senderId);

                const prevMsg = idx > 0 ? historyMessages[idx - 1] : null;
                const isPrevMe = prevMsg
                  ? (user && prevMsg.senderId === user.id) ||
                    (!user && !prevMsg.senderId)
                  : null;
                const timeDiff = prevMsg
                  ? new Date(msg.createdAt).getTime() -
                    new Date(prevMsg.createdAt).getTime()
                  : 0;
                const isNewStack =
                  idx === 0 ||
                  isMe !== isPrevMe ||
                  msg.senderName !== prevMsg?.senderName ||
                  timeDiff > STACK_TIME_THRESHOLD_MS;
                const showSenderLabel =
                  idx === 0 ||
                  isMe !== isPrevMe ||
                  msg.senderName !== prevMsg?.senderName;

                // Date divider
                const currDateStr = new Date(msg.createdAt).toDateString();
                const prevDateStr = prevMsg
                  ? new Date(prevMsg.createdAt).toDateString()
                  : null;
                const showDateDivider =
                  idx === 0 || currDateStr !== prevDateStr;

                const formattedDate = new Date(msg.createdAt).toLocaleString(
                  undefined,
                  {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );

                return (
                  <div key={msg.id} className="flex flex-col">
                    {showDateDivider && (
                      <div className="my-2.5 flex items-center justify-center">
                        <span
                          className={cn(
                            "rounded-full border border-glass-border",
                            "bg-muted/40 px-2.5 py-0.5 text-[9px]",
                            "font-semibold uppercase text-muted-foreground",
                          )}
                        >
                          {formatDateDivider(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex flex-col",
                        isMe ? "items-end" : "items-start",
                        isNewStack ? "mt-2" : "mt-0.5",
                      )}
                    >
                      {showSenderLabel && (
                        <span
                          className="px-1 text-[10px] text-muted-foreground"
                        >
                          {isMe ? "You" : "GuiSIS Support"}
                        </span>
                      )}
                      <div
                        onClick={() =>
                          setActiveMessageId((prev) =>
                            prev === msg.id ? null : msg.id,
                          )
                        }
                        className={cn(
                          showSenderLabel ? "mt-1" : "mt-0",
                          "max-w-[82%] rounded-2xl px-3 py-2",
                          "text-xs sm:text-sm",
                          "cursor-pointer select-none",
                          isMe
                            ? "rounded-tr-none bg-primary " +
                              "text-primary-foreground shadow-xs"
                            : "rounded-tl-none border " +
                              "border-glass-border/60 bg-muted " +
                              "text-foreground",
                        )}
                        title={formattedDate}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                      </div>
                      {activeMessageId === msg.id && (
                        <span className={cn(
                          "animate-in fade-in mt-1 px-1 text-[9px]",
                          "text-muted-foreground duration-150",
                        )}>
                          {formattedDate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          ) : !ticketId ? (
            /* Ticket Creation Form */
            <form
              onSubmit={handleStartTicket}
              className="flex h-full flex-col gap-4"
            >
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Hello! How can we help you today? Pick a topic or type your
                  concern below to start a live chat session.
                </p>

                {/* Topic Starter Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {TOPIC_STARTERS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() =>
                        setMessage((prev) =>
                          prev ? `${prev} - ${topic}` : topic
                        )
                      }
                      className={cn(
                        "rounded-full border border-glass-border bg-muted/40",
                        "px-2.5 py-1 text-[11px] font-medium text-foreground",
                        "transition-all hover:border-primary/40 hover:bg-muted",
                        "active:scale-95",
                      )}
                    >
                      <Sparkles className="mr-1 inline h-3 w-3 text-primary" />
                      {topic}
                    </button>
                  ))}
                </div>

                {!isAuthenticated && (
                  <>
                    <FormField
                      label="Name"
                      value={name}
                      onChange={setName}
                      placeholder="Juan dela Cruz"
                      required
                      noSpecialCharacters={false}
                    />

                    <FormField
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="juan@example.com"
                      noSpecialCharacters={false}
                    />
                  </>
                )}

                <FormField
                  label="Message"
                  value={message}
                  onChange={setMessage}
                  placeholder="Describe your concern here..."
                  required
                  isTextarea
                  noSpecialCharacters={false}
                  error={
                    isOverWordLimit
                      ? `Message cannot exceed ${MAX_STUDENT_WORDS} words`
                      : undefined
                  }
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                  {messageWordCount}/{MAX_STUDENT_WORDS} words
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || isOverWordLimit || !message.trim()}
                className="mt-auto w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Start Chat"
                )}
              </Button>
            </form>
          ) : (
            /* Active Message Thread */
            <div className="flex flex-col space-y-1">
              {messages.map((msg, idx) => {
                const isMe =
                  (user && msg.senderId === user.id) ||
                  (!user && !msg.senderId);

                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const isPrevMe = prevMsg
                  ? (user && prevMsg.senderId === user.id) ||
                    (!user && !prevMsg.senderId)
                  : null;
                const timeDiff = prevMsg
                  ? new Date(msg.createdAt).getTime() -
                    new Date(prevMsg.createdAt).getTime()
                  : 0;
                const isNewStack =
                  idx === 0 ||
                  isMe !== isPrevMe ||
                  msg.senderName !== prevMsg?.senderName ||
                  timeDiff > STACK_TIME_THRESHOLD_MS;
                const showSenderLabel =
                  idx === 0 ||
                  isMe !== isPrevMe ||
                  msg.senderName !== prevMsg?.senderName;

                // Date divider
                const currDateStr = new Date(msg.createdAt).toDateString();
                const prevDateStr = prevMsg
                  ? new Date(prevMsg.createdAt).toDateString()
                  : null;
                const showDateDivider =
                  idx === 0 || currDateStr !== prevDateStr;

                const formattedDate = new Date(msg.createdAt).toLocaleString(
                  undefined,
                  {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );

                return (
                  <div key={msg.id} className="flex flex-col">
                    {showDateDivider && (
                      <div className="my-2.5 flex items-center justify-center">
                        <span
                          className={cn(
                            "rounded-full border border-glass-border",
                            "bg-muted/40 px-2.5 py-0.5 text-[9px]",
                            "font-semibold uppercase text-muted-foreground",
                          )}
                        >
                          {formatDateDivider(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div
                      className={cn(
                        "flex flex-col",
                        isMe ? "items-end" : "items-start",
                        isNewStack ? "mt-2" : "mt-0.5",
                      )}
                    >
                      {showSenderLabel && (
                        <span
                          className="px-1 text-[10px] text-muted-foreground"
                        >
                          {isMe ? "You" : "GuiSIS Support"}
                        </span>
                      )}
                      <div
                        onClick={() =>
                          setActiveMessageId((prev) =>
                            prev === msg.id ? null : msg.id,
                          )
                        }
                        className={cn(
                          showSenderLabel ? "mt-1" : "mt-0",
                          "max-w-[82%] rounded-2xl px-3.5 py-2",
                          "text-xs sm:text-sm",
                          "cursor-pointer select-none",
                          isMe
                            ? "rounded-tr-none bg-primary " +
                              "text-primary-foreground shadow-xs"
                            : "rounded-tl-none border " +
                              "border-glass-border/60 bg-muted " +
                              "text-foreground",
                        )}
                        title={formattedDate}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                      </div>

                      {/* Delivery Status Indicator */}
                      <div
                        className={cn(
                          "mt-0.5 flex items-center gap-1 px-1 text-[9px]",
                          "text-muted-foreground",
                        )}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && <Check className="h-3 w-3 text-primary" />}
                      </div>

                      {activeMessageId === msg.id && (
                        <span className={cn(
                          "animate-in fade-in mt-1 px-1 text-[9px]",
                          "text-muted-foreground duration-150",
                        )}>
                          {formattedDate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Floating New Messages Button */}
          {showScrollBottom && (
            <div className={cn(
              "absolute bottom-4 right-4 z-20 flex flex-col items-end gap-1.5",
            )}>
              {newMessagesCount > 0 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={scrollToBottom}
                  className={cn(
                    "h-7 gap-1 rounded-full bg-blue-600 px-2.5 text-[11px]",
                    "text-white shadow-lg animate-bounce",
                  )}
                >
                  <ChevronDown className="h-3 w-3" />
                  <span>{newMessagesCount} new</span>
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                onClick={scrollToBottom}
                className={cn(
                  "h-7 w-7 rounded-full bg-primary text-primary-foreground",
                  "shadow-lg transition-all hover:bg-primary/90",
                )}
                aria-label="Scroll to bottom"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer Input or Read-Only Banner */}
        {viewMode === "chat" && ticketId && (
          <form
            onSubmit={handleSendMessage}
            className={cn(
            "shrink-0 space-y-1.5 border-t border-glass-border",
            "bg-card/40 p-2.5 sm:p-3",
          )}
          >
            <div className="flex items-end gap-2">
              <div className="relative min-w-0 flex-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send)"
                  className={cn(
                    "w-full resize-none rounded-xl border border-glass-border",
                    "bg-muted/20 px-3 py-2 text-xs text-foreground sm:text-sm",
                    "placeholder:text-muted-foreground/70",
                    "focus:outline-none focus:ring-1 focus:ring-primary",
                    isOverWordLimit && "border-destructive ring-destructive",
                  )}
                />
              </div>
              <Button
                type="submit"
                disabled={!message.trim() || isOverWordLimit}
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl text-white shadow-xs"
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
                {messageWordCount}/{MAX_STUDENT_WORDS} words
              </span>
            </div>
          </form>
        )}

        {viewMode === "history-detail" && (
          <div
            className={cn(
              "shrink-0 border-t border-glass-border bg-muted/20 p-3",
              "text-center text-xs text-muted-foreground",
            )}
          >
            This is a read-only view of a past conversation.
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          "fixed z-40 font-sans transition-all duration-300",
          isAuthenticated
            ? isOpen
              ? "bottom-24 left-4 right-4 sm:bottom-32 " +
                "sm:left-auto sm:right-5 xl:bottom-8 xl:left-auto xl:right-8"
              : "bottom-24 right-4 sm:bottom-32 " +
                "sm:right-5 xl:bottom-8 xl:right-8"
            : isOpen
              ? "bottom-4 left-4 right-4 sm:bottom-5 " +
                "sm:left-auto sm:right-5 xl:bottom-8 xl:left-auto xl:right-8"
              : "bottom-4 right-4 sm:bottom-5 " +
                "sm:right-5 xl:bottom-8 xl:right-8",
        )}
      >
        {/* Floating Action Menu / Updrop Button */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 12 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="relative flex flex-col items-center gap-3"
            >
              {/* Expanded Menu Items */}
              <AnimatePresence>
                {menuExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 16, scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="mb-2 flex flex-col items-center gap-3"
                  >
                    {/* Accessibility Settings Item */}
                    <div className="group relative">
                      <span className={cn(
                        "pointer-events-none absolute right-full top-1/2 mr-3",
                        "-translate-y-1/2 whitespace-nowrap rounded",
                        "bg-slate-900/90 px-2 py-1 text-xs font-medium",
                        "text-white opacity-0 shadow transition-opacity",
                        "duration-150 group-hover:opacity-100",
                      )}>
                        Accessibility Settings
                      </span>
                      <button
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("open-ui-settings"),
                          );
                          setMenuExpanded(false);
                        }}
                        className={cn(
                          "flex h-12 w-12 items-center justify-center",
                          "rounded-full border border-glass-border",
                          "bg-background",
                          "p-0 text-foreground shadow-md transition-all",
                          "duration-200 hover:scale-110 active:scale-95",
                        )}
                        aria-label="Accessibility Settings"
                      >
                        <Sliders className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Text to Speech Item */}
                    <div className="group relative">
                      <span className={cn(
                        "pointer-events-none absolute right-full top-1/2 mr-3",
                        "-translate-y-1/2 whitespace-nowrap rounded",
                        "bg-slate-900/90 px-2 py-1 text-xs font-medium",
                        "text-white opacity-0 shadow transition-opacity",
                        "duration-150 group-hover:opacity-100",
                      )}>
                        Read Aloud (TTS)
                      </span>
                      <button
                        onClick={() => {
                          window.dispatchEvent(
                            new CustomEvent("toggle-speech-reader"),
                          );
                          setMenuExpanded(false);
                        }}
                        className={cn(
                          "flex h-12 w-12 items-center justify-center",
                          "rounded-full border border-glass-border",
                          "bg-background",
                          "p-0 text-foreground shadow-md transition-all",
                          "duration-200 hover:scale-110 active:scale-95",
                        )}
                        aria-label="Toggle Text-to-Speech"
                      >
                        <AudioLines className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Support Chat Item */}
                    {!isStaff && (
                      <div className="group relative">
                        <span className={cn(
                        "pointer-events-none absolute right-full top-1/2 mr-3",
                        "-translate-y-1/2 whitespace-nowrap rounded",
                        "bg-slate-900/90 px-2 py-1 text-xs font-medium",
                        "text-white opacity-0 shadow transition-opacity",
                        "duration-150 group-hover:opacity-100",
                      )}>
                          Support Chat
                        </span>
                        <button
                          onClick={() => {
                            setIsOpen(true);
                            setMenuExpanded(false);
                          }}
                          className={cn(
                            "flex h-12 w-12 items-center justify-center",
                            "rounded-full border border-glass-border",
                          "bg-background",
                            "p-0 text-foreground shadow-md transition-all",
                            "duration-200 hover:scale-110 active:scale-95",
                          )}
                          aria-label="Open Support Chat"
                        >
                          <MessageSquare className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Trigger Button */}
              <button
                onClick={() => setMenuExpanded(!menuExpanded)}
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full",
                  "bg-primary p-0 text-primary-foreground shadow-lg",
                  "transition-all duration-200 hover:scale-110 active:scale-95",
                  "hover:shadow-xl hover:shadow-primary/25",
                  "xl:h-16 xl:w-16",
                )}
                aria-label="Accessibility & Support Menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {menuExpanded ? (
                    <motion.span
                      key="close"
                      initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center"
                    >
                      <X className="h-6 w-6 sm:h-7 sm:w-7 xl:h-8 xl:w-8" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="open"
                      initial={{ rotate: 90, opacity: 0, scale: 0.8 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center"
                    >
                      <PersonStanding
                        className="h-6 w-6 sm:h-7 sm:w-7 xl:h-8 xl:w-8"
                      />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Chat Window Panel */}
        <AnimatePresence>
          {!isMobile && isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 18 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border",
                "border-glass-border bg-background/95 shadow-2xl",
                "backdrop-blur-xl transition-all duration-300",
                "h-[calc(100dvh-6rem)] max-h-[600px] sm:h-[500px]",
                "w-full sm:w-[360px]",
              )}
            >
              {renderChatContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile, iPad, and tablet chat window */}
      {isMobile &&
        isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={cn(
              "fixed inset-0 z-[100] flex items-end justify-center",
              "bg-black/75 sm:p-4",
            )}
            role="presentation"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-default"
              onClick={handleClose}
              aria-label="Close support chat"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="GuiSIS Support Chat"
              className={cn(
                "relative z-10 flex h-[100dvh] min-h-0 w-full flex-col",
                "overflow-hidden border border-glass-border bg-background",
                "shadow-2xl sm:h-[85dvh] sm:max-h-[720px] sm:max-w-[640px]",
                "sm:rounded-xl",
              )}
            >
              {renderChatContent()}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default SupportChatWidget;

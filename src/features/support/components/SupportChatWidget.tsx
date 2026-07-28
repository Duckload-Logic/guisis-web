import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  MessageSquare,
  Send,
  X,
  Loader2,
  History,
  ArrowLeft,
  Clock,
  Accessibility,
  Sliders,
  AudioLines,
} from "lucide-react";
import { useSupportChat } from "../hooks/useSupportChat";
import { useAuth } from "@/context";
import { FormInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function SupportChatWidget() {
  const { isAdmin, isSuperAdmin, isDeveloper } = useAuth();
  const [menuExpanded, setMenuExpanded] = useState(false);
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

  const renderChatContent = () => {
    return (
      <div className="flex h-full min-h-0 flex-col">
        {/* Header */}
        <div
          className={cn(
            "flex shrink-0 items-center justify-between bg-primary px-4 py-3",
            "text-primary-foreground",
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
                className={cn(
                  "h-2 w-2 animate-pulse rounded-full",
                  "bg-emerald-400",
                )}
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
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {viewMode === "history" ? (
            isLoadingHistory ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : historyTickets.length === 0 ? (
              <div
                className={cn(
                  "flex h-full flex-col items-center",
                  "justify-center p-4 text-center",
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
            <div className="space-y-3">
              {historyMessages.map((msg) => {
                const isMe =
                  (user && msg.senderId === user.id) ||
                  (!user && !msg.senderId);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="px-1 text-[10px] text-muted-foreground">
                      {isMe ? "You" : msg.senderName}
                    </span>
                    <div
                      className={cn(
                        "mt-1 max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                        isMe
                          ? "bg-primary text-primary-foreground " +
                              "rounded-tr-none"
                          : "rounded-tl-none bg-muted text-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
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
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Hello! How can we help you today? Fill out this quick form to
                  start a live chat session.
                </p>

                {!isAuthenticated && (
                  <>
                    <FormInput
                      label="Name"
                      value={name}
                      onChange={setName}
                      placeholder="Juan dela Cruz"
                      required
                      noSpecialCharacters={false}
                    />

                    <FormInput
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="juan@example.com"
                      noSpecialCharacters={false}
                    />
                  </>
                )}

                <FormInput
                  label="Message"
                  value={message}
                  onChange={setMessage}
                  placeholder="Describe your concern here..."
                  required
                  isTextarea
                  noSpecialCharacters={false}
                  error={
                    message.trim().split(/\s+/).filter(Boolean).length > 100
                      ? "Message cannot exceed 100 words"
                      : undefined
                  }
                />
                <div className="flex justify-end text-xs text-muted-foreground">
                  {message.trim().split(/\s+/).filter(Boolean).length}/100 words
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  message.trim().split(/\s+/).filter(Boolean).length > 100
                }
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
            /* Message Thread */
            <div className="space-y-3">
              {messages.map((msg) => {
                // Determine sender category: if user ID matches current
                // or sender is guest (for anonymous sessions), it's "me"
                const isMe =
                  (user && msg.senderId === user.id) ||
                  (!user && !msg.senderId);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      isMe ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="px-1 text-[10px] text-muted-foreground">
                      {isMe ? "You" : msg.senderName}
                    </span>
                    <div
                      className={cn(
                        "mt-1 max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                        isMe
                          ? "bg-primary text-primary-foreground " +
                              "rounded-tr-none"
                          : "rounded-tl-none bg-muted text-foreground",
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Footer Input or Read-Only Banner */}
        {viewMode === "chat" && ticketId && (
          <form
            onSubmit={handleSendMessage}
            className="shrink-0 space-y-2 border-t border-glass-border p-3"
          >
            <div className="flex items-start gap-2">
              <FormInput
                label=""
                value={message}
                onChange={setMessage}
                placeholder="Type your reply..."
                noSpecialCharacters={false}
                className="min-w-0 flex-1"
                error={
                  message.trim().split(/\s+/).filter(Boolean).length > 100
                    ? "Message cannot exceed 100 words"
                    : undefined
                }
              />
              {message.trim() && (
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
                      !message.trim() ||
                      message.trim().split(/\s+/).filter(Boolean).length > 100
                    }
                    size="icon"
                    className="flex-shrink-0 text-white"
                  >
                    <Send className="h-5 w-5 min-w-5 shrink-0" />
                  </Button>
                </motion.div>
              )}
            </div>
            {message.trim() && (
              <div className="flex justify-end text-[10px] text-muted-foreground px-1">
                {message.trim().split(/\s+/).filter(Boolean).length}/100 words
              </div>
            )}
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
              ? "bottom-20 left-4 right-4 sm:left-auto sm:right-5 " +
                "sm:bottom-20 xl:bottom-8 xl:left-auto xl:right-8"
              : "bottom-20 right-4 sm:bottom-20 sm:right-5 xl:bottom-8 " +
                "xl:right-8"
            : isOpen
              ? "bottom-4 left-4 right-4 sm:bottom-5 sm:left-auto " +
                "sm:right-5 xl:bottom-8 xl:left-auto xl:right-8"
              : "bottom-4 right-4 sm:bottom-5 sm:right-5 xl:bottom-8 " +
                "xl:right-8",
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
            {menuExpanded && (
              <div className="animate-in slide-in-from-bottom-5 fade-in mb-2 flex flex-col items-center gap-3 duration-200">
                {/* Accessibility Settings Item */}
                <div className="group relative">
                  <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded bg-slate-900/90 px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100">
                    Accessibility Settings
                  </span>
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent("open-ui-settings"));
                      setMenuExpanded(false);
                    }}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center",
                      "rounded-full border border-glass-border bg-background",
                      "p-0 text-slate-700 shadow-md transition-transform",
                      "duration-200 hover:scale-110 dark:text-neutral-200",
                    )}
                    aria-label="Accessibility Settings"
                  >
                    <Sliders className="h-5 w-5" />
                  </button>
                </div>

                {/* Text to Speech Item */}
                <div className="group relative">
                  <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded bg-slate-900/90 px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100">
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
                      "rounded-full border border-glass-border bg-background",
                      "p-0 text-slate-700 shadow-md transition-transform",
                      "duration-200 hover:scale-110 dark:text-neutral-200",
                    )}
                    aria-label="Toggle Text-to-Speech"
                  >
                    <AudioLines className="h-5 w-5" />
                  </button>
                </div>

                {/* Support Chat Item */}
                {!isStaff && (
                  <div className="group relative">
                    <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded bg-slate-900/90 px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100">
                      Support Chat
                    </span>
                    <button
                      onClick={() => {
                        setIsOpen(true);
                        setMenuExpanded(false);
                      }}
                      className={cn(
                        "flex h-12 w-12 items-center justify-center",
                        "rounded-full border border-glass-border bg-background",
                        "p-0 text-slate-700 shadow-md transition-transform",
                        "duration-200 hover:scale-110 dark:text-neutral-200",
                      )}
                      aria-label="Open Support Chat"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Trigger Button */}
            <button
              onClick={() => setMenuExpanded(!menuExpanded)}
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full",
                "bg-primary p-0 text-primary-foreground shadow-lg",
                "transition-all duration-200 hover:scale-110 active:scale-95",
                "xl:h-16 xl:w-16",
              )}
              aria-label="Accessibility & Support Menu"
            >
              {menuExpanded ? (
                <X className="h-6 w-6 sm:h-7 sm:w-7 xl:h-8 xl:w-8" />
              ) : (
                <Accessibility className="h-6 w-6 sm:h-7 sm:w-7 xl:h-8 xl:w-8" />
              )}
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

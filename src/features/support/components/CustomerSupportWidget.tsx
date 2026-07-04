import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Headset, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

type SupportMessage = {
  id: string;
  sender: "support" | "user";
  body: string;
  createdAt: string;
};

const createMessageId = () =>
  `support-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const getSupportReply = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes("appointment")) {
    return "For appointment concerns, please include your preferred date, time, and a short reason so the Guidance Office can review it clearly.";
  }

  if (normalized.includes("admission") || normalized.includes("slip")) {
    return "For admission slip concerns, check your submitted slip status first. If revision is needed, mention the slip date and attach the correct proof before resubmitting.";
  }

  if (normalized.includes("iir") || normalized.includes("profile")) {
    return "For IIR profile concerns, review each section carefully and save your latest changes before leaving the form.";
  }

  if (normalized.includes("password") || normalized.includes("login")) {
    return "For login concerns, please verify your credentials and network connection. If the problem continues, contact the Guidance Office or system administrator.";
  }

  return "Thanks for reaching out. I saved your message in this chat session. Please include the page name, what you clicked, and any error message you saw so support can help faster.";
};

export default function CustomerSupportWidget() {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<SupportMessage[]>(() => [
    {
      id: "support-welcome",
      sender: "support",
      body: "Hi! How can we help you with GuiSIS today?",
      createdAt: formatTime(new Date()),
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(
    () => (isOpen ? 0 : messages.filter((item) => item.sender === "support").length),
    [isOpen, messages],
  );

  useEffect(() => {
    if (!isOpen) return;

    const scrollTimer = window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [isOpen, messages]);

  const handleToggle = () => {
    setIsOpen((value) => !value);
    window.setTimeout(() => inputRef.current?.focus(), 120);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    const now = new Date();
    const userMessage: SupportMessage = {
      id: createMessageId(),
      sender: "user",
      body: trimmedMessage,
      createdAt: formatTime(now),
    };

    const supportMessage: SupportMessage = {
      id: createMessageId(),
      sender: "support",
      body: getSupportReply(trimmedMessage),
      createdAt: formatTime(new Date(now.getTime() + 1000)),
    };

    setMessages((items) => [...items, userMessage, supportMessage]);
    setMessage("");
  };

  return (
    <div
      className={cn(
        "speech-control-ignore pointer-events-none fixed z-50 flex flex-col items-end gap-3 transition-all duration-500",
        "right-4 sm:right-5 lg:right-6",
        "bottom-[calc(env(safe-area-inset-bottom)+4.75rem)]",
        "sm:bottom-[calc(env(safe-area-inset-bottom)+5.5rem)]",
        "lg:bottom-[calc(env(safe-area-inset-bottom)+6.25rem)]",
        isMobile && "bottom-[calc(env(safe-area-inset-bottom)+9.75rem)] right-4",
      )}
    >
      {isOpen && (
        <section
          aria-label="Customer Support chat"
          className={cn(
            "pointer-events-auto w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-xl border border-border/80",
            "bg-card/95 text-card-foreground shadow-2xl backdrop-blur-xl",
          )}
        >
          <header className="flex items-center justify-between gap-3 border-b border-border/70 bg-primary/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                <Headset className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-foreground">
                  Customer Support
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  Frontend help desk for all roles
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-xl"
                aria-label="Close customer support chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((item) => {
              const isUser = item.sender === "user";

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex flex-col gap-1",
                    isUser ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[82%] rounded-xl px-3 py-2 text-sm leading-relaxed shadow-md",
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/70 bg-muted/70 text-foreground",
                    )}
                  >
                    {item.body}
                  </div>
                  <span className="px-1 text-[10px] font-medium text-muted-foreground">
                    {item.createdAt}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} aria-hidden="true" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-border/70 bg-background/80 p-3"
          >
            <input
              ref={inputRef}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type your concern..."
              className="min-h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label="Customer support message"
            />
            <Button
              type="submit"
              size="icon"
              className="h-11 w-11 rounded-xl shadow-md"
              disabled={!message.trim()}
              aria-label="Send support message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      )}

      <Button
        type="button"
        onClick={handleToggle}
        className={cn(
          "group pointer-events-auto relative flex items-center justify-center rounded-full border border-white/20 bg-primary p-0 text-primary-foreground shadow-[0_12px_40px_-8px_rgb(0,0,0,0.15)] transition-all duration-500 active:scale-95 hover:scale-105",
          "h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16",
        )}
        aria-label="Open customer support chat"
      >
        <Headset className="h-6 w-6 lg:h-7 lg:w-7" />
        {!isMobile && (
          <span
            className={cn(
              "absolute right-full mr-3 translate-x-2 whitespace-nowrap",
              "rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium",
              "text-white opacity-0 transition-all duration-200",
              "group-hover:translate-x-0 group-hover:opacity-100",
            )}
          >
            Customer Support
          </span>
        )}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md sm:h-6 sm:min-w-6 sm:px-1.5 sm:text-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </div>
  );
}

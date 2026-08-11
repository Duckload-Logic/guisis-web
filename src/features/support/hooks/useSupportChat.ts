import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context";
import { Message, Ticket } from "../types";
import {
  PostSupportTicket,
  GetSupportTicketMessages,
  PostSupportTicketMessage,
  CreateTicketPayload,
  GetMySupportTickets,
} from "../services/supportService";

export function useSupportChat() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(() => {
    return localStorage.getItem("guisis_support_ticket_id");
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // History state
  const [viewMode, setViewMode] = useState<
    "chat" | "history" | "history-detail"
  >("chat");

  // Open widget if redirected with openSupport query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("openSupport") === "true") {
      setIsOpen(true);
      const urlTicketId = params.get("ticketId");
      if (urlTicketId) {
        setTicketId(urlTicketId);
        localStorage.setItem("guisis_support_ticket_id", urlTicketId);
        setViewMode("chat");
      }
      const url = new URL(window.location.href);
      url.searchParams.delete("openSupport");
      url.searchParams.delete("ticketId");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [location]);
  const [historyTickets, setHistoryTickets] = useState<Ticket[]>([]);
  const [selectedHistoryTicketId, setSelectedHistoryTicketId] = useState<
    string | null
  >(null);
  const [historyMessages, setHistoryMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistoryTickets = async () => {
    if (!isAuthenticated) return;
    setIsLoadingHistory(true);
    try {
      const data = await GetMySupportTickets();
      if (Array.isArray(data)) {
        setHistoryTickets(data);
      }
    } catch (err) {
      console.error("[SupportWidget] {FetchHistoryTickets}:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const selectHistoryTicket = async (id: string) => {
    setSelectedHistoryTicketId(id);
    setViewMode("history-detail");
    try {
      const data = await GetSupportTicketMessages(id);
      if (Array.isArray(data)) {
        setHistoryMessages(data);
      }
    } catch (err) {
      console.error("[SupportWidget] {SelectHistoryTicket}:", err);
    }
  };

  // Poll history messages if viewing history detail and widget is open
  useEffect(() => {
    if (!isOpen || viewMode !== "history-detail" ||
        !selectedHistoryTicketId) {
      return;
    }

    const fetchHistoryMsgs = async () => {
      try {
        const data = await GetSupportTicketMessages(selectedHistoryTicketId);
        if (Array.isArray(data)) {
          setHistoryMessages(data);
        }
      } catch (err) {
        console.error("[SupportWidget] {FetchHistoryMsgs}:", err);
      }
    };

    fetchHistoryMsgs();
    const interval = setInterval(fetchHistoryMsgs, 5000);

    return () => clearInterval(interval);
  }, [isOpen, viewMode, selectedHistoryTicketId]);

  // Poll messages if ticket is active and widget is open
  useEffect(() => {
    if (!isOpen || !ticketId) return;

    const fetchMessages = async () => {
      try {
        const data = await GetSupportTicketMessages(ticketId);
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err: any) {
        console.error("[SupportWidget] {FetchMessages}:", err);
        if (err?.response?.status === 403 ||
            err?.response?.status === 401) {
          setTicketId(null);
          localStorage.removeItem("guisis_support_ticket_id");
        }
      }
    };

    fetchMessages();
    setIsPolling(true);

    const interval = setInterval(fetchMessages, 3000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [isOpen, ticketId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, historyMessages, isOpen, viewMode]);

  // Reset ticket state when auth/user identity changes
  const prevUserIdRef = useRef<string | undefined>(user?.id);
  const prevIsAuthRef = useRef<boolean>(isAuthenticated);

  useEffect(() => {
    if (
      prevIsAuthRef.current !== isAuthenticated ||
      prevUserIdRef.current !== user?.id
    ) {
      setTicketId(null);
      localStorage.removeItem("guisis_support_ticket_id");
      setViewMode("chat");
      setMessages([]);
      setHistoryTickets([]);
      setHistoryMessages([]);
      setSelectedHistoryTicketId(null);
      setName("");
      setEmail("");
      setMessage("");

      prevIsAuthRef.current = isAuthenticated;
      prevUserIdRef.current = user?.id;
    }
  }, [isAuthenticated, user?.id]);

  const handleStartTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateTicketPayload = { message };
      if (!isAuthenticated) {
        payload.guestName = name || "Guest";
        payload.guestEmail = email || "";
      }

      const ticket = await PostSupportTicket(payload);
      if (ticket && ticket.id) {
        setTicketId(ticket.id);
        localStorage.setItem(
          "guisis_support_ticket_id",
          ticket.id
        );
        setMessage("");
      }
    } catch (err) {
      console.error("[SupportWidget] {StartTicket}:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !ticketId) return;

    const textToSend = message;
    setMessage("");

    try {
      await PostSupportTicketMessage(ticketId, {
        message: textToSend,
      });
      // Refresh messages instantly
      const data = await GetSupportTicketMessages(ticketId);
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (err) {
      console.error("[SupportWidget] {SendMessage}:", err);
      // Put message back in input if it failed
      setMessage(textToSend);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return {
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
    selectedHistoryTicketId,
    historyMessages,
    isLoadingHistory,
    fetchHistoryTickets,
    selectHistoryTicket,
  };
}

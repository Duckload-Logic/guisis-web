import apiClient from "@/lib/api";
import { Message, Ticket } from "../types";

export interface CreateTicketPayload {
  message: string;
  guestName?: string;
  guestEmail?: string;
}

export interface CreateMessagePayload {
  message: string;
}

/**
 * Creates a new support ticket (starts chat session)
 */
export async function PostSupportTicket(
  payload: CreateTicketPayload
): Promise<Ticket> {
  const { data } = await apiClient.post<Ticket>(
    "/support/tickets",
    payload
  );
  return data;
}

/**
 * Fetches all messages for a specific support ticket
 */
export async function GetSupportTicketMessages(
  ticketId: string
): Promise<Message[]> {
  const { data } = await apiClient.get<Message[]>(
    `/support/tickets/${ticketId}/messages`
  );
  return data;
}

/**
 * Sends a message in a specific support ticket
 */
export async function PostSupportTicketMessage(
  ticketId: string,
  payload: CreateMessagePayload
): Promise<Message> {
  const { data } = await apiClient.post<Message>(
    `/support/tickets/${ticketId}/messages`,
    payload
  );
  return data;
}

export interface PaginatedTicketsResponse {
  tickets: Ticket[];
  meta: {
    total: number;
    page: number;
    pagesSize: number;
    totalPages: number;
  };
}

/**
 * Fetches all support tickets (admin view) with pagination
 */
export async function GetSupportTickets(
  page: number = 1,
  pageSize: number = 10,
  status: string = ""
): Promise<PaginatedTicketsResponse> {
  const statusParam = status ? `&status=${status}` : "";
  const { data } = await apiClient.get<PaginatedTicketsResponse>(
    `/support/tickets?page=${page}&page_size=${pageSize}${statusParam}`
  );
  return data;
}

/**
 * Resolves/closes a support ticket (admin operation)
 */
export async function PatchSupportTicketStatus(
  ticketId: string
): Promise<Ticket> {
  const { data } = await apiClient.patch<Ticket>(
    `/support/tickets/${ticketId}/status`
  );
  return data;
}

/**
 * Fetches all support tickets created by the logged-in student
 */
export async function GetMySupportTickets(): Promise<Ticket[]> {
  const { data } = await apiClient.get<Ticket[]>("/support/my-tickets");
  return data;
}

/**
 * Marks a support ticket as read (admin operation)
 */
export async function PatchSupportTicketRead(
  ticketId: string
): Promise<{ message: string }> {
  const { data } = await apiClient.patch<{ message: string }>(
    `/support/tickets/${ticketId}/read`
  );
  return data;
}

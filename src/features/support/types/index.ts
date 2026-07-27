export interface Message {
  id: string;
  ticketId: string;
  senderId?: string;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  studentName?: string;
  studentEmail?: string;
  profilePicture?: string;
  lastMessage?: string;
  isRead?: boolean;
}

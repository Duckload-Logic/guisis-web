export interface NotificationEntry {
  id: string;
  receiverId?: string | null;
  actorId?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  isTouched: boolean;
  createdAt: string;
}

export interface ListNotificationsParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

export interface ListNotificationsResponse {
  notifications: NotificationEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  unreadCount: number;
  untouchedCount: number;
}


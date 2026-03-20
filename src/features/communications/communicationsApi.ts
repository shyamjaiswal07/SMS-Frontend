import apiClient from "@/services/apiClient";

export type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

export type AnnouncementRow = {
  id: number;
  title: string;
  body: string;
  target_roles?: string[];
  publish_at?: string | null;
  expire_at?: string | null;
  is_pinned?: boolean;
  published_by?: number | null;
};

export type ThreadRow = {
  id: number;
  subject?: string;
  created_by?: number | null;
  is_group?: boolean;
  created_at?: string;
};

export type ParticipantRow = {
  id: number;
  thread: number;
  user: number;
  is_muted?: boolean;
  last_read_at?: string | null;
};

export type MessageRow = {
  id: number;
  thread: number;
  sender?: number | null;
  body: string;
  attachment_url?: string;
  status?: string;
  created_at?: string;
};

export type NotificationRow = {
  id: number;
  user: number;
  title: string;
  body?: string;
  channel?: string;
  status?: string;
  scheduled_at?: string | null;
  sent_at?: string | null;
  read_at?: string | null;
};

export type UnreadCount = {
  unread: number;
  by_channel: Array<{ channel: string; total: number }>;
};

const get = async <T>(url: string, params?: Record<string, unknown>) => {
  const res = await apiClient.get<T>(url, { params });
  return res.data;
};

const post = async <T>(url: string, payload: Record<string, unknown>) => {
  const res = await apiClient.post<T>(url, payload);
  return res.data;
};

export const communicationsApi = {
  announcements: {
    list: (params?: Record<string, unknown>) => get<Paginated<AnnouncementRow>>(`/api/communications/announcements/`, params),
    create: (payload: Record<string, unknown>) => post<AnnouncementRow>(`/api/communications/announcements/`, payload),
  },
  threads: {
    list: (params?: Record<string, unknown>) => get<Paginated<ThreadRow>>(`/api/communications/message-threads/`, params),
    create: (payload: Record<string, unknown>) => post<ThreadRow>(`/api/communications/message-threads/`, payload),
  },
  participants: {
    list: (params?: Record<string, unknown>) => get<Paginated<ParticipantRow>>(`/api/communications/message-participants/`, params),
    create: (payload: Record<string, unknown>) => post<ParticipantRow>(`/api/communications/message-participants/`, payload),
  },
  messages: {
    list: (params?: Record<string, unknown>) => get<Paginated<MessageRow>>(`/api/communications/messages/`, params),
    create: (payload: Record<string, unknown>) => post<MessageRow>(`/api/communications/messages/`, payload),
  },
  notifications: {
    list: (params?: Record<string, unknown>) => get<Paginated<NotificationRow>>(`/api/communications/notifications/`, params),
    create: (payload: Record<string, unknown>) => post<NotificationRow>(`/api/communications/notifications/`, payload),
    unreadCount: () => get<UnreadCount>(`/api/communications/notifications/unread-count/`),
  },
};

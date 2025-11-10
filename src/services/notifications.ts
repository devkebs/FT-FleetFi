import { TokenManager } from './api';

const API_BASE = 'http://127.0.0.1:8000/api';

export interface Notification {
  id: number;
  user_id: number;
  type: 'kyc_approved' | 'kyc_rejected' | 'investment_completed' | 'payout_received' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  current_page: number;
  last_page: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

/**
 * Get all notifications for current user
 */
export async function getNotifications(unreadOnly: boolean = false, page: number = 1): Promise<NotificationListResponse> {
  const token = TokenManager.get();
  const params = new URLSearchParams();
  if (unreadOnly) params.append('unread_only', 'true');
  params.append('page', page.toString());

  const response = await fetch(`${API_BASE}/notifications?${params.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE}/notifications/unread-count`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch unread count');
  }

  const data: UnreadCountResponse = await response.json();
  return data.unread_count;
}

/**
 * Mark notification as read
 */
export async function markAsRead(id: number): Promise<Notification> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }

  const data = await response.json();
  return data.notification;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<number> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE}/notifications/mark-all-read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to mark all as read');
  }

  const data = await response.json();
  return data.count;
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: number): Promise<void> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE}/notifications/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
}

/**
 * Delete all read notifications
 */
export async function deleteAllRead(): Promise<number> {
  const token = TokenManager.get();

  const response = await fetch(`${API_BASE}/notifications/delete-all-read`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete read notifications');
  }

  const data = await response.json();
  return data.count;
}

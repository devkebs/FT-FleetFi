import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
  data?: Record<string, any>;
}

interface NotificationBellProps {
  onNavigate?: (url: string) => void;
  pollInterval?: number; // in milliseconds, default 30000 (30s)
}

interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

interface UnreadCountResponse {
  count: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onNavigate,
  pollInterval = 30000
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await apiClient.get('/notifications?per_page=10') as NotificationsResponse;
      setNotifications(response?.notifications || []);
      setUnreadCount(response?.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await apiClient.get('/notifications/unread-count') as UnreadCountResponse;
      setUnreadCount(response?.count || 0);
    } catch {
      // Silently fail - don't disrupt user experience
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // Poll for unread count more frequently
    if (pollInterval > 0) {
      const interval = setInterval(fetchUnreadCount, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchNotifications, fetchUnreadCount, pollInterval]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = async () => {
    if (!showDropdown) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiClient.post(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    if (notification.action_url && onNavigate) {
      onNavigate(notification.action_url);
    }

    setShowDropdown(false);
  };

  const getNotificationIcon = (type: string): string => {
    const icons: Record<string, string> = {
      payout: 'bi-cash-coin text-success',
      investment: 'bi-graph-up-arrow text-primary',
      welcome: 'bi-star text-warning',
      vehicle_assignment: 'bi-truck text-info',
      trip_completed: 'bi-check-circle text-success',
      maintenance_alert: 'bi-wrench text-warning',
      withdrawal_pending: 'bi-hourglass text-warning',
      withdrawal_completed: 'bi-check2-circle text-success',
      withdrawal_rejected: 'bi-x-circle text-danger',
      swap_task_pending: 'bi-arrow-repeat text-info',
      swap_task_completed: 'bi-check-circle text-success',
      system: 'bi-gear text-secondary',
      alert: 'bi-exclamation-triangle text-warning'
    };
    return icons[type] || 'bi-bell text-primary';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="position-relative" ref={dropdownRef}>
      <button
        className="btn btn-link text-dark position-relative p-2"
        onClick={handleToggle}
        aria-label="Notifications"
        style={{ fontSize: '1.25rem' }}
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
            <span className="visually-hidden">unread notifications</span>
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          className="dropdown-menu dropdown-menu-end show shadow-lg"
          style={{
            width: '360px',
            maxHeight: '480px',
            overflow: 'hidden',
            position: 'absolute',
            right: 0,
            top: '100%',
            zIndex: 1050
          }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
            <h6 className="mb-0">
              <i className="bi bi-bell me-2"></i>
              Notifications
            </h6>
            {unreadCount > 0 && (
              <button
                className="btn btn-sm btn-link text-primary p-0"
                onClick={handleMarkAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-bell-slash fs-2 mb-2 d-block"></i>
                <p className="mb-0">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`d-flex px-3 py-2 border-bottom notification-item ${
                    !notification.is_read ? 'bg-light' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="me-3 mt-1">
                    <i className={`bi ${getNotificationIcon(notification.type)} fs-5`}></i>
                  </div>
                  <div className="flex-grow-1 min-width-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <h6 className={`mb-1 ${!notification.is_read ? 'fw-bold' : ''}`} style={{ fontSize: '0.9rem' }}>
                        {notification.title}
                      </h6>
                      {!notification.is_read && (
                        <span className="badge bg-primary rounded-pill ms-2" style={{ fontSize: '0.6rem' }}>
                          New
                        </span>
                      )}
                    </div>
                    <p className="mb-1 text-muted small text-truncate" style={{ maxWidth: '250px' }}>
                      {notification.message}
                    </p>
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      {formatTimeAgo(notification.created_at)}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="text-center py-2 border-top bg-light">
              <button
                className="btn btn-sm btn-link text-primary"
                onClick={() => {
                  if (onNavigate) onNavigate('/notifications');
                  setShowDropdown(false);
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        .notification-item:hover {
          background-color: #f8f9fa !important;
        }
        .min-width-0 {
          min-width: 0;
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;

import React, { useState, useEffect } from 'react';
import { 
  Notification, 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from '../services/notifications';

interface NotificationCenterProps {
  onNotificationClick?: (notification: Notification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationClick }) => {
  const [show, setShow] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (show) {
      loadNotifications();
    }
  }, [show, showUnreadOnly]);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load unread count:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(showUnreadOnly);
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark as read:', err);
      }
    }

    // Navigate if action_url provided
    if (notification.action_url && onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'success', title: 'Success', message: 'All notifications marked as read' }
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Error', message: 'Failed to mark all as read' }
      }));
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      loadUnreadCount();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Error', message: 'Failed to delete notification' }
      }));
    }
  };

  const getNotificationIcon = (type: string): string => {
    switch (type) {
      case 'kyc_approved':
        return 'check-circle-fill text-success';
      case 'kyc_rejected':
        return 'x-circle-fill text-danger';
      case 'investment_completed':
        return 'cash-coin text-primary';
      case 'payout_received':
        return 'wallet2 text-success';
      case 'system_alert':
        return 'exclamation-triangle-fill text-warning';
      default:
        return 'bell-fill';
    }
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="position-relative">
      {/* Bell Icon with Badge */}
      <button
        className="btn btn-link position-relative p-0"
        onClick={() => setShow(!show)}
        style={{ fontSize: '1.5rem', color: '#333' }}
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: '0.65rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {show && (
        <>
          {/* Backdrop */}
          <div 
            className="position-fixed top-0 start-0 w-100 h-100" 
            style={{ zIndex: 1040 }}
            onClick={() => setShow(false)}
          ></div>

          {/* Notification Dropdown */}
          <div 
            className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg"
            style={{ 
              width: '400px', 
              maxHeight: '500px', 
              zIndex: 1050,
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <h6 className="mb-0 fw-bold">Notifications</h6>
              <div className="btn-group btn-group-sm">
                <button
                  className={`btn ${!showUnreadOnly ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setShowUnreadOnly(false)}
                >
                  All
                </button>
                <button
                  className={`btn ${showUnreadOnly ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setShowUnreadOnly(true)}
                >
                  Unread
                </button>
              </div>
            </div>

            {/* Actions */}
            {notifications?.length > 0 && unreadCount > 0 && (
              <div className="px-3 py-2 bg-light border-bottom">
                <button
                  className="btn btn-sm btn-link p-0"
                  onClick={handleMarkAllRead}
                >
                  <i className="bi bi-check-all me-1"></i>
                  Mark all as read
                </button>
              </div>
            )}

            {/* Notification List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}

              {!loading && (!notifications || notifications.length === 0) && (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-bell-slash display-4 d-block mb-2"></i>
                  <p>No notifications</p>
                </div>
              )}

              {!loading && notifications?.map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 border-bottom position-relative ${
                    !notification.is_read ? 'bg-light' : ''
                  }`}
                  style={{ cursor: notification.action_url ? 'pointer' : 'default' }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="d-flex align-items-start">
                    {/* Icon */}
                    <div className="flex-shrink-0 me-3">
                      <i className={`bi bi-${getNotificationIcon(notification.type)} fs-4`}></i>
                    </div>

                    {/* Content */}
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="mb-1 fw-bold" style={{ fontSize: '0.9rem' }}>
                          {notification.title}
                        </h6>
                        {!notification.is_read && (
                          <span 
                            className="badge bg-primary rounded-pill" 
                            style={{ fontSize: '0.6rem' }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="mb-1 text-muted" style={{ fontSize: '0.85rem' }}>
                        {notification.message}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {formatTime(notification.created_at)}
                        </small>
                        <button
                          className="btn btn-sm btn-link text-danger p-0"
                          onClick={(e) => handleDelete(notification.id, e)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

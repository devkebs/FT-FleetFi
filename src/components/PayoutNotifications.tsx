import React, { useState, useEffect } from 'react';
import { Bell, DollarSign, CheckCircle } from 'lucide-react';

export interface PayoutNotification {
  id: string;
  title: string;
  message: string;
  amount: number;
  currency: string;
  asset_name: string;
  timestamp: string;
  read: boolean;
}

interface PayoutNotificationsProps {
  notifications?: PayoutNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  className?: string;
}

export const PayoutNotifications: React.FC<PayoutNotificationsProps> = ({ 
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  className = ''
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<PayoutNotification[]>(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const unreadCount = localNotifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setLocalNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    onMarkAsRead?.(id);
  };

  const handleMarkAllAsRead = () => {
    setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
    onMarkAllAsRead?.();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`position-relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        className="btn btn-light position-relative"
        onClick={() => setShowDropdown(!showDropdown)}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div 
            className="position-fixed top-0 start-0 w-100 h-100" 
            style={{ zIndex: 1040 }}
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content */}
          <div 
            className="card position-absolute shadow-lg" 
            style={{ 
              top: '100%', 
              right: 0, 
              marginTop: '0.5rem',
              width: '380px',
              maxWidth: '90vw',
              zIndex: 1050,
              maxHeight: '600px',
              overflowY: 'auto'
            }}
          >
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                Notifications
                {unreadCount > 0 && (
                  <span className="badge bg-primary ms-2">{unreadCount}</span>
                )}
              </h6>
              {unreadCount > 0 && (
                <button 
                  className="btn btn-link btn-sm text-decoration-none p-0"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="list-group list-group-flush">
              {localNotifications.length === 0 ? (
                <div className="text-center py-5">
                  <Bell className="text-muted mb-3" size={48} />
                  <p className="text-muted mb-0">No notifications</p>
                  <small className="text-muted">
                    You'll be notified when you receive payouts
                  </small>
                </div>
              ) : (
                localNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`list-group-item list-group-item-action ${
                      !notification.read ? 'bg-primary bg-opacity-5 border-start border-primary border-3' : ''
                    }`}
                  >
                    <div className="d-flex w-100 justify-content-between align-items-start">
                      <div className="d-flex align-items-start flex-grow-1">
                        <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3 mt-1">
                          <DollarSign className="text-success" size={20} />
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="mb-1">{notification.title}</h6>
                            {!notification.read && (
                              <button
                                className="btn btn-link btn-sm p-0 ms-2"
                                onClick={() => handleMarkAsRead(notification.id)}
                                title="Mark as read"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                          </div>
                          <p className="mb-1 small text-muted">{notification.message}</p>
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <span className="badge bg-success">
                              +{(Number(notification.amount) || 0).toLocaleString()} {notification.currency}
                            </span>
                            <small className="text-muted">
                              {formatTime(notification.timestamp)}
                            </small>
                          </div>
                          <small className="text-muted d-block mt-1">
                            {notification.asset_name}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {localNotifications.length > 5 && (
              <div className="card-footer text-center">
                <button className="btn btn-sm btn-link text-decoration-none">
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PayoutNotifications;

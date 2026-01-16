import React, { useState, useEffect } from 'react';
import { NotificationAPI } from '../services/api';

interface Notification {
    id: string;
    data: {
        title: string;
        message: string;
        action_url: string;
        severity?: string;
    };
    read_at: string | null;
    created_at: string;
}

const NotificationBell: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();

        // Poll for new notifications every minute
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await NotificationAPI.getNotifications();
            const notifs = response.data.notifications;
            setNotifications(notifs);
            setUnreadCount(notifs.filter((n: Notification) => !n.read_at).length);
        } catch (error) {
            console.error('Failed to load notifications');
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await NotificationAPI.markAsRead(id);
            // Optimistically update UI
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read');
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const minutes = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="dropdown position-relative">
            <button
                className="btn btn-link nav-link position-relative"
                onClick={() => setShowDropdown(!showDropdown)}
                style={{ color: '#555' }}
            >
                <i className="bi bi-bell-fill" style={{ fontSize: '1.2rem' }}></i>
                {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="dropdown-menu dropdown-menu-end show" style={{ width: '350px', maxHeight: '500px', overflowY: 'auto' }}>
                    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                        <h6 className="mb-0">Notifications</h6>
                        <button
                            className="btn btn-sm btn-link text-decoration-none"
                            onClick={async () => {
                                await NotificationAPI.markAllAsRead();
                                loadNotifications();
                            }}
                        >
                            Mark all read
                        </button>
                    </div>

                    <div className="list-group list-group-flush">
                        {notifications.length === 0 ? (
                            <div className="p-3 text-center text-muted">Thinking... No notifications</div>
                        ) : (
                            notifications.map(note => (
                                <div
                                    key={note.id}
                                    className={`list-group-item list-group-item-action ${!note.read_at ? 'bg-light' : ''}`}
                                    onClick={() => handleMarkAsRead(note.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex w-100 justify-content-between">
                                        <h6 className="mb-1 text-primary">{note.data.title}</h6>
                                        <small className="text-muted">{getTimeAgo(note.created_at)}</small>
                                    </div>
                                    <p className="mb-1 small">{note.data.message}</p>
                                    {note.data.severity === 'critical' && (
                                        <span className="badge bg-danger mt-1">Critical Priority</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;

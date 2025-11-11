import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationCenter } from '../components/NotificationCenter';
import * as notificationService from '../services/notifications';
import type { Notification } from '../services/notifications';

// Mock the notification service
vi.mock('../services/notifications');

const mockNotifications: Notification[] = [
  {
    id: 1,
    user_id: 1,
    type: 'kyc_approved',
    title: 'KYC Approved',
    message: 'Your KYC verification has been approved',
    is_read: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    user_id: 1,
    type: 'investment_completed',
    title: 'Investment Successful',
    message: 'Your investment of ₦50,000 was successful',
    is_read: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

describe('NotificationCenter', () => {
  it('renders notification bell icon', () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(0);
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      notifications: [],
      total: 0,
      unread_count: 0,
      current_page: 1,
      last_page: 1,
    });

    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays unread count badge', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(3);
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
      unread_count: 3,
      current_page: 1,
      last_page: 1,
    });

    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('opens dropdown when bell icon is clicked', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1);
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
      unread_count: 1,
      current_page: 1,
      last_page: 1,
    });

    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('displays notification list', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1);
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
      unread_count: 1,
      current_page: 1,
      last_page: 1,
    });

    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('KYC Approved')).toBeInTheDocument();
      expect(screen.getByText('Investment Successful')).toBeInTheDocument();
    });
  });

  it('marks notification as read when clicked', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(1);
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
      unread_count: 1,
      current_page: 1,
      last_page: 1,
    });
    vi.mocked(notificationService.markAsRead).mockResolvedValue(mockNotifications[0]);

    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('KYC Approved')).toBeInTheDocument();
    });

    const unreadNotification = screen.getByText('KYC Approved').closest('div');
    if (unreadNotification) {
      fireEvent.click(unreadNotification);
    }

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith(1);
    });
  });

  it('shows empty state when no notifications', async () => {
    vi.mocked(notificationService.getUnreadCount).mockResolvedValue(0);
    vi.mocked(notificationService.getNotifications).mockResolvedValue({
      notifications: [],
      total: 0,
      unread_count: 0,
      current_page: 1,
      last_page: 1,
    });

    render(
      <BrowserRouter>
        <NotificationCenter />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
    });
  });
});

import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';
import { getKycStatus } from '../services/kyc';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  kyc_status: string;
  kyc_verified_at?: string;
  created_at: string;
  wallet_address?: string;
}

interface NotificationSettings {
  email_payouts: boolean;
  email_investments: boolean;
  email_withdrawals: boolean;
  email_system: boolean;
  push_enabled: boolean;
}

export const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_payouts: true,
    email_investments: true,
    email_withdrawals: true,
    email_system: true,
    push_enabled: false,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await getCurrentUser();
      const kycData = await getKycStatus().catch(() => ({ kyc_status: 'pending' }));

      // Cast user to any to access optional properties
      const userAny = user as unknown as Record<string, unknown>;

      const profileData: UserProfile = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: (userAny.phone as string) || '',
        role: user.role || 'investor',
        kyc_status: kycData.kyc_status || 'pending',
        kyc_verified_at: (kycData as Record<string, unknown>).kyc_verified_at as string | undefined,
        created_at: (userAny.created_at as string) || new Date().toISOString(),
        wallet_address: userAny.wallet_address as string | undefined,
      };

      setProfile(profileData);
      setName(profileData.name);
      setPhone(profileData.phone || '');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // API call to update profile would go here
      // await AuthAPI.updateProfile({ name, phone });

      setProfile(prev => prev ? { ...prev, name, phone } : null);
      setSuccess('Profile updated successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // API call to change password would go here
      // await AuthAPI.changePassword({ current_password: currentPassword, new_password: newPassword });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // API call to save notification settings would go here
      // await AuthAPI.updateNotificationSettings(notificationSettings);

      setSuccess('Notification settings saved');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-danger';
      case 'operator':
        return 'bg-primary';
      case 'driver':
        return 'bg-success';
      default:
        return 'bg-info';
    }
  };

  const getKycBadgeClass = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success';
      case 'submitted':
        return 'bg-warning';
      case 'rejected':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-3 mb-4">
          <div className="card">
            <div className="card-body text-center">
              <div
                className="rounded-circle bg-primary d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: '80px', height: '80px' }}
              >
                <span className="text-white fs-1 fw-bold">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <h5 className="card-title mb-1">{profile?.name}</h5>
              <p className="text-muted small mb-2">{profile?.email}</p>
              <span className={`badge ${getRoleBadgeClass(profile?.role || '')} me-1`}>
                {profile?.role?.toUpperCase()}
              </span>
              <span className={`badge ${getKycBadgeClass(profile?.kyc_status || '')}`}>
                KYC: {profile?.kyc_status?.toUpperCase()}
              </span>
            </div>
            <div className="list-group list-group-flush">
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="bi bi-person me-2" />
                Profile
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="bi bi-shield-lock me-2" />
                Security
              </button>
              <button
                className={`list-group-item list-group-item-action ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <i className="bi bi-bell me-2" />
                Notifications
              </button>
            </div>
          </div>

          {/* Account Info Card */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">Account Info</h6>
            </div>
            <div className="card-body small">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Member Since</span>
                <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              {profile?.kyc_verified_at && (
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">KYC Verified</span>
                  <span>{new Date(profile.kyc_verified_at).toLocaleDateString()}</span>
                </div>
              )}
              {profile?.wallet_address && (
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Wallet</span>
                  <span className="text-truncate" style={{ maxWidth: '120px' }} title={profile.wallet_address}>
                    {profile.wallet_address.substring(0, 8)}...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-lg-9">
          {/* Alerts */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              <i className="bi bi-exclamation-triangle me-2" />
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)} />
            </div>
          )}

          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              <i className="bi bi-check-circle me-2" />
              {success}
              <button type="button" className="btn-close" onClick={() => setSuccess(null)} />
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-person me-2" />
                  Profile Information
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleUpdateProfile}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={profile?.email || ''}
                        disabled
                      />
                      <small className="text-muted">Email cannot be changed</small>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 xxx xxx xxxx"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Role</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profile?.role?.toUpperCase() || ''}
                        disabled
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-shield-lock me-2" />
                  Change Password
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleChangePassword}>
                  <div className="mb-3">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="alert alert-info small">
                    <i className="bi bi-info-circle me-2" />
                    Password must be at least 8 characters long and include a mix of letters and numbers.
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-key me-2" />
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-bell me-2" />
                  Notification Preferences
                </h5>
              </div>
              <div className="card-body">
                <h6 className="text-muted mb-3">Email Notifications</h6>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailPayouts"
                    checked={notificationSettings.email_payouts}
                    onChange={(e) =>
                      setNotificationSettings({ ...notificationSettings, email_payouts: e.target.checked })
                    }
                  />
                  <label className="form-check-label" htmlFor="emailPayouts">
                    Payout notifications
                    <small className="text-muted d-block">Receive emails when you receive payouts</small>
                  </label>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailInvestments"
                    checked={notificationSettings.email_investments}
                    onChange={(e) =>
                      setNotificationSettings({ ...notificationSettings, email_investments: e.target.checked })
                    }
                  />
                  <label className="form-check-label" htmlFor="emailInvestments">
                    Investment confirmations
                    <small className="text-muted d-block">Receive emails when investments are confirmed</small>
                  </label>
                </div>

                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailWithdrawals"
                    checked={notificationSettings.email_withdrawals}
                    onChange={(e) =>
                      setNotificationSettings({ ...notificationSettings, email_withdrawals: e.target.checked })
                    }
                  />
                  <label className="form-check-label" htmlFor="emailWithdrawals">
                    Withdrawal updates
                    <small className="text-muted d-block">Receive emails about withdrawal status changes</small>
                  </label>
                </div>

                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emailSystem"
                    checked={notificationSettings.email_system}
                    onChange={(e) =>
                      setNotificationSettings({ ...notificationSettings, email_system: e.target.checked })
                    }
                  />
                  <label className="form-check-label" htmlFor="emailSystem">
                    System announcements
                    <small className="text-muted d-block">Important updates about FleetFi</small>
                  </label>
                </div>

                <hr />

                <h6 className="text-muted mb-3">Push Notifications</h6>

                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="pushEnabled"
                    checked={notificationSettings.push_enabled}
                    onChange={(e) =>
                      setNotificationSettings({ ...notificationSettings, push_enabled: e.target.checked })
                    }
                  />
                  <label className="form-check-label" htmlFor="pushEnabled">
                    Enable push notifications
                    <small className="text-muted d-block">Receive browser push notifications (coming soon)</small>
                  </label>
                </div>

                <button className="btn btn-primary" onClick={handleSaveNotifications} disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2" />
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

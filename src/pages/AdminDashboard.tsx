import React, { useState, useEffect } from 'react';
import { getAdminOverview, getAdminUsers, getRevenueStats, updateUserRole, toggleUserStatus, AdminOverview, AdminUser, RevenueStats, getAuditLogs, AuditLogEntry, createUser } from '../services/admin';
import { fetchConfigSettings, updateConfigSetting, ConfigSetting, fetchTrovoTechStatus, TrovoTechStatus, testTrovoTechConnection, ConnectionTestResult } from '../services/adminConfig';
import { getPendingKyc, reviewKyc, PendingKycUser, pollKyc } from '../services/kyc';
import { getAdminAssets, createAdminAsset, updateAdminAsset, updateAdminAssetStatus, deleteAdminAsset, AdminAsset } from '../services/adminAssets';
import { fetchRevenueSummary, fetchRides, RevenueBreakdown as RevenueBreakdownType, Ride } from '../services/api';
import { AdminRoleManager } from '../components/AdminRoleManager';
import { TelemetryWidget } from '../components/TelemetryWidget';
import { AnalyticsCharts } from '../components/AnalyticsCharts';
import RevenueBreakdown from '../components/RevenueBreakdown';


export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [revenueStats, setRevenueStats] = useState<RevenueStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueBreakdownType | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(false);
  const [pendingKyc, setPendingKyc] = useState<PendingKycUser[]>([]);
  const [kycPolling, setKycPolling] = useState(false);
  const [kycPollStatus, setKycPollStatus] = useState<string | null>(null);
  const [kycPollError, setKycPollError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'kyc' | 'assets' | 'revenue' | 'settings' | 'logs' | 'analytics' | 'telemetry'>('overview');

  // Admin theme styles
  const adminTheme = {
    background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
    cardBg: 'rgba(20, 20, 20, 0.95)',
    cardBorder: '1px solid #00ff41',
    textPrimary: '#00ff41',
    textSecondary: '#00cc33',
    accent: '#00ff41',
    shadow: '0 4px 20px rgba(0, 255, 65, 0.2)'
  };

  // Assets state
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  // Settings state
  const [settings, setSettings] = useState<ConfigSetting[]>([]);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [trovotechStatus, setTrovotechStatus] = useState<TrovoTechStatus | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<ConnectionTestResult | null>(null);

  // Audit logs state
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logActionFilter, setLogActionFilter] = useState('');
  const [logEntityFilter, setLogEntityFilter] = useState('');

  // Settings validation state
  const [settingErrors, setSettingErrors] = useState<Record<string, string | null>>({});
  const [assetsPage, setAssetsPage] = useState(1);
  const [assetsTotal, setAssetsTotal] = useState(0);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AdminAsset | null>(null);
  const [assetForm, setAssetForm] = useState<{ asset_id: string; type: 'vehicle'|'battery'|'charging_cabinet'; model?: string; status: 'active'|'maintenance'|'retired'; soh: number; original_value: number; location?: string; }>(
    { asset_id: '', type: 'vehicle', model: '', status: 'active', soh: 100, original_value: 0, location: '' }
  );

  // User creation state
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'investor' as 'investor'|'operator'|'driver'|'admin' });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string[]>>({});
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const emitToast = (type: string, title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { type, title, message } }));
  };

  useEffect(() => {
    loadData();
  }, [activeTab, usersPage, assetsPage, logsPage, logActionFilter, logEntityFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview') {
        const data = await getAdminOverview();
        setOverview(data);
      } else if (activeTab === 'users') {
        const userData = await getAdminUsers(usersPage, 20, searchQuery);
        setUsers(userData.data);
        setUsersTotal(userData.total);
      } else if (activeTab === 'kyc') {
        const kycData = await getPendingKyc();
        setPendingKyc(kycData.users);
      } else if (activeTab === 'assets') {
        const a = await getAdminAssets(assetsPage, 10);
        setAssets(a.data);
        setAssetsTotal(a.total);
      } else if (activeTab === 'settings') {
        const cfg = await fetchConfigSettings();
        setSettings(cfg);
        try { const status = await fetchTrovoTechStatus(); setTrovotechStatus(status); } catch {}
      } else if (activeTab === 'logs') {
        const filters: any = {};
        if (logActionFilter.trim()) filters.action = logActionFilter.trim();
        if (logEntityFilter.trim()) filters.entity_type = logEntityFilter.trim();
        const resp = await getAuditLogs(logsPage, 25, filters);
        setLogs(resp.data);
        setLogsTotal(resp.total);
      } else if (activeTab === 'revenue') {
        const revData = await getRevenueStats(6);
        setRevenueStats(revData);
        try {
          const breakdown = await fetchRevenueSummary();
          setRevenueData(breakdown);
        } catch {}
        try {
          setLoadingRides(true);
          const ridesData = await fetchRides(15);
          setRides(ridesData.rides);
        } catch {} finally {
          setLoadingRides(false);
        }
      } else if (activeTab === 'analytics') {
        setAnalyticsLoading(true);
        try {
          const response = await fetch('http://127.0.0.1:8000/api/analytics/dashboard', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')}`,
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            setAnalyticsData(data);
          }
        } catch (error) {
          console.error('Failed to load analytics:', error);
        } finally {
          setAnalyticsLoading(false);
        }
      }
    } catch (err) {
      emitToast('danger', 'Load failed', (err as any).message || 'Unable to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: 'investor' | 'operator' | 'driver' | 'admin') => {
    try {
      await updateUserRole(userId, newRole);
      emitToast('success', 'Role Updated', `User role changed to ${newRole}`);
      loadData();
    } catch (err) {
      emitToast('danger', 'Update failed', (err as any).message);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      const result = await toggleUserStatus(userId);
      emitToast('success', 'Status Updated', result.message);
      loadData();
    } catch (err) {
      emitToast('danger', 'Update failed', (err as any).message);
    }
  };

  const handleKycReview = async (userId: number, action: 'approve' | 'reject') => {
    try {
      await reviewKyc(userId, action);
      emitToast('success', 'KYC Updated', `KYC ${action}d successfully`);
      loadData();
    } catch (err) {
      emitToast('danger', 'Review failed', (err as any).message);
    }
  };

  const handleCreateUser = async () => {
    try {
      setIsCreatingUser(true);
      setUserFormErrors({});
      const result = await createUser(userForm);
      emitToast('success', 'User Created', result.message);
      setShowUserModal(false);
      setUserForm({ name: '', email: '', password: '', role: 'investor' });
      loadData();
    } catch (err: any) {
      if (err?.errors) {
        setUserFormErrors(err.errors);
      } else {
        emitToast('danger', 'Creation failed', err?.message || 'Unable to create user');
      }
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const result = await testTrovoTechConnection();
      setConnectionTestResult(result);
      if (result.success) {
        emitToast('success', 'Connection OK', `Latency: ${result.latency_ms}ms, Status: ${result.status_code}`);
      } else {
        emitToast('danger', 'Connection Failed', result.error || 'Unable to reach TrovoTech API');
      }
    } catch (err: any) {
      setConnectionTestResult({ success: false, error: err?.message || 'Request failed' });
      emitToast('danger', 'Test Failed', err?.message || 'Unable to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ 
      background: adminTheme.background, 
      minHeight: '100vh',
      color: '#fff'
    }}>
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="mb-0" style={{ color: adminTheme.textPrimary }}>
            <i className="bi bi-shield-lock-fill me-2" style={{ color: adminTheme.accent }}></i>
            Admin Dashboard
          </h2>
          <p style={{ color: '#888' }}>System-wide oversight and management</p>
        </div>
      </div>

      <AdminRoleManager />

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4" style={{ borderBottom: `2px solid ${adminTheme.accent}` }}>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
            style={{
              background: activeTab === 'overview' ? adminTheme.cardBg : 'transparent',
              color: activeTab === 'overview' ? adminTheme.textPrimary : '#888',
              border: activeTab === 'overview' ? adminTheme.cardBorder : 'none',
              borderBottom: 'none',
              fontWeight: activeTab === 'overview' ? 'bold' : 'normal'
            }}
          >
            <i className="bi bi-speedometer2 me-2"></i>Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{
              background: activeTab === 'users' ? adminTheme.cardBg : 'transparent',
              color: activeTab === 'users' ? adminTheme.textPrimary : '#888',
              border: activeTab === 'users' ? adminTheme.cardBorder : 'none',
              borderBottom: 'none',
              fontWeight: activeTab === 'users' ? 'bold' : 'normal'
            }}
          >
            <i className="bi bi-people me-2"></i>Users
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'kyc' ? 'active' : ''}`}
            onClick={() => setActiveTab('kyc')}
            style={{
              background: activeTab === 'kyc' ? adminTheme.cardBg : 'transparent',
              color: activeTab === 'kyc' ? adminTheme.textPrimary : '#888',
              border: activeTab === 'kyc' ? adminTheme.cardBorder : 'none',
              borderBottom: 'none',
              fontWeight: activeTab === 'kyc' ? 'bold' : 'normal'
            }}
          >
            <i className="bi bi-shield-check me-2"></i>KYC Review
            {pendingKyc.length > 0 && (
              <span className="badge ms-2" style={{ background: adminTheme.accent, color: '#000' }}>{pendingKyc.length}</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'assets' ? 'active' : ''}`}
            onClick={() => setActiveTab('assets')}
            style={{
              background: activeTab === 'assets' ? adminTheme.cardBg : 'transparent',
              color: activeTab === 'assets' ? adminTheme.textPrimary : '#888',
              border: activeTab === 'assets' ? adminTheme.cardBorder : 'none',
              borderBottom: 'none',
              fontWeight: activeTab === 'assets' ? 'bold' : 'normal'
            }}
          >
            <i className="bi bi-boxes me-2"></i>Assets
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            style={{
              background: activeTab === 'settings' ? adminTheme.cardBg : 'transparent',
              color: activeTab === 'settings' ? adminTheme.textPrimary : '#888',
              border: activeTab === 'settings' ? adminTheme.cardBorder : 'none',
              borderBottom: 'none',
              fontWeight: activeTab === 'settings' ? 'bold' : 'normal'
            }}
          >
            <i className="bi bi-gear me-2"></i>Settings
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
            style={{
              background: activeTab === 'logs' ? adminTheme.cardBg : 'transparent',
              color: activeTab === 'logs' ? adminTheme.textPrimary : '#888',
              border: activeTab === 'logs' ? adminTheme.cardBorder : 'none',
              borderBottom: 'none',
              fontWeight: activeTab === 'logs' ? 'bold' : 'normal'
            }}
          >
            <i className="bi bi-clipboard-data me-2"></i>Logs
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
            style={{
              background: activeTab === 'revenue' ? adminTheme.cardBg : 'transparent',
              color: activeTab === 'revenue' ? adminTheme.textPrimary : '#888',
              border: activeTab === 'revenue' ? adminTheme.cardBorder : 'none',
              borderBottom: 'none',
              fontWeight: activeTab === 'revenue' ? 'bold' : 'normal'
            }}
          >
            <i className="bi bi-graph-up me-2"></i>Revenue
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            style={{
              background: activeTab === 'analytics' ? adminTheme.cardBg : 'transparent',
              color: activeTab === 'analytics' ? adminTheme.textPrimary : '#888',
              border: activeTab === 'analytics' ? adminTheme.cardBorder : 'none',
              borderBottom: 'none',
              fontWeight: activeTab === 'analytics' ? 'bold' : 'normal'
            }}
          >
            <i className="bi bi-bar-chart-line me-2"></i>Analytics
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => setActiveTab('telemetry')}
            style={{
              background: activeTab === 'telemetry' ? adminTheme.cardBg : 'transparent',
              color: activeTab === 'telemetry' ? adminTheme.textPrimary : '#888',
              border: activeTab === 'telemetry' ? adminTheme.cardBorder : 'none',
              borderBottom: 'none',
              fontWeight: activeTab === 'telemetry' ? 'bold' : 'normal'
            }}
          >
            <i className="bi bi-broadcast me-2"></i>Telemetry
          </button>
        </li>
      </ul>

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* Overview Tab */}
      {!loading && activeTab === 'overview' && overview && (
        <div className="row g-4">
          {/* User Metrics */}
          <div className="col-md-3">
            <div className="card border-primary">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Users</h6>
                <h2 className="mb-0">{overview.users.total}</h2>
                <div className="mt-3">
                  <small className="d-block">Investors: {overview.users.by_role.investor || 0}</small>
                  <small className="d-block">Operators: {overview.users.by_role.operator || 0}</small>
                  <small className="d-block">Drivers: {overview.users.by_role.driver || 0}</small>
                  <small className="d-block">Admins: {overview.users.by_role.admin || 0}</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-warning">
              <div className="card-body">
                <h6 className="text-muted mb-2">KYC Status</h6>
                <h2 className="mb-0 text-warning">{overview.users.kyc_pending}</h2>
                <small className="text-muted">Pending Review</small>
                <div className="mt-2">
                  <small className="d-block text-success">Verified: {overview.users.kyc_verified}</small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-success">
              <div className="card-body">
                <h6 className="text-muted mb-2">Total Assets</h6>
                <h2 className="mb-0">{overview.assets.total}</h2>
                <div className="mt-3">
                  {Object.entries(overview.assets.by_status).map(([status, count]) => (
                    <small key={status} className="d-block">{status}: {count}</small>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-info">
              <div className="card-body">
                <h6 className="text-muted mb-2">Revenue</h6>
                <h3 className="mb-0 text-success">₦{overview.revenue.total.toLocaleString()}</h3>
                <small className="text-muted">Total</small>
                <div className="mt-2">
                  <small className="d-block">This Month: ₦{overview.revenue.monthly.toLocaleString()}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {!loading && activeTab === 'users' && (
        <div>
          <div className="row mb-3">
            <div className="col-md-5">
              <input
                type="text"
                className="form-control"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadData()}
              />
            </div>
            <div className="col-md-7 text-end">
              <button className="btn btn-primary me-2" onClick={() => loadData()}>
                <i className="bi bi-search me-2"></i>Search
              </button>
              <button className="btn btn-success" onClick={() => setShowUserModal(true)}>
                <i className="bi bi-person-plus me-2"></i>Create User
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>KYC Status</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value as any)}
                      >
                        <option value="investor">Investor</option>
                        <option value="operator">Operator</option>
                        <option value="driver">Driver</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge bg-${
                        user.kyc_status === 'verified' ? 'success' :
                        user.kyc_status === 'submitted' ? 'info' :
                        user.kyc_status === 'rejected' ? 'danger' : 'warning'
                      }`}>
                        {user.kyc_status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.email_verified_at ? 'bg-success' : 'bg-secondary'}`}>
                        {user.email_verified_at ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleToggleStatus(user.id)}
                      >
                        {user.email_verified_at ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-muted">Showing {users.length} of {usersTotal} users</span>
            <div className="btn-group">
              <button
                className="btn btn-outline-secondary"
                disabled={usersPage === 1}
                onClick={() => setUsersPage(p => p - 1)}
              >
                Previous
              </button>
              <button className="btn btn-outline-secondary" disabled>Page {usersPage}</button>
              <button
                className="btn btn-outline-secondary"
                disabled={users.length < 20}
                onClick={() => setUsersPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Review Tab */}
      {!loading && activeTab === 'kyc' && (
        <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Pending KYC Submissions ({pendingKyc.length})</h5>
                <div className="d-flex align-items-center gap-2">
                  <button className="btn btn-outline-light btn-sm" disabled={kycPolling} onClick={async ()=>{
                    setKycPolling(true); setKycPollError(null);
                    try {
                      const resp = await pollKyc();
                      setKycPollStatus(resp.provider_status);
                      emitToast('info','Polled Provider',`Status: ${resp.provider_status}`);
                      // After poll, reload pending list in case verification cleared some
                      const fresh = await getPendingKyc();
                      setPendingKyc(fresh.users);
                    } catch(err:any){
                      setKycPollError(err.message || 'Poll failed');
                      emitToast('danger','Poll Failed', err.message || 'Provider poll error');
                    } finally { setKycPolling(false); }
                  }}>
                    <i className="bi bi-arrow-repeat me-1"></i>{kycPolling ? 'Polling...' : 'Poll Provider'}
                  </button>
                  {kycPollStatus && (
                    <span className="badge bg-secondary" title="Latest provider status">{kycPollStatus}</span>
                  )}
                </div>
              </div>
              {kycPollError && <div className="alert alert-danger py-1 mb-2"><small>{kycPollError}</small></div>}
          {pendingKyc.length === 0 ? (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>No pending KYC submissions
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead className="table-dark">
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Document Type</th>
                    <th>Document Number</th>
                    <th>Provider</th>
                    <th>Provider Status</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingKyc.map(kyc => (
                    <tr key={kyc.id}>
                      <td>{kyc.name}</td>
                      <td>{kyc.email}</td>
                      <td><span className="badge bg-secondary">{kyc.role}</span></td>
                      <td>{kyc.kyc_document_type}</td>
                      <td><code>{kyc.kyc_document_number}</code></td>
                      <td>
                        {(kyc as any).kyc_provider ? (
                          <span className="badge bg-info text-capitalize">{(kyc as any).kyc_provider}</span>
                        ) : (
                          <span className="text-muted small">local</span>
                        )}
                      </td>
                      <td>
                        {(kyc as any).kyc_provider_status ? (
                          <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-warning text-dark">{(kyc as any).kyc_provider_status}</span>
                            {(kyc as any).kyc_failure_reason && (
                              <i 
                                className="bi bi-exclamation-triangle-fill text-danger" 
                                title={(kyc as any).kyc_failure_reason}
                                style={{ cursor: 'help' }}
                              ></i>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <small>{new Date(kyc.kyc_submitted_at).toLocaleString()}</small>
                        {(kyc as any).kyc_last_checked_at && (
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            Last checked: {new Date((kyc as any).kyc_last_checked_at).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-success"
                            onClick={() => handleKycReview(kyc.id, 'approve')}
                          >
                            <i className="bi bi-check-circle me-1"></i>Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleKycReview(kyc.id, 'reject')}
                          >
                            <i className="bi bi-x-circle me-1"></i>Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Assets Tab */}
      {!loading && activeTab === 'assets' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Manage Assets</h5>
            <button className="btn btn-success" onClick={() => { setEditingAsset(null); setAssetForm({ asset_id: '', type: 'vehicle', model: '', status: 'active', soh: 100, original_value: 0, location: '' }); setShowAssetModal(true); }}>
              <i className="bi bi-plus-circle me-2"/>Add Asset
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Asset ID</th>
                  <th>Type</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>SOH</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td><code>{a.asset_id}</code></td>
                    <td><span className="badge bg-secondary text-uppercase">{a.type.replace('_',' ')}</span></td>
                    <td>{a.model || '-'}</td>
                    <td>
                      <select className="form-select form-select-sm" value={a.status} onChange={async (e)=>{
                        try {
                          const updated = await updateAdminAssetStatus(a.id, e.target.value as any);
                          setAssets(prev => prev.map(p => p.id===a.id ? updated : p));
                          emitToast('success','Status Updated',`Asset ${a.asset_id} is now ${e.target.value}`);
                        } catch(err) {
                          emitToast('danger','Update failed',(err as any).message || 'Unable to update status');
                        }
                      }}>
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                      </select>
                    </td>
                    <td>{a.soh}%</td>
                    <td>{a.location || '-'}</td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <button className="btn btn-outline-primary" onClick={()=>{ setEditingAsset(a); setAssetForm({ asset_id: a.asset_id, type: a.type, model: a.model || '', status: a.status, soh: a.soh, original_value: Number(a.original_value), location: a.location || '' }); setShowAssetModal(true); }}>
                          <i className="bi bi-pencil-square me-1"/>Edit
                        </button>
                        <button className="btn btn-outline-danger" onClick={async ()=>{
                          if (!confirm(`Delete asset ${a.asset_id}?`)) return;
                          try { await deleteAdminAsset(a.id); emitToast('success','Deleted','Asset removed'); loadData(); } catch(err){ emitToast('danger','Delete failed',(err as any).message); }
                        }}>
                          <i className="bi bi-trash me-1"/>Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-muted">Showing {assets.length} of {assetsTotal} assets</span>
            <div className="btn-group">
              <button className="btn btn-outline-secondary" disabled={assetsPage===1} onClick={()=> setAssetsPage(p=>p-1)}>Previous</button>
              <button className="btn btn-outline-secondary" disabled>Page {assetsPage}</button>
              <button className="btn btn-outline-secondary" disabled={assets.length<10} onClick={()=> setAssetsPage(p=>p+1)}>Next</button>
            </div>
          </div>

          {showAssetModal && (
            <div className="modal d-block" tabIndex={-1}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{editingAsset ? 'Edit Asset' : 'Add Asset'}</h5>
                    <button type="button" className="btn-close" onClick={()=> setShowAssetModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Asset ID</label>
                      <input className="form-control" value={assetForm.asset_id} onChange={e=> setAssetForm(f=>({...f, asset_id: e.target.value}))} disabled={!!editingAsset} />
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label">Type</label>
                        <select className="form-select" value={assetForm.type} onChange={e=> setAssetForm(f=>({...f, type: e.target.value as any}))}>
                          <option value="vehicle">Vehicle</option>
                          <option value="battery">Battery</option>
                          <option value="charging_cabinet">Charging Cabinet</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={assetForm.status} onChange={e=> setAssetForm(f=>({...f, status: e.target.value as any}))}>
                          <option value="active">Active</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="retired">Retired</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-2 mt-2">
                      <label className="form-label">Model</label>
                      <input className="form-control" value={assetForm.model} onChange={e=> setAssetForm(f=>({...f, model: e.target.value}))} />
                    </div>
                    <div className="row g-2">
                      <div className="col-6">
                        <label className="form-label">SOH (%)</label>
                        <input type="number" className="form-control" min={0} max={100} value={assetForm.soh} onChange={e=> setAssetForm(f=>({...f, soh: Number(e.target.value)}))} />
                      </div>
                      <div className="col-6">
                        <label className="form-label">Original Value (₦)</label>
                        <input type="number" className="form-control" min={0} value={assetForm.original_value} onChange={e=> setAssetForm(f=>({...f, original_value: Number(e.target.value)}))} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="form-label">Location</label>
                      <input className="form-control" value={assetForm.location} onChange={e=> setAssetForm(f=>({...f, location: e.target.value}))} />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={()=> setShowAssetModal(false)}>Cancel</button>
                    <button className="btn btn-primary" onClick={async ()=>{
                      try {
                        if (editingAsset) {
                          await updateAdminAsset(editingAsset.id, assetForm);
                          emitToast('success','Updated','Asset updated');
                        } else {
                          await createAdminAsset(assetForm);
                          emitToast('success','Created','Asset created');
                        }
                        setShowAssetModal(false);
                        loadData();
                      } catch(err) {
                        emitToast('danger','Save failed',(err as any).message || 'Unable to save asset');
                      }
                    }}>{editingAsset ? 'Save Changes' : 'Create Asset'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {!loading && activeTab === 'settings' && (
        <div className="row g-3">
          <div className="col-12">
            <div className="alert alert-secondary d-flex align-items-center justify-content-between">
              <div>
                <i className="bi bi-plug-fill me-2"></i>
                <strong>TrovoTech Integration:</strong>
                <span className="ms-2">{trovotechStatus?.configured ? 'Configured' : 'Not configured'}</span>
                {trovotechStatus && (
                  <span className="ms-3 small text-muted">Sandbox: {trovotechStatus.sandbox ? 'On' : 'Off'} • Timeout: {trovotechStatus.timeout_ms}ms</span>
                )}
              </div>
              <div>
                {trovotechStatus?.configured && (
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                  >
                    {testingConnection ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-wifi me-2" />
                        Test Connection
                      </>
                    )}
                  </button>
                )}
                {!trovotechStatus?.configured && (
                  <span className="badge bg-warning text-dark">Action needed</span>
                )}
              </div>
            </div>
            {connectionTestResult && (
              <div className={`alert ${connectionTestResult.success ? 'alert-success' : 'alert-danger'} d-flex align-items-center`}>
                <i className={`bi ${connectionTestResult.success ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2`}></i>
                <div>
                  {connectionTestResult.success ? (
                    <>
                      <strong>Connection successful!</strong>
                      <span className="ms-2">Status: {connectionTestResult.status_code} • Latency: {connectionTestResult.latency_ms}ms</span>
                    </>
                  ) : (
                    <>
                      <strong>Connection failed</strong>
                      <div className="small mt-1">{connectionTestResult.error}</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {settings.map(s => (
            <div className="col-md-6" key={s.key}>
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title text-muted">{s.key}</h6>
                  {s.isSecret ? (
                    <input
                      type="password"
                      className="form-control"
                      value={s.value ?? ''}
                      onChange={e => setSettings(prev => prev.map(p => p.key===s.key ? { ...p, value: e.target.value } : p))}
                      placeholder={s.value ? '********' : 'Enter value'}
                    />
                  ) : s.type === 'boolean' ? (
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id={`set-${s.key}`} checked={!!s.value} onChange={e => setSettings(prev => prev.map(p => p.key===s.key ? { ...p, value: e.target.checked } : p))} />
                      <label className="form-check-label" htmlFor={`set-${s.key}`}>{String(s.value)}</label>
                    </div>
                  ) : s.type === 'number' ? (
                    <input type="number" className="form-control" value={s.value ?? 0} onChange={e => setSettings(prev => prev.map(p => p.key===s.key ? { ...p, value: Number(e.target.value) } : p))} />
                  ) : s.type === 'json' ? (
                    <textarea className="form-control" rows={3} value={JSON.stringify(s.value ?? [])} onChange={e => {
                      try { const v = JSON.parse(e.target.value || '[]'); setSettings(prev => prev.map(p => p.key===s.key ? { ...p, value: v } : p)); }
                      catch { /* no-op */ }
                    }} />
                  ) : (
                    <input className="form-control" value={s.value ?? ''} onChange={e => setSettings(prev => prev.map(p => p.key===s.key ? { ...p, value: e.target.value } : p))} />
                  )}
                  {settingErrors[s.key] && (
                    <div className="form-text text-danger">{settingErrors[s.key]}</div>
                  )}
                </div>
                <div className="card-footer text-end">
                  <button className="btn btn-primary btn-sm" disabled={savingKey===s.key || (s.isSecret && s.value === '********')} onClick={async ()=>{
                    const errors: Record<string,string|null> = { ...settingErrors };
                    errors[s.key] = null;
                    const key = s.key;
                    const val = s.value;
                    if (key === 'platform_fee_percent') {
                      if (typeof val !== 'number' || val < 0 || val > 100) errors[s.key] = 'Fee must be between 0 and 100';
                    } else if (key === 'investor_payout_day') {
                      if (typeof val !== 'number' || val < 1 || val > 28) errors[s.key] = 'Payout day must be 1-28';
                    } else if (key === 'token_mint_limit') {
                      if (typeof val !== 'number' || val < 1 || !Number.isFinite(val)) errors[s.key] = 'Mint limit must be a positive number';
                    } else if (key === 'kyc_required_roles') {
                      if (!Array.isArray(val)) errors[s.key] = 'Must be a JSON array';
                    } else if (key === 'trovotech_base_url') {
                      if (typeof val !== 'string' || !val.trim()) errors[s.key] = 'Base URL is required to enable integration';
                    } else if (key === 'trovotech_timeout_ms') {
                      if (typeof val !== 'number' || val < 1000) errors[s.key] = 'Timeout must be >= 1000ms';
                    }
                    setSettingErrors(errors);
                    if (errors[s.key]) { emitToast('warning','Validation', errors[s.key]!); return; }
                    try { setSavingKey(s.key); const saved = await updateConfigSetting(s); setSettings(prev => prev.map(p => p.key===saved.key ? saved : p)); emitToast('success','Saved', `${s.key} updated`); }
                    catch(err){ emitToast('danger','Save failed',(err as any).message); }
                    finally { setSavingKey(null); }
                  }}>Save</button>
                  {s.isSecret && s.value === '********' && (
                    <div className="small text-muted mt-2">Current value hidden. Enter a new value to update.</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Logs Tab */}
      {!loading && activeTab === 'logs' && (
        <div>
          <div className="row g-2 mb-2">
            <div className="col-md-4">
              <input className="form-control" placeholder="Filter by action (e.g., update_role)" value={logActionFilter} onChange={e=>{ setLogActionFilter(e.target.value); setLogsPage(1); }} />
            </div>
            <div className="col-md-4">
              <input className="form-control" placeholder="Filter by entity type (e.g., user, config_setting)" value={logEntityFilter} onChange={e=>{ setLogEntityFilter(e.target.value); setLogsPage(1); }} />
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead className="table-dark">
                <tr>
                  <th>Time</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Metadata</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td>{new Date(l.created_at).toLocaleString()}</td>
                    <td>{l.user?.name || l.user_id}</td>
                    <td><code>{l.action}</code></td>
                    <td>{l.entity_type} #{l.entity_id}</td>
                    <td><code style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(l.metadata)}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-2">
            <span className="text-muted">Showing {logs.length} of {logsTotal} logs</span>
            <div className="btn-group">
              <button className="btn btn-outline-secondary" disabled={logsPage===1} onClick={()=> setLogsPage(p=>p-1)}>Previous</button>
              <button className="btn btn-outline-secondary" disabled>Page {logsPage}</button>
              <button className="btn btn-outline-secondary" disabled={logs.length<25} onClick={()=> setLogsPage(p=>p+1)}>Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {!loading && activeTab === 'revenue' && revenueStats && (
        <div>
          <h5 className="mb-3">Revenue Analytics</h5>
          
          {/* Revenue Breakdown Component */}
          <div className="row mb-4">
            <div className="col-md-6">
              <RevenueBreakdown data={revenueData} loading={loadingRides} />
            </div>
            <div className="col-md-6">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h6>Total Revenue</h6>
                  <h2>₦{revenueStats.total.toLocaleString()}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Rides */}
          <div className="card mb-4">
            <div className="card-header">
              <h6 className="mb-0"><i className="bi bi-speedometer2 me-2"></i>Recent Rides</h6>
            </div>
            <div className="card-body">
              {loadingRides ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status"></div>
                  <p className="text-muted mt-2 mb-0 small">Loading...</p>
                </div>
              ) : rides.length === 0 ? (
                <p className="text-muted mb-0">No rides available</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Vehicle</th>
                        <th>Distance</th>
                        <th>Revenue</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rides.slice(0, 10).map(ride => (
                        <tr key={ride.id}>
                          <td className="text-primary">#{ride.id}</td>
                          <td>V-{ride.vehicle_id}</td>
                          <td>{ride.distance_km.toFixed(2)} km</td>
                          <td className="text-success fw-bold">
                            ${ride.revenue?.gross.toFixed(2) || 'N/A'}
                          </td>
                          <td>{new Date(ride.ended_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Monthly Revenue Trend</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th className="text-end">Amount (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueStats.monthly.map(m => (
                      <tr key={m.month}>
                        <td>{m.label}</td>
                        <td className="text-end">{m.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {!loading && activeTab === 'analytics' && (
        <div className="row g-4">
          {analyticsLoading ? (
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading analytics...</span>
              </div>
            </div>
          ) : analyticsData ? (
            <>
              {/* Analytics Overview Cards */}
              <div className="col-md-3">
                <div className="card" style={{ 
                  background: adminTheme.cardBg, 
                  border: adminTheme.cardBorder,
                  boxShadow: adminTheme.shadow
                }}>
                  <div className="card-body">
                    <h6 className="mb-2" style={{ color: '#888' }}>Total Sessions</h6>
                    <h3 className="mb-0" style={{ color: adminTheme.textPrimary }}>{analyticsData.total_sessions || 0}</h3>
                    <small style={{ color: '#666' }}>
                      <i className="bi bi-calendar3 me-1"></i>Last 30 days
                    </small>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card" style={{ 
                  background: adminTheme.cardBg, 
                  border: adminTheme.cardBorder,
                  boxShadow: adminTheme.shadow
                }}>
                  <div className="card-body">
                    <h6 className="mb-2" style={{ color: '#888' }}>Total Users</h6>
                    <h3 className="mb-0" style={{ color: adminTheme.textPrimary }}>{analyticsData.total_users || 0}</h3>
                    <small style={{ color: '#666' }}>
                      <i className="bi bi-people me-1"></i>Active users
                    </small>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div className="card" style={{ 
                  background: adminTheme.cardBg, 
                  border: adminTheme.cardBorder,
                  boxShadow: adminTheme.shadow
                }}>
                  <div className="card-body">
                    <h6 className="mb-2" style={{ color: '#888' }}>Page Views</h6>
                    <h3 className="mb-0" style={{ color: adminTheme.textPrimary }}>{analyticsData.total_page_views || 0}</h3>
                    <small style={{ color: '#666' }}>
                      <i className="bi bi-eye me-1"></i>Total views
                    </small>
                  </div>
                </div>
              </div>

              <div className="col-md-3">
                <div 
                  className="card" 
                  style={{ 
                    background: adminTheme.cardBg, 
                    border: `2px solid ${adminTheme.accent}`,
                    boxShadow: `0 4px 30px rgba(0, 255, 65, 0.4)`,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => {
                    emitToast('info', 'Feedback Management', `Total feedback: ${analyticsData.total_feedback || 0} responses. Click individual feedback items below to manage.`);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 40px rgba(0, 255, 65, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(0, 255, 65, 0.4)';
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-2" style={{ color: adminTheme.accent, fontWeight: 'bold' }}>
                          <i className="bi bi-chat-dots-fill me-2"></i>Feedback Count
                        </h6>
                        <h3 className="mb-0" style={{ color: adminTheme.textPrimary, fontSize: '2.5rem' }}>
                          {analyticsData.total_feedback || 0}
                        </h3>
                        <small style={{ color: adminTheme.textSecondary }}>
                          <i className="bi bi-hand-index me-1"></i>Click to manage
                        </small>
                      </div>
                      <div style={{ 
                        background: `linear-gradient(135deg, ${adminTheme.accent}20, ${adminTheme.accent}40)`,
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <i className="bi bi-gear-fill" style={{ color: adminTheme.accent, fontSize: '1.5rem' }}></i>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${adminTheme.accent}, ${adminTheme.textSecondary})`
                  }}></div>
                </div>
              </div>

              {/* Top Events */}
              <div className="col-12">
                <div className="card" style={{ 
                  background: adminTheme.cardBg, 
                  border: adminTheme.cardBorder,
                  boxShadow: adminTheme.shadow
                }}>
                  <div className="card-header" style={{ 
                    background: 'rgba(0, 255, 65, 0.1)', 
                    borderBottom: `1px solid ${adminTheme.accent}` 
                  }}>
                    <h5 className="mb-0" style={{ color: adminTheme.textPrimary }}>
                      <i className="bi bi-activity me-2"></i>Top Events
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover" style={{ color: '#fff' }}>
                        <thead>
                          <tr style={{ borderBottom: `2px solid ${adminTheme.accent}` }}>
                            <th style={{ color: adminTheme.textPrimary }}>Event Name</th>
                            <th style={{ color: adminTheme.textPrimary }}>Count</th>
                            <th style={{ color: adminTheme.textPrimary }}>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analyticsData.top_events && analyticsData.top_events.length > 0 ? (
                            analyticsData.top_events.map((event: any, idx: number) => {
                              const totalEvents = analyticsData.top_events.reduce((sum: number, e: any) => sum + parseInt(e.count), 0);
                              const percentage = ((parseInt(event.count) / totalEvents) * 100).toFixed(1);
                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                                  <td>
                                    <span className="badge" style={{ background: adminTheme.accent, color: '#000' }}>{event.event_name}</span>
                                  </td>
                                  <td><strong style={{ color: adminTheme.textSecondary }}>{event.count}</strong></td>
                                  <td>
                                    <div className="progress" style={{ height: '20px', background: '#333' }}>
                                      <div 
                                        className="progress-bar" 
                                        role="progressbar" 
                                        style={{ 
                                          width: `${percentage}%`,
                                          background: `linear-gradient(90deg, ${adminTheme.textSecondary}, ${adminTheme.accent})`,
                                          color: '#000',
                                          fontWeight: 'bold'
                                        }}
                                        aria-valuenow={parseFloat(percentage)} 
                                        aria-valuemin={0} 
                                        aria-valuemax={100}
                                      >
                                        {percentage}%
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={3} className="text-center" style={{ color: '#666' }}>
                                No events tracked yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Events by Category */}
              <div className="col-md-6">
                <div className="card" style={{ 
                  background: adminTheme.cardBg, 
                  border: adminTheme.cardBorder,
                  boxShadow: adminTheme.shadow
                }}>
                  <div className="card-header" style={{ 
                    background: 'rgba(0, 255, 65, 0.1)', 
                    borderBottom: `1px solid ${adminTheme.accent}` 
                  }}>
                    <h5 className="mb-0" style={{ color: adminTheme.textPrimary }}>
                      <i className="bi bi-diagram-3 me-2"></i>Events by Category
                    </h5>
                  </div>
                  <div className="card-body">
                    {analyticsData.events_by_category && analyticsData.events_by_category.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {analyticsData.events_by_category.map((category: any, idx: number) => (
                          <div key={idx} className="list-group-item d-flex justify-content-between align-items-center" style={{
                            background: 'rgba(0, 255, 65, 0.05)',
                            border: 'none',
                            borderBottom: '1px solid #333',
                            color: '#fff'
                          }}>
                            <span className="text-capitalize" style={{ color: adminTheme.textPrimary }}>{category.event_category}</span>
                            <span className="badge rounded-pill" style={{ background: adminTheme.accent, color: '#000' }}>{category.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mb-0" style={{ color: '#666' }}>No categorized events yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* User Milestones */}
              <div className="col-md-6">
                <div className="card" style={{ 
                  background: adminTheme.cardBg, 
                  border: adminTheme.cardBorder,
                  boxShadow: adminTheme.shadow
                }}>
                  <div className="card-header" style={{ 
                    background: 'rgba(0, 255, 65, 0.1)', 
                    borderBottom: `1px solid ${adminTheme.accent}` 
                  }}>
                    <h5 className="mb-0" style={{ color: adminTheme.textPrimary }}>
                      <i className="bi bi-trophy me-2"></i>User Milestones
                    </h5>
                  </div>
                  <div className="card-body">
                    {analyticsData.milestones_achieved && analyticsData.milestones_achieved.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {analyticsData.milestones_achieved.map((milestone: any, idx: number) => (
                          <div key={idx} className="list-group-item d-flex justify-content-between align-items-center" style={{
                            background: 'rgba(0, 255, 65, 0.05)',
                            border: 'none',
                            borderBottom: '1px solid #333',
                            color: '#fff'
                          }}>
                            <span className="text-capitalize">
                              <i className="bi bi-check-circle me-2" style={{ color: adminTheme.accent }}></i>
                              <span style={{ color: adminTheme.textPrimary }}>{milestone.milestone_type}</span>
                            </span>
                            <span className="badge rounded-pill" style={{ background: adminTheme.textSecondary, color: '#000' }}>{milestone.count}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mb-0" style={{ color: '#666' }}>No milestones achieved yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="col-12">
                <div className="card" style={{ 
                  background: adminTheme.cardBg, 
                  border: adminTheme.cardBorder,
                  boxShadow: adminTheme.shadow
                }}>
                  <div className="card-header" style={{ 
                    background: 'rgba(0, 255, 65, 0.1)', 
                    borderBottom: `1px solid ${adminTheme.accent}` 
                  }}>
                    <h5 className="mb-0" style={{ color: adminTheme.textPrimary }}>
                      <i className="bi bi-funnel me-2"></i>Conversion Funnel
                    </h5>
                  </div>
                  <div className="card-body">
                    {analyticsData.conversion_funnel ? (
                      <div className="row text-center">
                        <div className="col-md-3">
                          <div className="rounded p-3 mb-3" style={{ 
                            border: `2px solid ${adminTheme.accent}`,
                            background: 'rgba(0, 255, 65, 0.05)'
                          }}>
                            <h4 className="mb-1" style={{ color: adminTheme.textPrimary }}>{analyticsData.conversion_funnel.registered || 0}</h4>
                            <small style={{ color: '#888' }}>Registered</small>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="rounded p-3 mb-3" style={{ 
                            border: `2px solid ${adminTheme.textSecondary}`,
                            background: 'rgba(0, 204, 51, 0.05)'
                          }}>
                            <h4 className="mb-1" style={{ color: adminTheme.textSecondary }}>{analyticsData.conversion_funnel.kyc_started || 0}</h4>
                            <small style={{ color: '#888' }}>KYC Started</small>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="rounded p-3 mb-3" style={{ 
                            border: `2px solid ${adminTheme.accent}`,
                            background: 'rgba(0, 255, 65, 0.05)'
                          }}>
                            <h4 className="mb-1" style={{ color: adminTheme.textPrimary }}>{analyticsData.conversion_funnel.kyc_completed || 0}</h4>
                            <small style={{ color: '#888' }}>KYC Completed</small>
                          </div>
                        </div>
                        <div className="col-md-3">
                          <div className="rounded p-3 mb-3" style={{ 
                            border: `2px solid ${adminTheme.textSecondary}`,
                            background: 'rgba(0, 204, 51, 0.05)'
                          }}>
                            <h4 className="mb-1" style={{ color: adminTheme.textSecondary }}>{analyticsData.conversion_funnel.first_investment || 0}</h4>
                            <small style={{ color: '#888' }}>First Investment</small>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-0" style={{ color: '#666' }}>Conversion data not available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Analytics Visualizations */}
              <div className="col-12 mt-4">
                <div className="card" style={{ 
                  background: adminTheme.cardBg, 
                  border: adminTheme.cardBorder,
                  boxShadow: adminTheme.shadow
                }}>
                  <div className="card-header" style={{ 
                    background: 'rgba(0, 255, 65, 0.1)', 
                    borderBottom: `1px solid ${adminTheme.accent}` 
                  }}>
                    <h5 className="mb-0" style={{ color: adminTheme.textPrimary }}>
                      <i className="bi bi-graph-up-arrow me-2"></i>Analytics Visualizations
                    </h5>
                  </div>
                  <div className="card-body">
                    <AnalyticsCharts analyticsData={analyticsData} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-12">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                No analytics data available. Users need to interact with the platform to generate analytics.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Telemetry Tab */}
      {activeTab === 'telemetry' && (
        <TelemetryWidget />
      )}

      {/* User Creation Modal */}
      {showUserModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>Create New User
                </h5>
                <button type="button" className="btn-close" disabled={isCreatingUser} onClick={() => {
                  setShowUserModal(false);
                  setUserForm({ name: '', email: '', password: '', role: 'investor' });
                  setUserFormErrors({});
                }}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className={`form-control ${userFormErrors.name ? 'is-invalid' : ''}`}
                    value={userForm.name}
                    onChange={e => setUserForm({...userForm, name: e.target.value})}
                    disabled={isCreatingUser}
                  />
                  {userFormErrors.name && (
                    <div className="invalid-feedback">{userFormErrors.name[0]}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${userFormErrors.email ? 'is-invalid' : ''}`}
                    value={userForm.email}
                    onChange={e => setUserForm({...userForm, email: e.target.value})}
                    disabled={isCreatingUser}
                  />
                  {userFormErrors.email && (
                    <div className="invalid-feedback">{userFormErrors.email[0]}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className={`form-control ${userFormErrors.password ? 'is-invalid' : ''}`}
                    value={userForm.password}
                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                    placeholder="Minimum 6 characters"
                    disabled={isCreatingUser}
                  />
                  {userFormErrors.password && (
                    <div className="invalid-feedback">{userFormErrors.password[0]}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className={`form-select ${userFormErrors.role ? 'is-invalid' : ''}`}
                    value={userForm.role}
                    onChange={e => setUserForm({...userForm, role: e.target.value as any})}
                    disabled={isCreatingUser}
                  >
                    <option value="investor">Investor</option>
                    <option value="operator">Operator</option>
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                  {userFormErrors.role && (
                    <div className="invalid-feedback">{userFormErrors.role[0]}</div>
                  )}
                </div>

                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  <small>User will be auto-verified and a wallet will be created automatically.</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" disabled={isCreatingUser} onClick={() => {
                  setShowUserModal(false);
                  setUserForm({ name: '', email: '', password: '', role: 'investor' });
                  setUserFormErrors({});
                }}>
                  Cancel
                </button>
                <button type="button" className="btn btn-success" onClick={handleCreateUser} disabled={isCreatingUser}>
                  {isCreatingUser && (<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>)}
                  <i className="bi bi-check-circle me-2"></i>Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

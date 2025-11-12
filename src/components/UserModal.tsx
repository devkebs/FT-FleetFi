import React, { useState, useEffect } from 'react';

interface UserDetails {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'operator' | 'investor' | 'driver';
  kyc_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  created_at: string;
  email_verified_at: string | null;
  wallet: {
    id: number;
    balance: number;
    currency: string;
  } | null;
  tokens: Array<{
    id: number;
    asset_id: number;
    shares: number;
    investment_amount: number;
    asset: {
      asset_id: string;
      name: string;
    };
  }>;
  walletTransactions: Array<{
    id: number;
    type: string;
    amount: number;
    description: string;
    created_at: string;
  }>;
}

interface UserStats {
  total_investments: number;
  total_tokens: number;
  total_transactions: number;
  total_deposits: number;
  total_withdrawals: number;
}

interface ActivityLog {
  id: number;
  action: string;
  entity_type: string;
  metadata: any;
  created_at: string;
}

interface UserModalProps {
  userId: number | null;
  mode: 'view' | 'edit' | 'create';
  onClose: () => void;
  onSave: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({ userId, mode, onClose, onSave }) => {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form state for edit/create
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'investor' as 'admin' | 'operator' | 'investor' | 'driver',
    kyc_status: 'pending' as 'pending' | 'approved' | 'rejected',
    password: '',
    password_confirmation: '',
  });

  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const apiClient = {
    get: async (url: string) => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('API Error');
      return response.json();
    },
    post: async (url: string, body?: any) => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      return response.json();
    },
    put: async (url: string, body?: any) => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      return response.json();
    },
  };

  useEffect(() => {
    if (userId && mode !== 'create') {
      fetchUserDetails();
    }
  }, [userId, mode]);

  const fetchUserDetails = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await apiClient.get(`/admin/user-management/${userId}`);
      
      if (response.success) {
        setUser(response.user);
        setStats(response.stats);
        setActivityLogs(response.activity_logs || []);
        
        // Populate form data for edit mode
        if (mode === 'edit') {
          setFormData({
            name: response.user.name,
            email: response.user.email,
            phone: response.user.phone || '',
            role: response.user.role,
            kyc_status: response.user.kyc_status,
            password: '',
            password_confirmation: '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Error', message: 'Failed to load user details' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrors({});

      let response;
      if (mode === 'create') {
        response = await apiClient.post('/admin/user-management', formData);
      } else if (mode === 'edit' && userId) {
        // Only send changed fields
        const updateData: any = {};
        if (formData.name !== user?.name) updateData.name = formData.name;
        if (formData.email !== user?.email) updateData.email = formData.email;
        if (formData.phone !== user?.phone) updateData.phone = formData.phone;
        if (formData.role !== user?.role) updateData.role = formData.role;
        if (formData.kyc_status !== user?.kyc_status) updateData.kyc_status = formData.kyc_status;
        if (formData.password) {
          updateData.password = formData.password;
        }

        response = await apiClient.put(`/admin/user-management/${userId}`, updateData);
      }

      if (response?.success) {
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { 
            type: 'success', 
            title: 'Success', 
            message: response.message || `User ${mode === 'create' ? 'created' : 'updated'} successfully`
          }
        }));
        onSave();
        onClose();
      }
    } catch (error: any) {
      if (error.errors) {
        setErrors(error.errors);
      } else {
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { 
            type: 'danger', 
            title: 'Error', 
            message: error.message || 'Failed to save user' 
          }
        }));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!userId) return;
    
    const newPassword = prompt('Enter new password (min 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'warning', title: 'Invalid', message: 'Password must be at least 6 characters' }
      }));
      return;
    }

    try {
      const response = await apiClient.post(`/admin/user-management/${userId}/reset-password`, {
        new_password: newPassword,
        new_password_confirmation: newPassword,
      });

      if (response.success) {
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { type: 'success', title: 'Success', message: response.message }
        }));
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Error', message: 'Failed to reset password' }
      }));
    }
  };

  if (!userId && mode !== 'create') {
    return null;
  }

  return (
    <div 
      className="modal show d-block" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className={`bi bi-${mode === 'create' ? 'person-plus' : mode === 'edit' ? 'pencil-square' : 'person-lines-fill'} me-2`}></i>
              {mode === 'create' ? 'Create New User' : mode === 'edit' ? 'Edit User' : 'User Details'}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
              disabled={saving}
            ></button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : mode === 'view' && user ? (
              <>
                {/* Tabs for View Mode */}
                <ul className="nav nav-tabs mb-4">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                      onClick={() => setActiveTab('profile')}
                    >
                      <i className="bi bi-person me-2"></i>Profile
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'wallet' ? 'active' : ''}`}
                      onClick={() => setActiveTab('wallet')}
                    >
                      <i className="bi bi-wallet2 me-2"></i>Wallet & Investments
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
                      onClick={() => setActiveTab('activity')}
                    >
                      <i className="bi bi-clock-history me-2"></i>Activity Log
                    </button>
                  </li>
                </ul>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">Basic Information</h6>
                        </div>
                        <div className="card-body">
                          <dl className="row mb-0">
                            <dt className="col-sm-4">Name:</dt>
                            <dd className="col-sm-8">{user.name}</dd>
                            
                            <dt className="col-sm-4">Email:</dt>
                            <dd className="col-sm-8">{user.email}</dd>
                            
                            <dt className="col-sm-4">Phone:</dt>
                            <dd className="col-sm-8">{user.phone || <em className="text-muted">Not provided</em>}</dd>
                            
                            <dt className="col-sm-4">Role:</dt>
                            <dd className="col-sm-8">
                              <span className={`badge bg-${
                                user.role === 'admin' ? 'danger' :
                                user.role === 'operator' ? 'primary' :
                                user.role === 'investor' ? 'success' : 'info'
                              }`}>
                                {user.role}
                              </span>
                            </dd>
                            
                            <dt className="col-sm-4">KYC Status:</dt>
                            <dd className="col-sm-8">
                              <span className={`badge bg-${
                                user.kyc_status === 'approved' ? 'success' :
                                user.kyc_status === 'pending' ? 'warning' : 'danger'
                              }`}>
                                {user.kyc_status}
                              </span>
                            </dd>
                            
                            <dt className="col-sm-4">Account Status:</dt>
                            <dd className="col-sm-8">
                              {user.is_active ? (
                                <span className="badge bg-success">Active</span>
                              ) : (
                                <span className="badge bg-secondary">Inactive</span>
                              )}
                            </dd>
                            
                            <dt className="col-sm-4">Created:</dt>
                            <dd className="col-sm-8">{new Date(user.created_at).toLocaleString()}</dd>
                            
                            <dt className="col-sm-4">Email Verified:</dt>
                            <dd className="col-sm-8">
                              {user.email_verified_at ? (
                                <span className="text-success">
                                  <i className="bi bi-check-circle me-1"></i>
                                  {new Date(user.email_verified_at).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-warning">Not verified</span>
                              )}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="card border-0 shadow-sm mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">Statistics</h6>
                        </div>
                        <div className="card-body">
                          {stats && (
                            <dl className="row mb-0">
                              <dt className="col-sm-6">Total Investments:</dt>
                              <dd className="col-sm-6">₦{stats.total_investments.toLocaleString()}</dd>
                              
                              <dt className="col-sm-6">Total Tokens:</dt>
                              <dd className="col-sm-6">{stats.total_tokens.toLocaleString()}</dd>
                              
                              <dt className="col-sm-6">Total Transactions:</dt>
                              <dd className="col-sm-6">{stats.total_transactions}</dd>
                              
                              <dt className="col-sm-6">Total Deposits:</dt>
                              <dd className="col-sm-6 text-success">₦{stats.total_deposits.toLocaleString()}</dd>
                              
                              <dt className="col-sm-6">Total Withdrawals:</dt>
                              <dd className="col-sm-6 text-danger">₦{stats.total_withdrawals.toLocaleString()}</dd>
                            </dl>
                          )}
                        </div>
                      </div>

                      <div className="d-grid gap-2">
                        <button 
                          className="btn btn-outline-warning"
                          onClick={handleResetPassword}
                        >
                          <i className="bi bi-key me-2"></i>Reset Password
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Tab */}
                {activeTab === 'wallet' && (
                  <div>
                    {/* Wallet Info */}
                    <div className="card border-0 shadow-sm mb-4">
                      <div className="card-header bg-light">
                        <h6 className="mb-0"><i className="bi bi-wallet2 me-2"></i>Wallet</h6>
                      </div>
                      <div className="card-body">
                        {user.wallet ? (
                          <div className="row">
                            <div className="col-md-6">
                              <h3 className="mb-0">{user.wallet.currency} {user.wallet.balance.toLocaleString()}</h3>
                              <p className="text-muted mb-0">Current Balance</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted mb-0">No wallet created</p>
                        )}
                      </div>
                    </div>

                    {/* Investments */}
                    {user.tokens && user.tokens.length > 0 && (
                      <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-light">
                          <h6 className="mb-0"><i className="bi bi-bar-chart me-2"></i>Investments</h6>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Asset ID</th>
                                  <th>Asset Name</th>
                                  <th>Shares</th>
                                  <th className="text-end">Investment Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {user.tokens.map((token) => (
                                  <tr key={token.id}>
                                    <td>{token.asset.asset_id}</td>
                                    <td>{token.asset.name}</td>
                                    <td>{token.shares}</td>
                                    <td className="text-end">₦{token.investment_amount.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Transactions */}
                    {user.walletTransactions && user.walletTransactions.length > 0 && (
                      <div className="card border-0 shadow-sm">
                        <div className="card-header bg-light">
                          <h6 className="mb-0"><i className="bi bi-arrow-left-right me-2"></i>Recent Transactions</h6>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Type</th>
                                  <th>Description</th>
                                  <th className="text-end">Amount</th>
                                  <th>Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {user.walletTransactions.map((txn) => (
                                  <tr key={txn.id}>
                                    <td>
                                      <span className={`badge bg-${txn.type === 'deposit' ? 'success' : 'danger'}`}>
                                        {txn.type}
                                      </span>
                                    </td>
                                    <td>{txn.description}</td>
                                    <td className={`text-end ${txn.type === 'deposit' ? 'text-success' : 'text-danger'}`}>
                                      {txn.type === 'deposit' ? '+' : '-'}₦{txn.amount.toLocaleString()}
                                    </td>
                                    <td>{new Date(txn.created_at).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Tab */}
                {activeTab === 'activity' && (
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-light">
                      <h6 className="mb-0"><i className="bi bi-clock-history me-2"></i>Activity Log</h6>
                    </div>
                    <div className="card-body">
                      {activityLogs.length > 0 ? (
                        <div className="timeline">
                          {activityLogs.map((log) => (
                            <div key={log.id} className="mb-3 pb-3 border-bottom">
                              <div className="d-flex justify-content-between">
                                <strong>{log.action.replace(/_/g, ' ').toUpperCase()}</strong>
                                <small className="text-muted">
                                  {new Date(log.created_at).toLocaleString()}
                                </small>
                              </div>
                              <div className="text-muted small mt-1">
                                {log.entity_type}: {JSON.stringify(log.metadata)}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted text-center py-4">No activity logs found</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Edit/Create Form
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={saving}
                    />
                    {errors.name && (
                      <div className="invalid-feedback">{errors.name[0]}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={saving}
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email[0]}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={saving}
                    />
                    {errors.phone && (
                      <div className="invalid-feedback">{errors.phone[0]}</div>
                    )}
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Role *</label>
                    <select
                      className={`form-select ${errors.role ? 'is-invalid' : ''}`}
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      disabled={saving}
                    >
                      <option value="investor">Investor</option>
                      <option value="operator">Operator</option>
                      <option value="driver">Driver</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && (
                      <div className="invalid-feedback">{errors.role[0]}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">KYC Status</label>
                    <select
                      className={`form-select ${errors.kyc_status ? 'is-invalid' : ''}`}
                      value={formData.kyc_status}
                      onChange={(e) => setFormData({ ...formData, kyc_status: e.target.value as any })}
                      disabled={saving}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    {errors.kyc_status && (
                      <div className="invalid-feedback">{errors.kyc_status[0]}</div>
                    )}
                  </div>

                  {mode === 'create' && (
                    <div className="mb-3">
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        disabled={saving}
                        placeholder="Minimum 6 characters"
                      />
                      {errors.password && (
                        <div className="invalid-feedback">{errors.password[0]}</div>
                      )}
                    </div>
                  )}

                  {mode === 'edit' && (
                    <div className="mb-3">
                      <label className="form-label">New Password (leave blank to keep current)</label>
                      <input
                        type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        disabled={saving}
                        placeholder="Minimum 6 characters"
                      />
                      {errors.password && (
                        <div className="invalid-feedback">{errors.password[0]}</div>
                      )}
                    </div>
                  )}
                </div>

                {mode === 'create' && (
                  <div className="col-12">
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      <small>
                        User will be automatically verified and a wallet will be created. 
                        An email with login credentials will be sent to the user.
                      </small>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    {mode === 'create' ? 'Create User' : 'Save Changes'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

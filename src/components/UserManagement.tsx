import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'operator' | 'investor' | 'driver';
  kyc_status: 'pending' | 'approved' | 'rejected';
  is_active: boolean;
  created_at: string;
  wallet_balance: number;
  wallet_currency: string;
  total_investments: number;
  total_transactions: number;
}

interface UserStats {
  total: number;
  by_role: Record<string, number>;
  by_kyc: Record<string, number>;
  active: number;
  inactive: number;
}

interface UserManagementProps {
  onViewDetails: (userId: number) => void;
  onEditUser: (user: User) => void;
  onCreateUser: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  onViewDetails,
  onEditUser,
  onCreateUser
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [kycFilter, setKycFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(15);

  const apiClient = {
    get: async (url: string) => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw error;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }
      return response.json();
    },
    post: async (url: string, body?: any) => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw error;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }
      return response.json();
    },
    delete: async (url: string) => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw error;
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }
      return response.json();
    },
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, kycFilter, statusFilter, sortBy, sortOrder, currentPage, perPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (search) params.append('search', search);
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (kycFilter !== 'all') params.append('kyc_status', kycFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await apiClient.get(`/admin/user-management?${params.toString()}`);
      
      if (response.success) {
        setUsers(response.users.data);
        setStats(response.stats);
        setTotalPages(response.users.last_page);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Error', message: 'Failed to load users' }
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleBulkAction = async (action: string, additionalData?: any) => {
    if (selectedUsers.length === 0) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'warning', title: 'No Selection', message: 'Please select users first' }
      }));
      return;
    }

    try {
      const response = await apiClient.post('/admin/user-management/bulk-action', {
        action,
        user_ids: selectedUsers,
        ...additionalData,
      });

      if (response.success) {
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { type: 'success', title: 'Success', message: response.message }
        }));
        setSelectedUsers([]);
        fetchUsers();
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Error', message: 'Bulk action failed' }
      }));
    }
  };

  const handleToggleStatus = async (userId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      const response = await apiClient.post(`/admin/user-management/${userId}/toggle-status`);
      if (response.success) {
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { type: 'success', title: 'Success', message: response.message }
        }));
        fetchUsers();
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Error', message: 'Failed to toggle status' }
      }));
    }
  };

  const handleDeleteUser = async (userId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/admin/user-management/${userId}`);
      if (response.success) {
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { type: 'success', title: 'Success', message: response.message }
        }));
        fetchUsers();
      }
    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Error', message: error.message || 'Failed to delete user' }
      }));
    }
  };

  const exportToCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (kycFilter !== 'all') params.append('kyc_status', kycFilter);

      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(
        `http://127.0.0.1:8000/api/admin/user-management/export/csv?${params.toString()}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Error', message: 'Failed to export CSV' }
      }));
    }
  };

  const getRoleBadgeClass = (role: string) => {
    const classes: Record<string, string> = {
      admin: 'danger',
      operator: 'primary',
      investor: 'success',
      driver: 'info',
    };
    return classes[role] || 'secondary';
  };

  const getKycBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      approved: 'success',
      pending: 'warning',
      rejected: 'danger',
    };
    return classes[status] || 'secondary';
  };

  return (
    <div className="user-management">
      {/* Stats Cards */}
      {stats && (
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-0">Total Users</h6>
                    <h3 className="mb-0 mt-2">{stats.total}</h3>
                  </div>
                  <i className="bi bi-people fs-1 text-primary opacity-25"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-0">Active</h6>
                    <h3 className="mb-0 mt-2 text-success">{stats.active}</h3>
                  </div>
                  <i className="bi bi-check-circle fs-1 text-success opacity-25"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-0">Inactive</h6>
                    <h3 className="mb-0 mt-2 text-warning">{stats.inactive}</h3>
                  </div>
                  <i className="bi bi-exclamation-circle fs-1 text-warning opacity-25"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-0">KYC Approved</h6>
                    <h3 className="mb-0 mt-2 text-info">{stats.by_kyc.approved || 0}</h3>
                  </div>
                  <i className="bi bi-shield-check fs-1 text-info opacity-25"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3">
            {/* Search */}
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, phone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="investor">Investor</option>
                <option value="driver">Driver</option>
              </select>
            </div>

            {/* KYC Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={kycFilter}
                onChange={(e) => {
                  setKycFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All KYC</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Actions */}
            <div className="col-md-2">
              <button
                className="btn btn-primary w-100"
                onClick={onCreateUser}
              >
                <i className="bi bi-plus-circle me-2"></i>Create User
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="d-flex gap-2 align-items-center">
                <span className="text-muted">
                  {selectedUsers.length} selected
                </span>
                <div className="btn-group">
                  <button
                    className="btn btn-sm btn-outline-success"
                    onClick={() => handleBulkAction('activate')}
                  >
                    <i className="bi bi-check-circle me-1"></i>Activate
                  </button>
                  <button
                    className="btn btn-sm btn-outline-warning"
                    onClick={() => handleBulkAction('deactivate')}
                  >
                    <i className="bi bi-x-circle me-1"></i>Deactivate
                  </button>
                  <button
                    className="btn btn-sm btn-outline-info"
                    onClick={() => handleBulkAction('approve_kyc')}
                  >
                    <i className="bi bi-shield-check me-1"></i>Approve KYC
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <i className="bi bi-trash me-1"></i>Delete
                  </button>
                </div>
                <button
                  className="btn btn-sm btn-outline-secondary ms-auto"
                  onClick={exportToCsv}
                >
                  <i className="bi bi-download me-1"></i>Export CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-3"></i>
              <p>No users found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('name')}
                    >
                      Name {sortBy === 'name' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      )}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('email')}
                    >
                      Email {sortBy === 'email' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      )}
                    </th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('role')}
                    >
                      Role {sortBy === 'role' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      )}
                    </th>
                    <th>KYC Status</th>
                    <th>Status</th>
                    <th>Wallet Balance</th>
                    <th>Investments</th>
                    <th 
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSort('created_at')}
                    >
                      Created {sortBy === 'created_at' && (
                        <i className={`bi bi-arrow-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
                      )}
                    </th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onViewDetails(user.id)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </td>
                      <td>
                        <div>
                          <strong>{user.name}</strong>
                          {user.phone && (
                            <div className="small text-muted">{user.phone}</div>
                          )}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge bg-${getRoleBadgeClass(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${getKycBadgeClass(user.kyc_status)}`}>
                          {user.kyc_status}
                        </span>
                      </td>
                      <td>
                        {user.is_active ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-secondary">Inactive</span>
                        )}
                      </td>
                      <td>
                        {user.wallet_currency} {user.wallet_balance.toLocaleString()}
                      </td>
                      <td>
                        ₦{user.total_investments.toLocaleString()}
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(user.created_at).toLocaleDateString()}
                        </small>
                      </td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => onEditUser(user)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className={`btn btn-outline-${user.is_active ? 'warning' : 'success'}`}
                            onClick={(e) => handleToggleStatus(user.id, e)}
                            title={user.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <i className={`bi bi-${user.is_active ? 'pause' : 'play'}-circle`}></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={(e) => handleDeleteUser(user.id, e)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">
                Page {currentPage} of {totalPages}
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
              <select
                className="form-select form-select-sm w-auto"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="10">10 per page</option>
                <option value="15">15 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

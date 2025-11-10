import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

interface RoleCapability {
  id: number;
  role: 'investor' | 'operator' | 'driver' | 'admin';
  capability: string;
  description: string;
  is_enabled: boolean;
}

interface RoleStats {
  role: string;
  total_users: number;
  active_users: number;
  capabilities_count: number;
}

export const AdminRoleManager: React.FC = () => {
  const [capabilities, setCapabilities] = useState<RoleCapability[]>([]);
  const [roleStats, setRoleStats] = useState<RoleStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [editingCapability, setEditingCapability] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>({
    admin: false,
    operator: false,
    investor: false,
    driver: false
  });
  const [newCapability, setNewCapability] = useState({
    role: 'investor' as 'investor' | 'operator' | 'driver' | 'admin',
    capability: '',
    description: '',
    is_enabled: true
  });

  useEffect(() => {
    loadCapabilities();
    loadRoleStats();
  }, [selectedRole]);

  const loadCapabilities = async () => {
    try {
      setLoading(true);
      const endpoint = selectedRole === 'all' 
        ? '/admin/capabilities' 
        : `/admin/capabilities?role=${selectedRole}`;
      const data = await apiClient.get(endpoint);
      setCapabilities(data.capabilities || []);
    } catch (error) {
      console.error('Failed to load capabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleStats = async () => {
    try {
      const data = await apiClient.get('/admin/role-stats');
      setRoleStats(data.stats || []);
    } catch (error) {
      console.error('Failed to load role stats:', error);
    }
  };

  const toggleCapability = async (id: number, currentStatus: boolean) => {
    try {
      await apiClient.put(`/admin/capabilities/${id}`, {
        is_enabled: !currentStatus
      });
      
      // Update local state
      setCapabilities(capabilities.map(cap => 
        cap.id === id ? { ...cap, is_enabled: !currentStatus } : cap
      ));
      
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { 
          type: 'success', 
          title: 'Updated', 
          message: `Capability ${!currentStatus ? 'enabled' : 'disabled'}` 
        }
      }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { 
          type: 'danger', 
          title: 'Error', 
          message: 'Failed to update capability' 
        }
      }));
    }
  };

  const addCapability = async () => {
    try {
      const data = await apiClient.post('/admin/capabilities', newCapability);
      setCapabilities([...capabilities, data.capability]);
      setShowAddModal(false);
      setNewCapability({
        role: 'investor',
        capability: '',
        description: '',
        is_enabled: true
      });
      
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { 
          type: 'success', 
          title: 'Added', 
          message: 'New capability added successfully' 
        }
      }));
      
      loadRoleStats();
    } catch (error) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { 
          type: 'danger', 
          title: 'Error', 
          message: 'Failed to add capability' 
        }
      }));
    }
  };

  const deleteCapability = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this capability?')) return;
    
    try {
      await apiClient.delete(`/admin/capabilities/${id}`);
      setCapabilities(capabilities.filter(cap => cap.id !== id));
      
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { 
          type: 'success', 
          title: 'Deleted', 
          message: 'Capability deleted successfully' 
        }
      }));
      
      loadRoleStats();
    } catch (error) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { 
          type: 'danger', 
          title: 'Error', 
          message: 'Failed to delete capability' 
        }
      }));
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'danger',
      operator: 'primary',
      investor: 'success',
      driver: 'info'
    };
    return colors[role] || 'secondary';
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      admin: 'shield-fill-check',
      operator: 'building',
      investor: 'graph-up-arrow',
      driver: 'person-badge'
    };
    return icons[role] || 'person';
  };

  const toggleRole = (role: string) => {
    setExpandedRoles(prev => ({
      ...prev,
      [role]: !prev[role]
    }));
  };

  const toggleAllRoles = (expand: boolean) => {
    setExpandedRoles({
      admin: expand,
      operator: expand,
      investor: expand,
      driver: expand
    });
  };

  // Group capabilities by role
  const groupedCapabilities = capabilities.reduce((acc, cap) => {
    if (!acc[cap.role]) {
      acc[cap.role] = [];
    }
    acc[cap.role].push(cap);
    return acc;
  }, {} as Record<string, RoleCapability[]>);

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-gradient bg-primary text-white">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-shield-lock me-2"></i>
            Role & Capability Management
          </h5>
          <button 
            className="btn btn-light btn-sm"
            onClick={() => setShowAddModal(true)}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Add Capability
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Role Statistics */}
        <div className="row g-3 mb-4">
          {roleStats.map(stat => (
            <div className="col-md-3" key={stat.role}>
              <div className="card border">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <i className={`bi bi-${getRoleIcon(stat.role)} text-${getRoleBadgeColor(stat.role)} fs-3 me-3`}></i>
                    <div>
                      <h6 className="mb-0 text-uppercase">{stat.role}</h6>
                      <small className="text-muted">{stat.capabilities_count} capabilities</small>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">Total Users</small>
                      <strong>{stat.total_users}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">Active</small>
                      <strong className="text-success">{stat.active_users}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="btn-group" role="group">
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => toggleAllRoles(true)}
              >
                <i className="bi bi-arrows-expand me-1"></i>
                Expand All
              </button>
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => toggleAllRoles(false)}
              >
                <i className="bi bi-arrows-collapse me-1"></i>
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Capabilities Accordion by Role */}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : capabilities.length === 0 ? (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            No capabilities found. Click "Add Capability" to create one.
          </div>
        ) : (
          <div className="accordion" id="capabilitiesAccordion">
            {['admin', 'operator', 'investor', 'driver'].map((role) => {
              const roleCaps = groupedCapabilities[role] || [];
              const enabledCount = roleCaps.filter(c => c.is_enabled).length;
              
              return (
                <div className="accordion-item" key={role}>
                  <h2 className="accordion-header">
                    <button
                      className={`accordion-button ${!expandedRoles[role] ? 'collapsed' : ''}`}
                      type="button"
                      onClick={() => toggleRole(role)}
                    >
                      <div className="d-flex align-items-center w-100">
                        <span className={`badge bg-${getRoleBadgeColor(role)} me-3`}>
                          <i className={`bi bi-${getRoleIcon(role)} me-1`}></i>
                          {role.toUpperCase()}
                        </span>
                        <span className="me-auto">
                          {roleCaps.length} {roleCaps.length === 1 ? 'capability' : 'capabilities'}
                        </span>
                        <span className="badge bg-success me-2">
                          {enabledCount} enabled
                        </span>
                        <span className="badge bg-secondary">
                          {roleCaps.length - enabledCount} disabled
                        </span>
                      </div>
                    </button>
                  </h2>
                  <div
                    className={`accordion-collapse collapse ${expandedRoles[role] ? 'show' : ''}`}
                  >
                    <div className="accordion-body p-0">
                      {roleCaps.length === 0 ? (
                        <div className="p-3 text-muted">
                          <i className="bi bi-info-circle me-2"></i>
                          No capabilities defined for this role.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th style={{ width: '25%' }}>Capability</th>
                                <th style={{ width: '45%' }}>Description</th>
                                <th style={{ width: '15%' }}>Status</th>
                                <th style={{ width: '15%' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {roleCaps.map(cap => (
                                <tr key={cap.id}>
                                  <td>
                                    <strong>{cap.capability}</strong>
                                  </td>
                                  <td>
                                    <small className="text-muted">{cap.description}</small>
                                  </td>
                                  <td>
                                    <div className="form-check form-switch">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={cap.is_enabled}
                                        onChange={() => toggleCapability(cap.id, cap.is_enabled)}
                                        id={`switch-${cap.id}`}
                                      />
                                      <label className="form-check-label" htmlFor={`switch-${cap.id}`}>
                                        {cap.is_enabled ? (
                                          <span className="badge bg-success">Enabled</span>
                                        ) : (
                                          <span className="badge bg-secondary">Disabled</span>
                                        )}
                                      </label>
                                    </div>
                                  </td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => deleteCapability(cap.id)}
                                      title="Delete capability"
                                    >
                                      <i className="bi bi-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Capability Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Add New Capability
                </h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    value={newCapability.role}
                    onChange={(e) => setNewCapability({
                      ...newCapability,
                      role: e.target.value as any
                    })}
                  >
                    <option value="investor">Investor</option>
                    <option value="operator">Operator</option>
                    <option value="driver">Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Capability Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., manage_assets, view_revenue"
                    value={newCapability.capability}
                    onChange={(e) => setNewCapability({
                      ...newCapability,
                      capability: e.target.value
                    })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Describe what this capability allows"
                    value={newCapability.description}
                    onChange={(e) => setNewCapability({
                      ...newCapability,
                      description: e.target.value
                    })}
                  ></textarea>
                </div>

                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={newCapability.is_enabled}
                      onChange={(e) => setNewCapability({
                        ...newCapability,
                        is_enabled: e.target.checked
                      })}
                    />
                    <label className="form-check-label">
                      Enable immediately
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addCapability}
                  disabled={!newCapability.capability || !newCapability.description}
                >
                  <i className="bi bi-check-circle me-2"></i>
                  Add Capability
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

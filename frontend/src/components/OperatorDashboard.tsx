import React, { useState, useEffect } from 'react';
import PayoutInitiationSection from '../components/PayoutInitiationSection';
import PayoutDistribution from '../components/PayoutDistribution';
import MaintenanceApproval from '../components/MaintenanceApproval';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Asset {
  id: number;
  asset_id: string;
  model: string;
  type: string;
  status: string;
  soh: number;
  assigned_driver?: string;
  total_revenue: number;
}

interface Metrics {
  totalAssets: number;
  activeDrivers: number;
  totalRevenue: number;
  totalInvestors: number;
}

export const OperatorDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalAssets: 0,
    activeDrivers: 0,
    totalRevenue: 0,
    totalInvestors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load user
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }

      // Load assets
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await fetch('/api/assets', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const assetsData = data.assets || data.data || [];
          setAssets(assetsData);
          
          // Calculate metrics
          const totalAssets = assetsData.length;
          const activeDrivers = assetsData.filter((a: Asset) => a.assigned_driver).length;
          const totalRevenue = assetsData.reduce((sum: number, a: Asset) => sum + (a.total_revenue || 0), 0);
          
          setMetrics({
            totalAssets,
            activeDrivers,
            totalRevenue,
            totalInvestors: 0 // This would come from a separate API
          });
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Dashboard Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h1 className="display-5 fw-bold mb-2">Operator Dashboard</h1>
          <p className="text-muted">
            Welcome back{user?.name ? `, ${user.name}` : ''}! Manage your fleet and distribute payouts.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Total Assets</h6>
              <h2 className="card-title mb-0">{metrics.totalAssets}</h2>
              <small className="text-muted">Fleet vehicles</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Active Drivers</h6>
              <h2 className="card-title mb-0">{metrics.activeDrivers}</h2>
              <small className="text-muted">Currently assigned</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Total Revenue</h6>
              <h2 className="card-title mb-0">₦{metrics.totalRevenue.toLocaleString()}</h2>
              <small className="text-muted">All-time earnings</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card">
            <div className="card-body">
              <h6 className="card-subtitle mb-2 text-muted">Investors</h6>
              <h2 className="card-title mb-0">{metrics.totalInvestors}</h2>
              <small className="text-muted">Token holders</small>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Distribution Section */}
      <div className="row mb-4">
        <div className="col-12">
          <PayoutInitiationSection />
        </div>
      </div>

      {/* Revenue Distribution - NEW */}
      <div className="row mb-4">
        <div className="col-12">
          <PayoutDistribution />
        </div>
      </div>

      {/* Maintenance Requests - NEW */}
      <div className="row mb-4">
        <div className="col-12">
          <MaintenanceApproval />
        </div>
      </div>

      {/* Fleet Assets Table */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Fleet Assets</h5>
            </div>
            <div className="card-body">
              {assets.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Asset ID</th>
                        <th>Model</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Battery SOH</th>
                        <th>Driver</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.map((asset: Asset) => (
                        <tr key={asset.id}>
                          <td><strong>{asset.asset_id}</strong></td>
                          <td>{asset.model}</td>
                          <td>
                            <span className="badge bg-info">{asset.type}</span>
                          </td>
                          <td>
                            <span className={`badge bg-${asset.status === 'active' ? 'success' : asset.status === 'maintenance' ? 'warning' : 'secondary'}`}>
                              {asset.status}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${asset.soh >= 80 ? 'success' : asset.soh >= 60 ? 'warning' : 'danger'}`}>
                              {asset.soh}%
                            </span>
                          </td>
                          <td>{asset.assigned_driver || <em className="text-muted">Unassigned</em>}</td>
                          <td><strong>₦{(asset.total_revenue || 0).toLocaleString()}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No assets found. Add vehicles to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Quick Actions</h5>
            </div>
            <div className="card-body">
              <div className="d-flex gap-2 flex-wrap">
                <button className="btn btn-primary">
                  <i className="bi bi-plus-circle me-2"></i>Add New Asset
                </button>
                <button className="btn btn-outline-primary">
                  <i className="bi bi-person-plus me-2"></i>Assign Driver
                </button>
                <button className="btn btn-outline-primary">
                  <i className="bi bi-battery-charging me-2"></i>Schedule Swap
                </button>
                <button className="btn btn-outline-primary">
                  <i className="bi bi-graph-up me-2"></i>View Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default OperatorDashboard;

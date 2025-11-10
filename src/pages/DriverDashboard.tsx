import React, { useState, useEffect } from 'react';
import { Asset, Rider } from '../types';
import { fetchRiders } from '../services/api';
import { RoleCapabilities } from '../components/RoleCapabilities';

interface DriverDashboardProps {
  assets: Asset[];
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ assets }) => {
  const [riderData, setRiderData] = useState<Rider | null>(null);
  const [assignedAssets, setAssignedAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      const riders = await fetchRiders();
      // In a real app, we'd filter by current user's rider ID
      // For now, we'll use the first rider as demo
      if (riders && riders.length > 0) {
        const currentRider = riders[0] as Rider;
        setRiderData(currentRider);
        
        // Get assigned assets (in real app, backend would provide this)
        // For demo, show first few assets
        const assigned = assets.filter(a => a.status === 'In Use').slice(0, 2);
        setAssignedAssets(assigned);
      }
    } catch (e) {
      console.warn('Failed to load driver data', e);
    } finally {
      setLoading(false);
    }
  };

  // Calculate earnings (mock data - would come from backend)
  const totalEarnings = 45000;
  const todaysEarnings = 1200;
  const totalTrips = 127;
  const totalSwaps = 34;

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Driver Dashboard</h1>
          <p className="text-muted mb-0">Your vehicles, earnings, and performance</p>
        </div>
        {riderData && (
          <div className="badge bg-success fs-6 px-3 py-2">
            <i className="bi bi-person-badge me-2"></i>
            {riderData.name}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <RoleCapabilities />

          {/* Earnings Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body bg-success text-white">
                  <h6 className="text-white-50 mb-2">Total Earnings</h6>
                  <h3 className="fw-bold mb-0">₦{totalEarnings.toLocaleString()}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body bg-info text-white">
                  <h6 className="text-white-50 mb-2">Today's Earnings</h6>
                  <h3 className="fw-bold mb-0">₦{todaysEarnings.toLocaleString()}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body bg-primary text-white">
                  <h6 className="text-white-50 mb-2">Total Trips</h6>
                  <h3 className="fw-bold mb-0">{totalTrips}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body bg-warning text-white">
                  <h6 className="text-white-50 mb-2">Battery Swaps</h6>
                  <h3 className="fw-bold mb-0">{totalSwaps}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Vehicles */}
          <div className="card shadow-sm mb-4 border-0">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0"><i className="bi bi-car-front me-2 text-primary"></i>My Assigned Vehicles</h5>
            </div>
            <div className="card-body">
              {assignedAssets.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-car-front-fill display-1 text-muted"></i>
                  <p className="text-muted mt-3">No vehicles assigned yet. Contact your fleet operator.</p>
                </div>
              ) : (
                <div className="row g-3">
                  {assignedAssets.map(asset => (
                    <div className="col-md-6" key={asset.id}>
                      <div className="card h-100 border">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h5 className="fw-bold mb-1">{asset.model}</h5>
                              <span className="badge bg-secondary">{asset.type}</span>
                            </div>
                            <span className={`badge ${
                              asset.status === 'In Use' ? 'bg-success' : 
                              asset.status === 'Available' ? 'bg-info' : 
                              'bg-warning'
                            }`}>
                              {asset.status}
                            </span>
                          </div>

                          <div className="row g-2 mb-3">
                            <div className="col-6">
                              <div className="d-flex align-items-center">
                                <i className="bi bi-battery-half text-success me-2"></i>
                                <div>
                                  <small className="text-muted d-block">Battery SOH</small>
                                  <strong>{asset.soh}%</strong>
                                </div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="d-flex align-items-center">
                                <i className="bi bi-shuffle text-primary me-2"></i>
                                <div>
                                  <small className="text-muted d-block">Total Swaps</small>
                                  <strong>{asset.swaps}</strong>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-success flex-fill">
                              <i className="bi bi-pin-map me-1"></i>View Routes
                            </button>
                            <button className="btn btn-sm btn-outline-primary flex-fill">
                              <i className="bi bi-lightning-charge me-1"></i>Request Swap
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0"><i className="bi bi-clock-history me-2 text-info"></i>Recent Trips</h5>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {[
                      { date: 'Today, 2:30 PM', route: 'Yaba → Ikeja', distance: '12km', earnings: 800 },
                      { date: 'Today, 11:15 AM', route: 'Ikeja → VI', distance: '18km', earnings: 1200 },
                      { date: 'Yesterday, 4:45 PM', route: 'VI → Lekki', distance: '15km', earnings: 1000 },
                      { date: 'Yesterday, 1:20 PM', route: 'Lekki → Ajah', distance: '22km', earnings: 1500 },
                    ].map((trip, idx) => (
                      <div key={idx} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold mb-1">{trip.route}</div>
                            <small className="text-muted">{trip.date} • {trip.distance}</small>
                          </div>
                          <span className="badge bg-success">₦{trip.earnings}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0"><i className="bi bi-lightning-charge me-2 text-warning"></i>Battery Swap History</h5>
                </div>
                <div className="card-body">
                  <div className="list-group list-group-flush">
                    {[
                      { date: 'Today, 1:00 PM', station: 'Ikeja Biogas Station', duration: '5 min', sohAfter: 95 },
                      { date: 'Yesterday, 3:30 PM', station: 'VI Swap Point', duration: '4 min', sohAfter: 93 },
                      { date: '2 days ago', station: 'Lekki Green Hub', duration: '6 min', sohAfter: 94 },
                      { date: '3 days ago', station: 'Yaba Energy Center', duration: '5 min', sohAfter: 96 },
                    ].map((swap, idx) => (
                      <div key={idx} className="list-group-item px-0">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold mb-1">{swap.station}</div>
                            <small className="text-muted">{swap.date} • {swap.duration}</small>
                          </div>
                          <span className="badge bg-success">SOH: {swap.sohAfter}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="card shadow-sm mt-4 border-0">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0"><i className="bi bi-graph-up me-2 text-success"></i>This Month's Performance</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 text-center">
                  <i className="bi bi-speedometer display-4 text-primary"></i>
                  <h4 className="fw-bold mt-2">1,240 km</h4>
                  <p className="text-muted mb-0">Distance Driven</p>
                </div>
                <div className="col-md-3 text-center">
                  <i className="bi bi-fuel-pump display-4 text-success"></i>
                  <h4 className="fw-bold mt-2">12 swaps</h4>
                  <p className="text-muted mb-0">Energy Efficiency</p>
                </div>
                <div className="col-md-3 text-center">
                  <i className="bi bi-star-fill display-4 text-warning"></i>
                  <h4 className="fw-bold mt-2">4.8/5.0</h4>
                  <p className="text-muted mb-0">Rating</p>
                </div>
                <div className="col-md-3 text-center">
                  <i className="bi bi-cash-stack display-4 text-info"></i>
                  <h4 className="fw-bold mt-2">₦{totalEarnings.toLocaleString()}</h4>
                  <p className="text-muted mb-0">Total Earnings</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

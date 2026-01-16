import React, { useState, useEffect, useCallback } from 'react';
import {
  DriverAPI,
  DriverDashboardData,
  StartTripData,
  EndTripData
} from '../services/api';
import { RoleCapabilities } from '../components/RoleCapabilities';

interface DriverDashboardProps {
  demoMode?: boolean;
}

export const DriverDashboard: React.FC<DriverDashboardProps> = ({ demoMode = false }) => {
  const [dashboardData, setDashboardData] = useState<DriverDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Trip control state
  const [showStartTripModal, setShowStartTripModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [tripForm, setTripForm] = useState<StartTripData>({});
  const [endTripForm, setEndTripForm] = useState<EndTripData>({ distance_km: 0 });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await DriverAPI.getDashboard();
      setDashboardData(data);
    } catch (e: any) {
      console.error('Failed to load driver dashboard', e);
      setError(e.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    // Refresh dashboard every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const handleClockIn = async () => {
    try {
      setActionLoading('clockIn');
      await DriverAPI.clockIn();
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to clock in');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading('clockOut');
      await DriverAPI.clockOut();
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to clock out');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartTrip = async () => {
    try {
      setActionLoading('startTrip');
      await DriverAPI.startTrip(tripForm);
      setShowStartTripModal(false);
      setTripForm({});
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to start trip');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndTrip = async () => {
    if (!dashboardData?.active_trip) return;
    try {
      setActionLoading('endTrip');
      await DriverAPI.endTrip(dashboardData.active_trip.id, endTripForm);
      setShowEndTripModal(false);
      setEndTripForm({ distance_km: 0 });
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to end trip');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelTrip = async () => {
    if (!dashboardData?.active_trip) return;
    if (!confirm('Are you sure you want to cancel this trip?')) return;
    try {
      setActionLoading('cancelTrip');
      await DriverAPI.cancelTrip(dashboardData.active_trip.id);
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to cancel trip');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestPayout = async () => {
    if (!confirm('Request payout for your pending earnings?')) return;
    try {
      setActionLoading('payout');
      const result = await DriverAPI.requestPayout();
      alert(`Payout of ₦${result.amount.toLocaleString()} requested successfully!`);
      await loadDashboardData();
    } catch (e: any) {
      alert(e.message || 'Failed to request payout');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading && !dashboardData) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading driver dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button className="btn btn-outline-danger btn-sm ms-3" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const data = dashboardData!;
  const isOnShift = data.driver.is_on_shift;
  const hasActiveTrip = !!data.active_trip;

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h2 fw-bold mb-1">Driver Dashboard</h1>
            {demoMode && <span className="badge bg-warning text-dark" title="Demo Mode active">DEMO</span>}
          </div>
          <p className="text-muted mb-0">Your trips, earnings, and performance</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          {/* Shift Status */}
          <div className={`badge fs-6 px-3 py-2 ${isOnShift ? 'bg-success' : 'bg-secondary'}`}>
            <i className={`bi ${isOnShift ? 'bi-clock-fill' : 'bi-clock'} me-2`}></i>
            {isOnShift ? 'On Shift' : 'Off Shift'}
          </div>
          {/* Clock In/Out Button */}
          <button
            className={`btn ${isOnShift ? 'btn-outline-danger' : 'btn-success'}`}
            onClick={isOnShift ? handleClockOut : handleClockIn}
            disabled={actionLoading === 'clockIn' || actionLoading === 'clockOut'}
          >
            {actionLoading === 'clockIn' || actionLoading === 'clockOut' ? (
              <span className="spinner-border spinner-border-sm me-2"></span>
            ) : (
              <i className={`bi ${isOnShift ? 'bi-box-arrow-right' : 'bi-box-arrow-in-right'} me-2`}></i>
            )}
            {isOnShift ? 'Clock Out' : 'Clock In'}
          </button>
        </div>
      </div>

      <RoleCapabilities />

      {/* Active Trip Banner */}
      {hasActiveTrip && (
        <div className="alert alert-info border-0 shadow-sm mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="alert-heading mb-1">
                <i className="bi bi-car-front-fill me-2"></i>
                Active Trip in Progress
              </h5>
              <p className="mb-0">
                Started {formatDate(data.active_trip!.started_at)}
                {data.active_trip!.start_address && ` from ${data.active_trip!.start_address}`}
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={() => setShowEndTripModal(true)}
                disabled={!!actionLoading}
              >
                <i className="bi bi-check-circle me-2"></i>End Trip
              </button>
              <button
                className="btn btn-outline-danger"
                onClick={handleCancelTrip}
                disabled={!!actionLoading}
              >
                {actionLoading === 'cancelTrip' ? (
                  <span className="spinner-border spinner-border-sm"></span>
                ) : (
                  <i className="bi bi-x-circle"></i>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body bg-success text-white">
              <h6 className="text-white-50 mb-2">Today's Earnings</h6>
              <h3 className="fw-bold mb-0">₦{data.today.earnings.toLocaleString()}</h3>
              <small className="text-white-50">{data.today.trips} trips • {parseFloat(String(data.today.distance)).toFixed(1)} km</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body bg-info text-white">
              <h6 className="text-white-50 mb-2">This Week</h6>
              <h3 className="fw-bold mb-0">₦{data.this_week.earnings.toLocaleString()}</h3>
              <small className="text-white-50">{data.this_week.trips} trips</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body bg-primary text-white">
              <h6 className="text-white-50 mb-2">This Month</h6>
              <h3 className="fw-bold mb-0">₦{data.this_month.earnings.toLocaleString()}</h3>
              <small className="text-white-50">{data.this_month.trips} trips</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body bg-warning text-white">
              <h6 className="text-white-50 mb-2">Pending Payout</h6>
              <h3 className="fw-bold mb-0">₦{data.lifetime.pending_earnings.toLocaleString()}</h3>
              {data.lifetime.pending_earnings > 0 && (
                <button
                  className="btn btn-sm btn-light mt-2"
                  onClick={handleRequestPayout}
                  disabled={actionLoading === 'payout'}
                >
                  {actionLoading === 'payout' ? (
                    <span className="spinner-border spinner-border-sm me-1"></span>
                  ) : (
                    <i className="bi bi-cash me-1"></i>
                  )}
                  Request Payout
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Vehicle Info */}
      <div className="row g-4 mb-4">
        {/* Start Trip Card */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-play-circle me-2 text-success"></i>
                Quick Actions
              </h5>
            </div>
            <div className="card-body">
              {!isOnShift ? (
                <div className="text-center py-4">
                  <i className="bi bi-clock display-4 text-muted"></i>
                  <p className="text-muted mt-3">Clock in to start accepting trips</p>
                  <button className="btn btn-success" onClick={handleClockIn} disabled={!!actionLoading}>
                    <i className="bi bi-box-arrow-in-right me-2"></i>Clock In Now
                  </button>
                </div>
              ) : hasActiveTrip ? (
                <div className="text-center py-4">
                  <i className="bi bi-car-front-fill display-4 text-info"></i>
                  <p className="text-muted mt-3">You have an active trip in progress</p>
                  <button className="btn btn-success" onClick={() => setShowEndTripModal(true)}>
                    <i className="bi bi-check-circle me-2"></i>Complete Trip
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-geo-alt display-4 text-success"></i>
                  <p className="text-muted mt-3">Ready to start a new trip</p>
                  <button
                    className="btn btn-success btn-lg"
                    onClick={() => setShowStartTripModal(true)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'startTrip' ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="bi bi-play-fill me-2"></i>
                    )}
                    Start New Trip
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned Vehicle */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-car-front me-2 text-primary"></i>
                Assigned Vehicle
              </h5>
            </div>
            <div className="card-body">
              {data.vehicle ? (
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="fw-bold mb-1">{data.vehicle.model}</h5>
                      <span className="badge bg-secondary">{data.vehicle.asset_id}</span>
                    </div>
                    <span className="badge bg-success">Active</span>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-battery-half text-success me-2"></i>
                        <div>
                          <small className="text-muted d-block">Battery SOH</small>
                          <strong>{data.vehicle.soh}%</strong>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-geo me-2 text-primary"></i>
                        <div>
                          <small className="text-muted d-block">Location</small>
                          <strong>{data.vehicle.location || 'N/A'}</strong>
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
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-car-front-fill display-4 text-muted"></i>
                  <p className="text-muted mt-3">No vehicle assigned. Contact your fleet operator.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips & Performance */}
      <div className="row g-4">
        {/* Recent Trips */}
        <div className="col-md-8">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2 text-info"></i>
                Recent Trips
              </h5>
              <span className="badge bg-primary">{data.lifetime.total_trips} Total</span>
            </div>
            <div className="card-body">
              {data.recent_trips.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-geo-alt display-4 text-muted"></i>
                  <p className="text-muted mt-3">No trips yet. Start your first trip!</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {data.recent_trips.map((trip) => (
                    <div key={trip.id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-bold mb-1">
                            Trip #{trip.trip_id.split('-')[1] || trip.trip_id}
                            {trip.vehicle && (
                              <span className="badge bg-light text-dark ms-2">{trip.vehicle}</span>
                            )}
                          </div>
                          <small className="text-muted">
                            {formatDate(trip.started_at || trip.ended_at)} •
                            {parseFloat(String(trip.distance_km)).toFixed(1)} km •
                            {formatDuration(trip.duration_minutes)}
                          </small>
                        </div>
                        <div className="text-end">
                          <span className="badge bg-success fs-6">₦{trip.total_earnings.toLocaleString()}</span>
                          <br />
                          <small className={`badge mt-1 ${
                            trip.status === 'completed' ? 'bg-success' :
                            trip.status === 'active' ? 'bg-info' :
                            trip.status === 'cancelled' ? 'bg-danger' : 'bg-secondary'
                          }`}>
                            {trip.status}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lifetime Stats */}
        <div className="col-md-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">
                <i className="bi bi-graph-up me-2 text-success"></i>
                Lifetime Stats
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-4 text-center">
                <i className="bi bi-trophy display-4 text-warning"></i>
              </div>

              <div className="row g-3">
                <div className="col-6 text-center">
                  <h4 className="fw-bold text-primary mb-1">{data.lifetime.total_trips}</h4>
                  <small className="text-muted">Total Trips</small>
                </div>
                <div className="col-6 text-center">
                  <h4 className="fw-bold text-info mb-1">{parseFloat(String(data.lifetime.total_distance)).toFixed(0)} km</h4>
                  <small className="text-muted">Distance Driven</small>
                </div>
                <div className="col-12 text-center mt-3">
                  <h3 className="fw-bold text-success mb-1">₦{data.lifetime.total_earnings.toLocaleString()}</h3>
                  <small className="text-muted">Total Earnings</small>
                </div>
              </div>

              <hr className="my-4" />

              <div className="d-grid">
                <button className="btn btn-outline-primary" onClick={() => window.location.href = '/driver/earnings'}>
                  <i className="bi bi-bar-chart me-2"></i>
                  View Full Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Trip Modal */}
      {showStartTripModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-play-circle me-2 text-success"></i>
                  Start New Trip
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowStartTripModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Starting Location (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Ikeja, Lagos"
                    value={tripForm.address || ''}
                    onChange={(e) => setTripForm({ ...tripForm, address: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Battery Level (optional)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g., 85"
                    min="0"
                    max="100"
                    value={tripForm.battery_start || ''}
                    onChange={(e) => setTripForm({ ...tripForm, battery_start: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowStartTripModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleStartTrip}
                  disabled={actionLoading === 'startTrip'}
                >
                  {actionLoading === 'startTrip' ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-play-fill me-2"></i>
                  )}
                  Start Trip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Trip Modal */}
      {showEndTripModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-check-circle me-2 text-success"></i>
                  Complete Trip
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowEndTripModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Distance Traveled (km) <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g., 15.5"
                    step="0.1"
                    min="0"
                    value={endTripForm.distance_km || ''}
                    onChange={(e) => setEndTripForm({ ...endTripForm, distance_km: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">End Location (optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Victoria Island, Lagos"
                    value={endTripForm.address || ''}
                    onChange={(e) => setEndTripForm({ ...endTripForm, address: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Battery Level (optional)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g., 45"
                    min="0"
                    max="100"
                    value={endTripForm.battery_end || ''}
                    onChange={(e) => setEndTripForm({ ...endTripForm, battery_end: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEndTripModal(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleEndTrip}
                  disabled={actionLoading === 'endTrip' || endTripForm.distance_km <= 0}
                >
                  {actionLoading === 'endTrip' ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-check-circle me-2"></i>
                  )}
                  Complete Trip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

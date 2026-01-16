import React from 'react';
import { DriverTrip } from '../services/api';

interface TripCardProps {
  trip: DriverTrip;
  onEndTrip?: (tripId: number) => void;
  onCancelTrip?: (tripId: number) => void;
  onViewDetails?: (tripId: number) => void;
  compact?: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onEndTrip,
  onCancelTrip,
  onViewDetails,
  compact = false
}) => {
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
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'active': return 'bg-info';
      case 'cancelled': return 'bg-danger';
      case 'pending': return 'bg-warning';
      default: return 'bg-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'bi-check-circle-fill';
      case 'active': return 'bi-play-circle-fill';
      case 'cancelled': return 'bi-x-circle-fill';
      case 'pending': return 'bi-clock-fill';
      default: return 'bi-question-circle';
    }
  };

  if (compact) {
    return (
      <div className="list-group-item px-0 py-2">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <span className="fw-semibold">
              #{trip.trip_id.split('-')[1] || trip.trip_id.slice(0, 8)}
            </span>
            <small className="text-muted ms-2">
              {trip.distance_km.toFixed(1)} km • {formatDuration(trip.duration_minutes)}
            </small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-success">₦{trip.total_earnings.toLocaleString()}</span>
            <span className={`badge ${getStatusBadgeClass(trip.status)}`}>
              <i className={`bi ${getStatusIcon(trip.status)} me-1`}></i>
              {trip.status}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-geo-alt me-2 text-primary"></i>
            Trip #{trip.trip_id.split('-')[1] || trip.trip_id}
          </h6>
        </div>
        <span className={`badge ${getStatusBadgeClass(trip.status)}`}>
          <i className={`bi ${getStatusIcon(trip.status)} me-1`}></i>
          {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
        </span>
      </div>
      <div className="card-body">
        {/* Route Info */}
        <div className="mb-3">
          <div className="d-flex align-items-start mb-2">
            <i className="bi bi-circle-fill text-success me-2 mt-1" style={{ fontSize: '8px' }}></i>
            <div>
              <small className="text-muted">Start</small>
              <div>{trip.start_address || 'Location not recorded'}</div>
              <small className="text-muted">{formatDate(trip.started_at)}</small>
            </div>
          </div>
          {trip.status === 'completed' && (
            <div className="d-flex align-items-start">
              <i className="bi bi-circle-fill text-danger me-2 mt-1" style={{ fontSize: '8px' }}></i>
              <div>
                <small className="text-muted">End</small>
                <div>{trip.end_address || 'Location not recorded'}</div>
                <small className="text-muted">{formatDate(trip.ended_at)}</small>
              </div>
            </div>
          )}
        </div>

        {/* Trip Stats */}
        <div className="row g-2 mb-3">
          <div className="col-4">
            <div className="text-center p-2 bg-light rounded">
              <i className="bi bi-speedometer text-primary"></i>
              <div className="fw-bold">{trip.distance_km.toFixed(1)} km</div>
              <small className="text-muted">Distance</small>
            </div>
          </div>
          <div className="col-4">
            <div className="text-center p-2 bg-light rounded">
              <i className="bi bi-clock text-info"></i>
              <div className="fw-bold">{formatDuration(trip.duration_minutes)}</div>
              <small className="text-muted">Duration</small>
            </div>
          </div>
          <div className="col-4">
            <div className="text-center p-2 bg-light rounded">
              <i className="bi bi-battery-half text-success"></i>
              <div className="fw-bold">
                {trip.battery_start !== null && trip.battery_end !== null
                  ? `${trip.battery_start - trip.battery_end}%`
                  : 'N/A'}
              </div>
              <small className="text-muted">Battery Used</small>
            </div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="border-top pt-3">
          <h6 className="text-muted mb-2">Earnings Breakdown</h6>
          <div className="d-flex justify-content-between mb-1">
            <span>Base Fare</span>
            <span>₦{trip.base_fare.toLocaleString()}</span>
          </div>
          <div className="d-flex justify-content-between mb-1">
            <span>Distance Fare</span>
            <span>₦{trip.distance_fare.toLocaleString()}</span>
          </div>
          {trip.bonus > 0 && (
            <div className="d-flex justify-content-between mb-1 text-success">
              <span>Bonus</span>
              <span>+₦{trip.bonus.toLocaleString()}</span>
            </div>
          )}
          {trip.deductions > 0 && (
            <div className="d-flex justify-content-between mb-1 text-danger">
              <span>Deductions</span>
              <span>-₦{trip.deductions.toLocaleString()}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="d-flex justify-content-between fw-bold">
            <span>Total</span>
            <span className="text-success fs-5">₦{trip.total_earnings.toLocaleString()}</span>
          </div>
        </div>

        {/* Vehicle Info */}
        {trip.vehicle && (
          <div className="border-top pt-3 mt-3">
            <small className="text-muted">Vehicle</small>
            <div className="d-flex align-items-center">
              <i className="bi bi-car-front me-2 text-primary"></i>
              <span>{trip.vehicle.model}</span>
              <span className="badge bg-secondary ms-2">{trip.vehicle.asset_id}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(trip.status === 'active' || onViewDetails) && (
        <div className="card-footer bg-white border-top">
          <div className="d-flex gap-2">
            {trip.status === 'active' && onEndTrip && (
              <button
                className="btn btn-success flex-fill"
                onClick={() => onEndTrip(trip.id)}
              >
                <i className="bi bi-check-circle me-2"></i>End Trip
              </button>
            )}
            {trip.status === 'active' && onCancelTrip && (
              <button
                className="btn btn-outline-danger"
                onClick={() => onCancelTrip(trip.id)}
              >
                <i className="bi bi-x-circle"></i>
              </button>
            )}
            {onViewDetails && (
              <button
                className="btn btn-outline-primary flex-fill"
                onClick={() => onViewDetails(trip.id)}
              >
                <i className="bi bi-eye me-2"></i>Details
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TripCard;

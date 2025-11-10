import React, { useState, useEffect, useCallback } from 'react';
import { getStoredToken } from '../services/api';

interface LiveTelemetryData {
  asset_id: string;
  asset_type: string;
  asset_model?: string;
  battery_level?: number;
  km?: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  status?: string;
  temperature?: number;
  voltage?: number;
  current?: number;
  recorded_at: string;
  oem_source?: string;
  age_seconds: number;
}

interface LiveTelemetryResponse {
  telemetry: LiveTelemetryData[];
  count: number;
  as_of: string;
}

export const LiveTelemetryPanel: React.FC = () => {
  const [telemetry, setTelemetry] = useState<LiveTelemetryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLiveTelemetry = useCallback(async () => {
    try {
      const token = getStoredToken();
      const res = await fetch('http://localhost:8000/api/telemetry/live', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch telemetry: ${res.status}`);
      }

      const data: LiveTelemetryResponse = await res.json();
      setTelemetry(data.telemetry);
      setLastUpdate(data.as_of);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('Live telemetry fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveTelemetry();
  }, [fetchLiveTelemetry]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLiveTelemetry();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchLiveTelemetry]);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'charging': return 'success';
      case 'in_transit': return 'primary';
      case 'idle': return 'secondary';
      case 'swapping': return 'warning';
      default: return 'secondary';
    }
  };

  const getBatteryColor = (level?: number) => {
    if (!level) return 'secondary';
    if (level > 60) return 'success';
    if (level > 30) return 'warning';
    return 'danger';
  };

  const getDataAge = (ageSeconds: number) => {
    if (ageSeconds < 60) return `${ageSeconds}s ago`;
    const minutes = Math.floor(ageSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (loading && telemetry.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading telemetry...</span>
          </div>
          <p className="mt-3 text-muted">Loading live telemetry data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          <h5 className="mb-0">
            <i className="bi bi-broadcast me-2"></i>
            Live Fleet Telemetry
          </h5>
          <small className="text-muted">
            {telemetry.length} active asset{telemetry.length !== 1 ? 's' : ''} reporting
          </small>
        </div>
        <div>
          <div className="form-check form-switch d-inline-block me-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="autoRefreshSwitch"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <label className="form-check-label small" htmlFor="autoRefreshSwitch">
              Auto-refresh (5s)
            </label>
          </div>
          <button className="btn btn-sm btn-outline-primary" onClick={fetchLiveTelemetry}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>
      </div>

      <div className="card-body">
        {error && (
          <div className="alert alert-danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {lastUpdate && (
          <p className="text-muted small mb-3">
            <i className="bi bi-clock me-1"></i>
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </p>
        )}

        {telemetry.length === 0 ? (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            No active telemetry data in the last 5 minutes. Waiting for OEM updates...
          </div>
        ) : (
          <div className="row g-3">
            {telemetry.map((item) => (
              <div className="col-md-6 col-lg-4" key={item.asset_id}>
                <div className="card border-start border-primary border-3 h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-0">
                          <i className={`bi bi-${item.asset_type === 'vehicle' ? 'truck' : item.asset_type === 'battery' ? 'battery-charging' : 'building'} me-2`}></i>
                          {item.asset_id}
                        </h6>
                        <small className="text-muted text-uppercase">{item.asset_type}</small>
                        {item.asset_model && (
                          <small className="d-block text-muted">{item.asset_model}</small>
                        )}
                      </div>
                      <span className={`badge bg-${getStatusColor(item.status)}`}>
                        {item.status || 'unknown'}
                      </span>
                    </div>

                    {/* Battery Level */}
                    {item.battery_level !== undefined && item.battery_level !== null && (
                      <div className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-muted">Battery</small>
                          <small className="fw-bold">{item.battery_level}%</small>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div
                            className={`progress-bar bg-${getBatteryColor(item.battery_level)}`}
                            style={{ width: `${item.battery_level}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Metrics Grid */}
                    <div className="row g-2 small">
                      {item.km !== undefined && item.km !== null && (
                        <div className="col-6">
                          <div className="text-muted">Distance</div>
                          <div className="fw-bold">{item.km.toFixed(1)} km</div>
                        </div>
                      )}
                      {item.speed !== undefined && item.speed !== null && (
                        <div className="col-6">
                          <div className="text-muted">Speed</div>
                          <div className="fw-bold">{item.speed} km/h</div>
                        </div>
                      )}
                      {item.temperature !== undefined && item.temperature !== null && (
                        <div className="col-6">
                          <div className="text-muted">Temp</div>
                          <div className="fw-bold">{item.temperature.toFixed(1)}°C</div>
                        </div>
                      )}
                      {item.voltage !== undefined && item.voltage !== null && (
                        <div className="col-6">
                          <div className="text-muted">Voltage</div>
                          <div className="fw-bold">{item.voltage.toFixed(1)}V</div>
                        </div>
                      )}
                      {item.current !== undefined && item.current !== null && (
                        <div className="col-6">
                          <div className="text-muted">Current</div>
                          <div className="fw-bold">{item.current.toFixed(1)}A</div>
                        </div>
                      )}
                      {item.latitude && item.longitude && (
                        <div className="col-12">
                          <div className="text-muted">Location</div>
                          <div className="fw-bold small">
                            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <i className="bi bi-broadcast-pin me-1"></i>
                        {item.oem_source || 'Unknown OEM'}
                      </small>
                      <small className={`badge ${item.age_seconds < 60 ? 'bg-success' : 'bg-warning'}`}>
                        {getDataAge(item.age_seconds)}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

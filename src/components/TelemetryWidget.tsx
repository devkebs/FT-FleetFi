import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { apiClient } from '../services/api';

// Fix Leaflet default icon issue with webpack
try {
  const DefaultIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
  L.Marker.prototype.options.icon = DefaultIcon;
} catch (e) {
  console.warn('Leaflet icon setup warning:', e);
}

interface TelemetryData {
  id: number;
  asset_id: string;
  asset_type: string;
  latitude: number;
  longitude: number;
  speed: number;
  battery_level: number;
  temperature: number;
  voltage: number;
  current: number;
  state_of_health: number;
  odometer: number;
  status: string;
  timestamp: string;
}

interface TelemetryStats {
  total_assets: number;
  active_assets: number;
  avg_battery_level: number;
  avg_soh: number;
  total_distance: number;
  assets_charging: number;
  assets_in_use: number;
  assets_idle: number;
}

export const TelemetryWidget: React.FC = () => {
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<TelemetryData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'charging' | 'idle'>('all');

  // Custom map icons for different statuses
  const getMarkerIcon = (status: string, batteryLevel: number) => {
    const getColor = () => {
      if (status === 'in_use' || status === 'active') return '#28a745';
      if (status === 'charging') return '#ffc107';
      if (status === 'idle') return '#6c757d';
      if (status === 'maintenance') return '#dc3545';
      return '#6c757d';
    };

    const color = getColor();
    const iconHtml = `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
      ">
        ${Math.round(batteryLevel)}%
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  useEffect(() => {
    loadTelemetry();
    
    if (autoRefresh) {
      const interval = setInterval(loadTelemetry, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filterStatus]);

  const loadTelemetry = async () => {
    try {
      const response: any = await apiClient.get('/telemetry/live');
      const telemetryArray = response.telemetry || [];
      
      // Map the API response to our component's expected format
      const mappedData = telemetryArray.map((item: any, index: number) => ({
        id: index,
        asset_id: item.asset_id,
        asset_type: item.asset_type || 'vehicle',
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        speed: item.speed || 0,
        battery_level: item.battery_level || 0,
        temperature: item.temperature || 0,
        voltage: item.voltage || 0,
        current: item.current || 0,
        state_of_health: item.state_of_health || 100,
        odometer: item.km || 0,
        status: item.status || 'idle',
        timestamp: item.recorded_at || new Date().toISOString()
      }));
      
      setTelemetryData(mappedData);
      calculateStats(mappedData);
    } catch (error) {
      console.error('Failed to load telemetry:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: TelemetryData[]) => {
    const totalAssets = data.length;
    const activeAssets = data.filter(d => d.status === 'active' || d.status === 'in_use').length;
    const avgBattery = data.reduce((sum, d) => sum + d.battery_level, 0) / totalAssets || 0;
    const avgSoh = data.reduce((sum, d) => sum + d.state_of_health, 0) / totalAssets || 0;
    const totalDistance = data.reduce((sum, d) => sum + d.odometer, 0);
    const assetsCharging = data.filter(d => d.status === 'charging').length;
    const assetsInUse = data.filter(d => d.status === 'in_use').length;
    const assetsIdle = data.filter(d => d.status === 'idle').length;

    setStats({
      total_assets: totalAssets,
      active_assets: activeAssets,
      avg_battery_level: avgBattery,
      avg_soh: avgSoh,
      total_distance: totalDistance,
      assets_charging: assetsCharging,
      assets_in_use: assetsInUse,
      assets_idle: assetsIdle
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'success',
      in_use: 'primary',
      charging: 'warning',
      idle: 'secondary',
      maintenance: 'danger',
      offline: 'dark'
    };
    return colors[status] || 'secondary';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      active: 'check-circle-fill',
      in_use: 'bicycle',
      charging: 'lightning-charge-fill',
      idle: 'pause-circle-fill',
      maintenance: 'wrench',
      offline: 'x-circle-fill'
    };
    return icons[status] || 'circle';
  };

  const getBatteryColor = (level: number) => {
    if (level >= 80) return 'success';
    if (level >= 50) return 'primary';
    if (level >= 20) return 'warning';
    return 'danger';
  };

  const filteredData = telemetryData.filter(item => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return item.status === 'active' || item.status === 'in_use';
    if (filterStatus === 'charging') return item.status === 'charging';
    if (filterStatus === 'idle') return item.status === 'idle';
    return true;
  });

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-gradient bg-dark text-white">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-broadcast me-2"></i>
            Live Telemetry Monitor
            {autoRefresh && (
              <span className="ms-2">
                <span className="spinner-grow spinner-grow-sm text-success" role="status"></span>
                <small className="ms-2">Live</small>
              </span>
            )}
          </h5>
          <div className="btn-group btn-group-sm">
            <button
              className={`btn btn-outline-light ${autoRefresh ? 'active' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <i className={`bi bi-${autoRefresh ? 'pause' : 'play'}-fill me-1`}></i>
              {autoRefresh ? 'Auto' : 'Manual'}
            </button>
            <button
              className="btn btn-outline-light"
              onClick={loadTelemetry}
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Statistics Overview */}
        {stats && (
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-primary">
                <div className="card-body text-center">
                  <i className="bi bi-hdd-stack fs-1 text-primary mb-2"></i>
                  <h3 className="mb-0">{stats.total_assets}</h3>
                  <small className="text-muted">Total Assets</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-success">
                <div className="card-body text-center">
                  <i className="bi bi-check-circle fs-1 text-success mb-2"></i>
                  <h3 className="mb-0">{stats.active_assets}</h3>
                  <small className="text-muted">Active</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-info">
                <div className="card-body text-center">
                  <i className="bi bi-battery-charging fs-1 text-info mb-2"></i>
                  <h3 className="mb-0">{stats.avg_battery_level.toFixed(1)}%</h3>
                  <small className="text-muted">Avg Battery</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-warning">
                <div className="card-body text-center">
                  <i className="bi bi-heart-pulse fs-1 text-warning mb-2"></i>
                  <h3 className="mb-0">{stats.avg_soh.toFixed(1)}%</h3>
                  <small className="text-muted">Avg SOH</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Distribution */}
        <div className="row g-2 mb-4">
          <div className="col-md-3">
            <div className="d-flex align-items-center p-2 bg-light rounded">
              <i className="bi bi-bicycle text-primary fs-4 me-3"></i>
              <div>
                <strong>{stats?.assets_in_use || 0}</strong>
                <small className="d-block text-muted">In Use</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="d-flex align-items-center p-2 bg-light rounded">
              <i className="bi bi-lightning-charge-fill text-warning fs-4 me-3"></i>
              <div>
                <strong>{stats?.assets_charging || 0}</strong>
                <small className="d-block text-muted">Charging</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="d-flex align-items-center p-2 bg-light rounded">
              <i className="bi bi-pause-circle-fill text-secondary fs-4 me-3"></i>
              <div>
                <strong>{stats?.assets_idle || 0}</strong>
                <small className="d-block text-muted">Idle</small>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="d-flex align-items-center p-2 bg-light rounded">
              <i className="bi bi-speedometer2 text-info fs-4 me-3"></i>
              <div>
                <strong>{(stats?.total_distance || 0).toFixed(0)} km</strong>
                <small className="d-block text-muted">Total Distance</small>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="row mb-3">
          <div className="col-md-6">
            <div className="btn-group" role="group">
              <button
                className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('grid')}
              >
                <i className="bi bi-grid-3x3-gap me-1"></i>Grid
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('list')}
              >
                <i className="bi bi-list-ul me-1"></i>List
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setViewMode('map')}
              >
                <i className="bi bi-geo-alt me-1"></i>Map
              </button>
            </div>
          </div>
          <div className="col-md-6">
            <select
              className="form-select form-select-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="charging">Charging</option>
              <option value="idle">Idle</option>
            </select>
          </div>
        </div>

        {/* Data Display */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            No telemetry data available. Ensure assets are transmitting data.
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="row g-3">
                {filteredData.map(item => (
                  <div className="col-md-4 col-lg-3" key={item.id}>
                    <div 
                      className="card h-100 border cursor-pointer"
                      onClick={() => setSelectedAsset(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0">{item.asset_id}</h6>
                          <span className={`badge bg-${getStatusColor(item.status)}`}>
                            <i className={`bi bi-${getStatusIcon(item.status)} me-1`}></i>
                            {item.status}
                          </span>
                        </div>
                        
                        <div className="mb-2">
                          <small className="text-muted d-block">Battery Level</small>
                          <div className="progress" style={{ height: '8px' }}>
                            <div
                              className={`progress-bar bg-${getBatteryColor(item.battery_level)}`}
                              style={{ width: `${item.battery_level}%` }}
                            ></div>
                          </div>
                          <small className="text-muted">{item.battery_level.toFixed(1)}%</small>
                        </div>

                        <div className="row g-2">
                          <div className="col-6">
                            <small className="text-muted d-block">Speed</small>
                            <strong>{item.speed.toFixed(0)} km/h</strong>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block">SOH</small>
                            <strong>{item.state_of_health.toFixed(0)}%</strong>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block">Temp</small>
                            <strong>{item.temperature.toFixed(1)}°C</strong>
                          </div>
                          <div className="col-6">
                            <small className="text-muted d-block">Odometer</small>
                            <strong>{item.odometer.toFixed(0)} km</strong>
                          </div>
                        </div>
                      </div>
                      <div className="card-footer bg-light">
                        <small className="text-muted">
                          <i className="bi bi-clock me-1"></i>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Asset ID</th>
                      <th>Status</th>
                      <th>Battery</th>
                      <th>SOH</th>
                      <th>Speed</th>
                      <th>Temperature</th>
                      <th>Voltage</th>
                      <th>Odometer</th>
                      <th>Last Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map(item => (
                      <tr 
                        key={item.id}
                        onClick={() => setSelectedAsset(item)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td><strong>{item.asset_id}</strong></td>
                        <td>
                          <span className={`badge bg-${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress flex-grow-1 me-2" style={{ height: '8px', width: '60px' }}>
                              <div
                                className={`progress-bar bg-${getBatteryColor(item.battery_level)}`}
                                style={{ width: `${item.battery_level}%` }}
                              ></div>
                            </div>
                            <small>{item.battery_level.toFixed(0)}%</small>
                          </div>
                        </td>
                        <td>{item.state_of_health.toFixed(0)}%</td>
                        <td>{item.speed.toFixed(0)} km/h</td>
                        <td>{item.temperature.toFixed(1)}°C</td>
                        <td>{item.voltage.toFixed(1)}V</td>
                        <td>{item.odometer.toFixed(0)} km</td>
                        <td>
                          <small className="text-muted">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Map View */}
            {viewMode === 'map' && (
              <div style={{ height: '600px', borderRadius: '8px', overflow: 'hidden' }}>
                <MapContainer
                  center={[6.5244, 3.3792] as [number, number]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredData
                    .filter(item => item.latitude !== 0 && item.longitude !== 0)
                    .map(item => (
                      <Marker
                        key={item.id}
                        position={[item.latitude, item.longitude]}
                        eventHandlers={{
                          click: () => setSelectedAsset(item)
                        }}
                      >
                        <Popup>
                          <div style={{ minWidth: '200px' }}>
                            <h6 className="mb-2">
                              <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                              {item.asset_id}
                            </h6>
                            <div className="mb-2">
                              <span className={`badge bg-${getStatusColor(item.status)} mb-2`}>
                                <i className={`bi bi-${getStatusIcon(item.status)} me-1`}></i>
                                {item.status}
                              </span>
                            </div>
                            <table className="table table-sm table-borderless mb-0">
                              <tbody>
                                <tr>
                                  <td><strong>Battery:</strong></td>
                                  <td>{item.battery_level.toFixed(1)}%</td>
                                </tr>
                                <tr>
                                  <td><strong>Speed:</strong></td>
                                  <td>{item.speed.toFixed(0)} km/h</td>
                                </tr>
                                <tr>
                                  <td><strong>SOH:</strong></td>
                                  <td>{item.state_of_health.toFixed(0)}%</td>
                                </tr>
                                <tr>
                                  <td><strong>Temp:</strong></td>
                                  <td>{item.temperature.toFixed(1)}°C</td>
                                </tr>
                                <tr>
                                  <td><strong>Location:</strong></td>
                                  <td>
                                    <small>{item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</small>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                            <button
                              className="btn btn-sm btn-primary w-100 mt-2"
                              onClick={() => setSelectedAsset(item)}
                            >
                              <i className="bi bi-info-circle me-1"></i>
                              View Details
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
                {filteredData.filter(item => item.latitude === 0 && item.longitude === 0).length > 0 && (
                  <div className="alert alert-warning mt-3 mb-0">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {filteredData.filter(item => item.latitude === 0 && item.longitude === 0).length} asset(s) have no GPS coordinates and are not shown on the map.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-hdd-network me-2"></i>
                  Asset Telemetry Details - {selectedAsset.asset_id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedAsset(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="text-muted mb-3">Status & Location</h6>
                        <div className="mb-2">
                          <strong>Status:</strong>
                          <span className={`badge bg-${getStatusColor(selectedAsset.status)} ms-2`}>
                            {selectedAsset.status}
                          </span>
                        </div>
                        <div className="mb-2">
                          <strong>Type:</strong> {selectedAsset.asset_type}
                        </div>
                        <div className="mb-2">
                          <strong>Location:</strong> {selectedAsset.latitude.toFixed(6)}, {selectedAsset.longitude.toFixed(6)}
                        </div>
                        <div className="mb-2">
                          <strong>Speed:</strong> {selectedAsset.speed.toFixed(2)} km/h
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="text-muted mb-3">Battery & Health</h6>
                        <div className="mb-3">
                          <strong>Battery Level:</strong>
                          <div className="progress mt-1" style={{ height: '20px' }}>
                            <div
                              className={`progress-bar bg-${getBatteryColor(selectedAsset.battery_level)}`}
                              style={{ width: `${selectedAsset.battery_level}%` }}
                            >
                              {selectedAsset.battery_level.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="mb-2">
                          <strong>State of Health:</strong> {selectedAsset.state_of_health.toFixed(1)}%
                        </div>
                        <div className="mb-2">
                          <strong>Temperature:</strong> {selectedAsset.temperature.toFixed(1)}°C
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="text-muted mb-3">Electrical</h6>
                        <div className="mb-2">
                          <strong>Voltage:</strong> {selectedAsset.voltage.toFixed(2)}V
                        </div>
                        <div className="mb-2">
                          <strong>Current:</strong> {selectedAsset.current.toFixed(2)}A
                        </div>
                        <div className="mb-2">
                          <strong>Power:</strong> {(selectedAsset.voltage * selectedAsset.current).toFixed(2)}W
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6 className="text-muted mb-3">Usage</h6>
                        <div className="mb-2">
                          <strong>Odometer:</strong> {selectedAsset.odometer.toFixed(2)} km
                        </div>
                        <div className="mb-2">
                          <strong>Last Update:</strong><br />
                          <small>{new Date(selectedAsset.timestamp).toLocaleString()}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedAsset(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

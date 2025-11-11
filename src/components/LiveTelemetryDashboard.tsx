import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface VehicleTelemetry {
  vehicle_id: number;
  vehicle_registration: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  battery_level: number; // percentage
  battery_temperature: number; // celsius
  odometer: number; // km
  status: 'active' | 'idle' | 'charging' | 'offline';
  driver_id?: number;
  driver_name?: string;
  last_updated: string;
  route_history?: Array<{ lat: number; lng: number }>;
}

interface LiveTelemetryProps {
  vehicleId?: number;
  operatorId?: number;
  refreshInterval?: number; // milliseconds
}

export default function LiveTelemetryDashboard({ 
  vehicleId, 
  operatorId, 
  refreshInterval = 5000 
}: LiveTelemetryProps) {
  const [vehicles, setVehicles] = useState<VehicleTelemetry[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTelemetry();
    
    // Set up auto-refresh
    intervalRef.current = setInterval(() => {
      fetchTelemetry(false);
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [vehicleId, operatorId]);

  const fetchTelemetry = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const params = new URLSearchParams();
      if (vehicleId) params.append('vehicle_id', vehicleId.toString());
      if (operatorId) params.append('operator_id', operatorId.toString());
      
      const response = await fetch(`/api/telemetry/live?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch telemetry');

      const data = await response.json();
      setVehicles(data.vehicles);
      
      if (selectedVehicle) {
        const updated = data.vehicles.find((v: VehicleTelemetry) => v.vehicle_id === selectedVehicle.vehicle_id);
        if (updated) setSelectedVehicle(updated);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load telemetry');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'idle': return 'warning';
      case 'charging': return 'info';
      case 'offline': return 'secondary';
      default: return 'secondary';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'success';
    if (level > 30) return 'warning';
    return 'danger';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🚗';
      case 'idle': return '⏸️';
      case 'charging': return '🔋';
      case 'offline': return '❌';
      default: return '❓';
    }
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading live telemetry...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => fetchTelemetry()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-0">
                <i className="bi bi-broadcast text-primary me-2"></i>
                Live Vehicle Telemetry
              </h1>
              <p className="text-muted mb-0">Real-time fleet monitoring • Updates every {refreshInterval / 1000}s</p>
            </div>
            <div>
              <span className="badge bg-success">
                <i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i>
                Live
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Total Vehicles</p>
                  <h3 className="h4 mb-0">{vehicles.length}</h3>
                </div>
                <i className="bi bi-car-front-fill text-primary fs-2"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Active Now</p>
                  <h3 className="h4 mb-0 text-success">
                    {vehicles.filter(v => v.status === 'active').length}
                  </h3>
                </div>
                <i className="bi bi-activity text-success fs-2"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Charging</p>
                  <h3 className="h4 mb-0 text-info">
                    {vehicles.filter(v => v.status === 'charging').length}
                  </h3>
                </div>
                <i className="bi bi-battery-charging text-info fs-2"></i>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <p className="text-muted small mb-1">Avg Battery</p>
                  <h3 className="h4 mb-0">
                    {vehicles.length > 0 
                      ? Math.round(vehicles.reduce((sum, v) => sum + v.battery_level, 0) / vehicles.length)
                      : 0}%
                  </h3>
                </div>
                <i className="bi bi-battery-half text-warning fs-2"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Vehicle List */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white">
              <h5 className="mb-0">Fleet Overview</h5>
            </div>
            <div className="card-body p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {vehicles.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox fs-1 text-muted"></i>
                  <p className="text-muted mt-3">No vehicles online</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {vehicles.map((vehicle) => (
                    <button
                      key={vehicle.vehicle_id}
                      className={`list-group-item list-group-item-action ${
                        selectedVehicle?.vehicle_id === vehicle.vehicle_id ? 'active' : ''
                      }`}
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <span className="me-2">{getStatusIcon(vehicle.status)}</span>
                            <strong>{vehicle.vehicle_registration}</strong>
                          </div>
                          {vehicle.driver_name && (
                            <small className="text-muted">
                              <i className="bi bi-person me-1"></i>
                              {vehicle.driver_name}
                            </small>
                          )}
                        </div>
                        <div className="text-end">
                          <span className={`badge bg-${getStatusColor(vehicle.status)} mb-1`}>
                            {vehicle.status}
                          </span>
                          <br />
                          <span className={`badge bg-${getBatteryColor(vehicle.battery_level)}`}>
                            {vehicle.battery_level}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 d-flex justify-content-between">
                        <small>
                          <i className="bi bi-speedometer2 me-1"></i>
                          {vehicle.speed} km/h
                        </small>
                        <small className="text-muted">
                          {new Date(vehicle.last_updated).toLocaleTimeString()}
                        </small>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map and Details */}
        <div className="col-lg-8">
          {selectedVehicle ? (
            <>
              {/* Map */}
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-0" style={{ height: '400px' }}>
                  <MapContainer
                    center={[selectedVehicle.latitude, selectedVehicle.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker position={[selectedVehicle.latitude, selectedVehicle.longitude]}>
                      <Popup>
                        <strong>{selectedVehicle.vehicle_registration}</strong><br />
                        Speed: {selectedVehicle.speed} km/h<br />
                        Battery: {selectedVehicle.battery_level}%
                      </Popup>
                    </Marker>
                    {selectedVehicle.route_history && selectedVehicle.route_history.length > 0 && (
                      <Polyline
                        positions={selectedVehicle.route_history.map(point => [point.lat, point.lng])}
                        color="blue"
                        weight={3}
                        opacity={0.6}
                      />
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                  <h5 className="mb-0">{selectedVehicle.vehicle_registration} - Details</h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="border rounded p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-muted">Battery Level</small>
                            <h4 className={`mb-0 text-${getBatteryColor(selectedVehicle.battery_level)}`}>
                              {selectedVehicle.battery_level}%
                            </h4>
                          </div>
                          <i className="bi bi-battery-full fs-2 text-muted"></i>
                        </div>
                        <div className="progress mt-2" style={{ height: '10px' }}>
                          <div
                            className={`progress-bar bg-${getBatteryColor(selectedVehicle.battery_level)}`}
                            style={{ width: `${selectedVehicle.battery_level}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-muted">Current Speed</small>
                            <h4 className="mb-0">{selectedVehicle.speed} km/h</h4>
                          </div>
                          <i className="bi bi-speedometer2 fs-2 text-muted"></i>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded p-3">
                        <small className="text-muted">Battery Temperature</small>
                        <h4 className="mb-0">{selectedVehicle.battery_temperature}°C</h4>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="border rounded p-3">
                        <small className="text-muted">Odometer</small>
                        <h4 className="mb-0">{selectedVehicle.odometer.toLocaleString()} km</h4>
                      </div>
                    </div>

                    <div className="col-md-12">
                      <div className="border rounded p-3">
                        <small className="text-muted">Location</small>
                        <p className="mb-0">
                          <i className="bi bi-geo-alt me-2"></i>
                          {selectedVehicle.latitude.toFixed(6)}, {selectedVehicle.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>

                    {selectedVehicle.driver_name && (
                      <div className="col-md-12">
                        <div className="border rounded p-3">
                          <small className="text-muted">Current Driver</small>
                          <p className="mb-0">
                            <i className="bi bi-person me-2"></i>
                            {selectedVehicle.driver_name}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="col-md-12">
                      <small className="text-muted">
                        <i className="bi bi-clock me-1"></i>
                        Last updated: {new Date(selectedVehicle.last_updated).toLocaleString()}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-map fs-1 text-muted"></i>
                <p className="text-muted mt-3">Select a vehicle to view details and location</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

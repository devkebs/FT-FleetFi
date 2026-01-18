import React, { useState, useEffect, useCallback } from 'react';
import { SwapAPI, SwapStation, SwapTask } from '../services/api';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface BatterySwapSystemProps {
  vehicleId?: number;
  currentBatteryLevel?: number;
  vehicleSoh?: number;
  onSwapComplete?: (task: SwapTask) => void;
  onClose?: () => void;
}

type ViewMode = 'stations' | 'active' | 'history';

// ============================================================================
// Sub-Components
// ============================================================================

const SwapStatusBadge: React.FC<{ status: SwapTask['status'] }> = ({ status }) => {
  const statusConfig: Record<SwapTask['status'], { bg: string; text: string; icon: string }> = {
    pending: { bg: 'warning', text: 'Pending', icon: 'bi-clock' },
    enroute_to_station: { bg: 'info', text: 'En Route', icon: 'bi-geo-alt' },
    arrived_at_station: { bg: 'primary', text: 'Arrived', icon: 'bi-pin-map-fill' },
    swapping: { bg: 'success', text: 'Swapping', icon: 'bi-battery-charging' },
    swap_complete: { bg: 'success', text: 'Swap Done', icon: 'bi-check-circle' },
    completed: { bg: 'success', text: 'Completed', icon: 'bi-check-circle-fill' },
    cancelled: { bg: 'danger', text: 'Cancelled', icon: 'bi-x-circle' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`badge bg-${config.bg}`}>
      <i className={`bi ${config.icon} me-1`} />
      {config.text}
    </span>
  );
};

const StationCard: React.FC<{
  station: SwapStation;
  onSelect: (station: SwapStation) => void;
  isSelected: boolean;
}> = ({ station, onSelect, isSelected }) => {
  const availabilityPercent = (station.available_batteries / station.total_capacity) * 100;
  const availabilityColor = availabilityPercent >= 50 ? 'success' : availabilityPercent >= 20 ? 'warning' : 'danger';

  return (
    <div
      className={`card mb-2 cursor-pointer ${isSelected ? 'border-success border-2' : ''}`}
      onClick={() => onSelect(station)}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1">
            <h6 className="card-title mb-1">
              <i className="bi bi-battery-charging text-success me-2" />
              {station.name}
            </h6>
            <p className="text-muted small mb-1">
              <i className="bi bi-geo-alt me-1" />
              {station.address}
            </p>
            <div className="d-flex align-items-center gap-3 small">
              {station.distance_km !== undefined && (
                <span className="text-primary">
                  <i className="bi bi-signpost-2 me-1" />
                  {station.distance_km.toFixed(1)} km
                </span>
              )}
              {station.estimated_wait_minutes !== undefined && (
                <span className="text-muted">
                  <i className="bi bi-clock me-1" />
                  ~{station.estimated_wait_minutes} min wait
                </span>
              )}
            </div>
          </div>
          <div className="text-end">
            <span className={`badge bg-${station.status === 'active' ? 'success' : station.status === 'maintenance' ? 'warning' : 'danger'}`}>
              {station.status}
            </span>
            <div className="mt-2">
              <span className={`badge bg-${availabilityColor}`}>
                <i className="bi bi-battery-full me-1" />
                {station.available_batteries}/{station.total_capacity}
              </span>
            </div>
          </div>
        </div>
        {isSelected && (
          <div className="mt-2 pt-2 border-top">
            <small className="text-muted">
              <i className="bi bi-clock-history me-1" />
              {station.operating_hours}
              {station.phone && (
                <span className="ms-3">
                  <i className="bi bi-telephone me-1" />
                  {station.phone}
                </span>
              )}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

const SwapProgressTracker: React.FC<{
  task: SwapTask;
  onUpdateStatus: (status: SwapTask['status']) => void;
  onCancel: () => void;
  onComplete: (batteryAfter: number) => void;
}> = ({ task, onUpdateStatus, onCancel, onComplete }) => {
  const [batteryAfter, setBatteryAfter] = useState<number>(100);
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  const steps = [
    { status: 'pending', label: 'Requested', icon: 'bi-clock' },
    { status: 'enroute_to_station', label: 'En Route', icon: 'bi-geo-alt' },
    { status: 'arrived_at_station', label: 'Arrived', icon: 'bi-pin-map-fill' },
    { status: 'swapping', label: 'Swapping', icon: 'bi-battery-charging' },
    { status: 'completed', label: 'Complete', icon: 'bi-check-circle-fill' },
  ];

  const currentStepIndex = steps.findIndex(s => s.status === task.status);
  const isCompleted = task.status === 'completed';
  const isCancelled = task.status === 'cancelled';

  const getNextStatus = (): SwapTask['status'] | null => {
    const statusFlow: Record<string, SwapTask['status']> = {
      pending: 'enroute_to_station',
      enroute_to_station: 'arrived_at_station',
      arrived_at_station: 'swapping',
      swapping: 'swap_complete',
    };
    return statusFlow[task.status] || null;
  };

  const handleNext = () => {
    const nextStatus = getNextStatus();
    if (nextStatus === 'swap_complete') {
      setShowCompleteForm(true);
    } else if (nextStatus) {
      onUpdateStatus(nextStatus);
    }
  };

  const handleComplete = () => {
    onComplete(batteryAfter);
    setShowCompleteForm(false);
  };

  if (isCancelled) {
    return (
      <div className="alert alert-danger">
        <i className="bi bi-x-circle me-2" />
        This swap was cancelled.
        {task.cancel_reason && <p className="mb-0 mt-2 small">Reason: {task.cancel_reason}</p>}
      </div>
    );
  }

  return (
    <div className="swap-progress-tracker">
      {/* Progress Steps */}
      <div className="d-flex justify-content-between mb-4 position-relative">
        <div
          className="position-absolute bg-secondary"
          style={{
            height: '2px',
            top: '15px',
            left: '10%',
            right: '10%',
            zIndex: 0
          }}
        />
        <div
          className="position-absolute bg-success"
          style={{
            height: '2px',
            top: '15px',
            left: '10%',
            width: `${Math.min(currentStepIndex / (steps.length - 1) * 80, 80)}%`,
            zIndex: 1,
            transition: 'width 0.3s ease'
          }}
        />
        {steps.map((step, index) => {
          const isActive = index <= currentStepIndex;
          const isCurrent = step.status === task.status || (isCompleted && index === steps.length - 1);
          return (
            <div key={step.status} className="text-center position-relative" style={{ zIndex: 2 }}>
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2 ${
                  isActive ? 'bg-success text-white' : 'bg-light text-muted'
                } ${isCurrent ? 'border border-3 border-success' : ''}`}
                style={{ width: '32px', height: '32px' }}
              >
                <i className={`bi ${step.icon}`} />
              </div>
              <small className={isActive ? 'text-success fw-bold' : 'text-muted'}>
                {step.label}
              </small>
            </div>
          );
        })}
      </div>

      {/* Task Details */}
      <div className="card bg-light mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-6">
              <small className="text-muted d-block">Task ID</small>
              <strong>{task.task_number}</strong>
            </div>
            <div className="col-6">
              <small className="text-muted d-block">Status</small>
              <SwapStatusBadge status={task.status} />
            </div>
            <div className="col-6">
              <small className="text-muted d-block">Battery Before</small>
              <span className={`fw-bold ${(task.battery_level_before || 0) < 30 ? 'text-danger' : 'text-success'}`}>
                <i className="bi bi-battery-half me-1" />
                {task.battery_level_before ?? '--'}%
              </span>
            </div>
            <div className="col-6">
              <small className="text-muted d-block">Battery After</small>
              <span className="fw-bold text-success">
                <i className="bi bi-battery-full me-1" />
                {task.battery_level_after ?? '--'}%
              </span>
            </div>
            {task.station && (
              <div className="col-12">
                <small className="text-muted d-block">Station</small>
                <strong>
                  <i className="bi bi-building me-1" />
                  {task.station.name}
                </strong>
                <br />
                <small className="text-muted">{task.station.address}</small>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Form */}
      {showCompleteForm && (
        <div className="card border-success mb-3">
          <div className="card-header bg-success text-white">
            <i className="bi bi-battery-full me-2" />
            Complete Swap
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">New Battery Level (%)</label>
              <input
                type="number"
                className="form-control"
                min="0"
                max="100"
                value={batteryAfter}
                onChange={(e) => setBatteryAfter(Number(e.target.value))}
              />
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-success flex-grow-1" onClick={handleComplete}>
                <i className="bi bi-check-lg me-1" />
                Confirm Swap Complete
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setShowCompleteForm(false)}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isCompleted && !showCompleteForm && (
        <div className="d-flex gap-2">
          {getNextStatus() && (
            <button className="btn btn-success flex-grow-1" onClick={handleNext}>
              <i className={`bi ${
                task.status === 'pending' ? 'bi-arrow-right' :
                task.status === 'enroute_to_station' ? 'bi-pin-map-fill' :
                task.status === 'arrived_at_station' ? 'bi-battery-charging' :
                'bi-check-lg'
              } me-1`} />
              {task.status === 'pending' && 'Start Journey'}
              {task.status === 'enroute_to_station' && "I've Arrived"}
              {task.status === 'arrived_at_station' && 'Start Swap'}
              {task.status === 'swapping' && 'Complete Swap'}
            </button>
          )}
          <button className="btn btn-outline-danger" onClick={onCancel}>
            <i className="bi bi-x-lg me-1" />
            Cancel
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="alert alert-success mb-0">
          <i className="bi bi-check-circle-fill me-2" />
          Swap completed successfully!
          {task.completed_at && (
            <small className="d-block mt-1">
              Completed at: {new Date(task.completed_at).toLocaleString()}
            </small>
          )}
        </div>
      )}
    </div>
  );
};

const SwapHistoryList: React.FC<{
  tasks: SwapTask[];
  loading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}> = ({ tasks, loading, onLoadMore, hasMore }) => {
  if (loading && tasks.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-4 text-muted">
        <i className="bi bi-inbox display-4 d-block mb-2" />
        No swap history found
      </div>
    );
  }

  return (
    <div className="swap-history-list">
      {tasks.map((task) => (
        <div key={task.id} className="card mb-2">
          <div className="card-body p-3">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h6 className="mb-1">
                  <i className="bi bi-lightning-charge text-warning me-2" />
                  {task.task_number}
                </h6>
                <small className="text-muted">
                  {task.station?.name || 'Unknown Station'}
                </small>
              </div>
              <SwapStatusBadge status={task.status} />
            </div>
            <div className="row mt-2 g-2 small">
              <div className="col-4">
                <span className="text-muted">Before:</span>{' '}
                <span className={task.battery_level_before && task.battery_level_before < 30 ? 'text-danger fw-bold' : ''}>
                  {task.battery_level_before ?? '--'}%
                </span>
              </div>
              <div className="col-4">
                <span className="text-muted">After:</span>{' '}
                <span className="text-success fw-bold">{task.battery_level_after ?? '--'}%</span>
              </div>
              <div className="col-4 text-end">
                <span className="text-muted">
                  {task.completed_at
                    ? new Date(task.completed_at).toLocaleDateString()
                    : new Date(task.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
      {hasMore && (
        <button
          className="btn btn-outline-secondary w-100"
          onClick={onLoadMore}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const BatterySwapSystem: React.FC<BatterySwapSystemProps> = ({
  vehicleId,
  currentBatteryLevel = 50,
  vehicleSoh,
  onSwapComplete,
  onClose,
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('stations');
  const [stations, setStations] = useState<SwapStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<SwapStation | null>(null);
  const [activeTask, setActiveTask] = useState<SwapTask | null>(null);
  const [historyTasks, setHistoryTasks] = useState<SwapTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [notes, setNotes] = useState('');

  // Fetch active task on mount
  const fetchActiveTask = useCallback(async () => {
    try {
      const response = await SwapAPI.getActiveSwapTask();
      if (response.has_active_task && response.task) {
        setActiveTask(response.task);
        setViewMode('active');
      } else {
        setActiveTask(null);
      }
    } catch (err) {
      console.error('Failed to fetch active task:', err);
    }
  }, []);

  // Fetch nearby stations
  const fetchStations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to get user's location
      let latitude: number | undefined;
      let longitude: number | undefined;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch {
          // Location not available, use default
          console.log('Location not available, showing all stations');
        }
      }

      const response = await SwapAPI.getNearbyStations({ latitude, longitude, radius_km: 50, limit: 20 });
      setStations(response.stations);
    } catch (err: any) {
      setError(err.message || 'Failed to load stations');
      // Fallback to all stations
      try {
        const allStations = await SwapAPI.getStations();
        setStations(allStations.stations);
      } catch {
        setStations([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch swap history
  const fetchHistory = useCallback(async (page: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const response = await SwapAPI.getSwapHistory({ page, per_page: 10 });
      if (append) {
        setHistoryTasks(prev => [...prev, ...response.tasks]);
      } else {
        setHistoryTasks(response.tasks);
      }
      setHasMoreHistory(response.current_page < response.last_page);
      setHistoryPage(response.current_page);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchActiveTask();
    fetchStations();
  }, [fetchActiveTask, fetchStations]);

  // Load history when switching to history view
  useEffect(() => {
    if (viewMode === 'history' && historyTasks.length === 0) {
      fetchHistory();
    }
  }, [viewMode, historyTasks.length, fetchHistory]);

  // Handle swap request
  const handleRequestSwap = async () => {
    if (!selectedStation) {
      setError('Please select a station');
      return;
    }

    setRequesting(true);
    setError(null);

    try {
      const response = await SwapAPI.requestSwap({
        station_id: selectedStation.id,
        vehicle_id: vehicleId,
        battery_level_before: currentBatteryLevel,
        notes: notes || undefined,
      });

      setActiveTask(response.task);
      setViewMode('active');
      setSelectedStation(null);
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to request swap');
    } finally {
      setRequesting(false);
    }
  };

  // Handle status update
  const handleUpdateStatus = async (status: SwapTask['status']) => {
    if (!activeTask) return;

    try {
      const response = await SwapAPI.updateSwapTaskStatus(activeTask.id, status);
      setActiveTask(response.task);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!activeTask) return;

    if (!window.confirm('Are you sure you want to cancel this swap?')) return;

    try {
      const response = await SwapAPI.cancelSwapTask(activeTask.id, 'Cancelled by driver');
      setActiveTask(response.task);
      setTimeout(() => {
        setActiveTask(null);
        setViewMode('stations');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel swap');
    }
  };

  // Handle complete
  const handleComplete = async (batteryAfter: number) => {
    if (!activeTask) return;

    try {
      const response = await SwapAPI.completeSwapTask(activeTask.id, {
        battery_level_after: batteryAfter,
        soh_after: vehicleSoh,
      });
      setActiveTask(response.task);
      onSwapComplete?.(response.task);
    } catch (err: any) {
      setError(err.message || 'Failed to complete swap');
    }
  };

  // Load more history
  const handleLoadMoreHistory = () => {
    fetchHistory(historyPage + 1, true);
  };

  return (
    <div className="battery-swap-system">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="bi bi-battery-charging text-success me-2" />
          Battery Swap
        </h5>
        {onClose && (
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        )}
      </div>

      {/* Current Battery Level */}
      <div className="alert alert-light mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-battery-half me-2" />
            Current Battery
          </span>
          <span className={`fw-bold ${currentBatteryLevel < 30 ? 'text-danger' : currentBatteryLevel < 50 ? 'text-warning' : 'text-success'}`}>
            {currentBatteryLevel}%
          </span>
        </div>
        <div className="progress mt-2" style={{ height: '8px' }}>
          <div
            className={`progress-bar ${currentBatteryLevel < 30 ? 'bg-danger' : currentBatteryLevel < 50 ? 'bg-warning' : 'bg-success'}`}
            style={{ width: `${currentBatteryLevel}%` }}
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills nav-fill mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${viewMode === 'stations' ? 'active' : ''}`}
            onClick={() => setViewMode('stations')}
            disabled={!!activeTask && activeTask.status !== 'completed' && activeTask.status !== 'cancelled'}
          >
            <i className="bi bi-geo-alt me-1" />
            Stations
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${viewMode === 'active' ? 'active' : ''}`}
            onClick={() => setViewMode('active')}
            disabled={!activeTask}
          >
            <i className="bi bi-lightning-charge me-1" />
            Active
            {activeTask && activeTask.status !== 'completed' && activeTask.status !== 'cancelled' && (
              <span className="badge bg-danger ms-1">1</span>
            )}
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${viewMode === 'history' ? 'active' : ''}`}
            onClick={() => setViewMode('history')}
          >
            <i className="bi bi-clock-history me-1" />
            History
          </button>
        </li>
      </ul>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} />
        </div>
      )}

      {/* Content */}
      <div className="swap-content" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {/* Stations View */}
        {viewMode === 'stations' && (
          <>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading stations...</span>
                </div>
              </div>
            ) : stations.length === 0 ? (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-geo-alt-fill display-4 d-block mb-2" />
                No swap stations found nearby
                <button className="btn btn-link" onClick={fetchStations}>
                  Refresh
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  {stations.map((station) => (
                    <StationCard
                      key={station.id}
                      station={station}
                      onSelect={setSelectedStation}
                      isSelected={selectedStation?.id === station.id}
                    />
                  ))}
                </div>

                {/* Request Swap Form */}
                {selectedStation && (
                  <div className="card border-success sticky-bottom bg-white">
                    <div className="card-body">
                      <h6 className="card-title text-success">
                        <i className="bi bi-check-circle me-2" />
                        Selected: {selectedStation.name}
                      </h6>
                      <div className="mb-3">
                        <label className="form-label small">Notes (optional)</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Any special instructions..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                      <button
                        className="btn btn-success w-100"
                        onClick={handleRequestSwap}
                        disabled={requesting}
                      >
                        {requesting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-lightning-charge me-2" />
                            Request Battery Swap
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Active Task View */}
        {viewMode === 'active' && (
          <>
            {activeTask ? (
              <SwapProgressTracker
                task={activeTask}
                onUpdateStatus={handleUpdateStatus}
                onCancel={handleCancel}
                onComplete={handleComplete}
              />
            ) : (
              <div className="text-center py-4 text-muted">
                <i className="bi bi-battery-half display-4 d-block mb-2" />
                No active swap task
                <button className="btn btn-link" onClick={() => setViewMode('stations')}>
                  Find a station
                </button>
              </div>
            )}
          </>
        )}

        {/* History View */}
        {viewMode === 'history' && (
          <SwapHistoryList
            tasks={historyTasks}
            loading={loading}
            onLoadMore={handleLoadMoreHistory}
            hasMore={hasMoreHistory}
          />
        )}
      </div>
    </div>
  );
};

export default BatterySwapSystem;

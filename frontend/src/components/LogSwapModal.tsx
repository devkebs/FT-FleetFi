import React, { useState } from 'react';
import { DriverAPI } from '../services/api';

interface LogSwapModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetId: string;
}

const LogSwapModal: React.FC<LogSwapModalProps> = ({ show, onClose, onSuccess, assetId }) => {
  const [stationLocation, setStationLocation] = useState('');
  const [batteryBefore, setBatteryBefore] = useState<number>(20);
  const [batteryAfter, setBatteryAfter] = useState<number>(100);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!stationLocation.trim()) {
      setError('Please enter swap station location');
      return;
    }

    if (batteryBefore >= batteryAfter) {
      setError('Battery after swap must be higher than before');
      return;
    }

    try {
      setLoading(true);
      await DriverAPI.logSwap({
        asset_id: assetId,
        station_location: stationLocation,
        battery_before: batteryBefore,
        battery_after: batteryAfter,
        notes: notes || undefined
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log swap');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-battery-charging me-2 text-success"></i>
                Log Battery Swap
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold">Vehicle ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={assetId}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Swap Station Location <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Victoria Island Station, Lekki Phase 1"
                    value={stationLocation}
                    onChange={(e) => setStationLocation(e.target.value)}
                    required
                  />
                  <small className="text-muted">Enter the name or location of the swap station</small>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Battery Before (%) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="100"
                      value={batteryBefore}
                      onChange={(e) => setBatteryBefore(parseInt(e.target.value))}
                      required
                    />
                    <div className="progress mt-2" style={{ height: '8px' }}>
                      <div
                        className={`progress-bar ${batteryBefore < 30 ? 'bg-danger' : 'bg-warning'}`}
                        style={{ width: `${batteryBefore}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Battery After (%) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="100"
                      value={batteryAfter}
                      onChange={(e) => setBatteryAfter(parseInt(e.target.value))}
                      required
                    />
                    <div className="progress mt-2" style={{ height: '8px' }}>
                      <div
                        className="progress-bar bg-success"
                        style={{ width: `${batteryAfter}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Any additional notes about the swap..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                  ></textarea>
                  <small className="text-muted">{notes.length}/500 characters</small>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Logging...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-1"></i>
                      Log Swap
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogSwapModal;

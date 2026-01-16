import React, { useState } from 'react';
import { DriverAPI } from '../services/api';

interface ReportMaintenanceModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetId: string;
}

const ReportMaintenanceModal: React.FC<ReportMaintenanceModalProps> = ({
  show,
  onClose,
  onSuccess,
  assetId
}) => {
  const [issueType, setIssueType] = useState<'mechanical' | 'electrical' | 'battery' | 'body' | 'other'>('mechanical');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!description.trim()) {
      setError('Please provide a detailed description of the issue');
      return;
    }

    try {
      setLoading(true);
      await DriverAPI.reportMaintenance({
        asset_id: assetId,
        issue_type: issueType,
        severity: severity,
        description: description,
        photo_url: photoUrl || undefined
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to report maintenance issue');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-tools me-2 text-warning"></i>
                Report Maintenance Issue
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

                {severity === 'critical' && (
                  <div className="alert alert-warning d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>
                      <strong>Critical Issue Notice:</strong> Reporting a critical issue will immediately set your vehicle to maintenance mode and make it temporarily unavailable.
                    </div>
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

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Issue Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value as any)}
                      required
                    >
                      <option value="mechanical">Mechanical</option>
                      <option value="electrical">Electrical</option>
                      <option value="battery">Battery</option>
                      <option value="body">Body/Exterior</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Severity <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as any)}
                      required
                    >
                      <option value="low">Low - Minor issue, can wait</option>
                      <option value="medium">Medium - Should be fixed soon</option>
                      <option value="high">High - Needs attention</option>
                      <option value="critical">Critical - Unsafe to drive</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Detailed Description <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={5}
                    placeholder="Describe the issue in detail. Include when it started, what happened, and any unusual sounds or behaviors..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                    required
                  ></textarea>
                  <small className="text-muted">{description.length}/1000 characters</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Photo URL (Optional)</label>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://example.com/photo.jpg"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                  <small className="text-muted">If you have a photo of the issue, paste the URL here</small>
                </div>

                {/* Severity indicator */}
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="fw-semibold mb-2">Issue Summary</h6>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span className="badge bg-secondary me-2">{issueType}</span>
                        <span
                          className={`badge ${
                            severity === 'critical'
                              ? 'bg-danger'
                              : severity === 'high'
                              ? 'bg-warning'
                              : severity === 'medium'
                              ? 'bg-info'
                              : 'bg-secondary'
                          }`}
                        >
                          {severity}
                        </span>
                      </div>
                      <small className="text-muted">{description.length > 0 ? '✓ Description provided' : 'No description'}</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-1"></i>
                      Submit Report
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

export default ReportMaintenanceModal;

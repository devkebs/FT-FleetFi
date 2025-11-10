import React, { useState, useEffect } from 'react';
import { submitKyc, pollKyc, KycSubmitData } from '../services/kyc';

interface KycModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const KycModal: React.FC<KycModalProps> = ({ show, onClose, onSuccess }) => {
  const [documentType, setDocumentType] = useState<'nin' | 'bvn' | 'drivers_license' | 'passport'>('nin');
  const [documentNumber, setDocumentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [providerStatus, setProviderStatus] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (providerStatus && providerStatus !== 'verified' && providerStatus !== 'failed') {
      setPolling(true);
      interval = setInterval(async () => {
        try {
          const resp = await pollKyc();
          setProviderStatus(resp.provider_status);
          if (resp.provider_status === 'verified' || resp.provider_status === 'failed') {
            clearInterval(interval);
            setPolling(false);
            window.dispatchEvent(new CustomEvent('app:toast', {
              detail: { type: resp.provider_status === 'verified' ? 'success' : 'danger', title: 'KYC Update', message: `Provider status: ${resp.provider_status}` }
            }));
          }
        } catch (err: any) {
          setPollError(err.message || 'Poll failed');
        }
      }, 15000); // poll every 15s
    }
    return () => interval && clearInterval(interval);
  }, [providerStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const data: KycSubmitData = {
        document_type: documentType,
        document_number: documentNumber,
        full_name: fullName || undefined,
        address: address || undefined,
      };
      const resp = await submitKyc(data);
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'info', title: 'KYC Initiated', message: 'Verification started with IdentityPass. Monitoring status…' }
      }));
      setProviderStatus(resp.provider_status || 'in_progress');
      onSuccess();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Submission failed', message: (err as any).message || 'Unable to submit KYC' }
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-shield-check me-2"></i>Complete KYC Verification
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>KYC Required:</strong> To invest in tokenized assets and receive payouts, please complete your identity verification.
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Document Type / Identifier</label>
                <select
                  className="form-select"
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value as any)}
                  required
                >
                  <option value="nin">National Identification Number (NIN)</option>
                  <option value="bvn">Bank Verification Number (BVN)</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="passport">Passport</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Document Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={documentNumber}
                  onChange={e => setDocumentNumber(e.target.value)}
                  placeholder="Enter your document number"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Full Name (as on document)</label>
                <input
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Optional: Full legal name"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Residential Address</label>
                <textarea
                  className="form-control"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Optional: Your current address"
                />
              </div>

              <div className="alert alert-warning mb-2">
                <small>
                  <i className="bi bi-shield-lock me-2"></i>
                  Your identifier is sent securely to IdentityPass. We do not store raw personal data beyond the reference.
                </small>
              </div>
              {providerStatus && (
                <div className="alert alert-secondary mb-0">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-clock-history me-2"></i>
                    <strong>Status:</strong>&nbsp;{providerStatus}
                    {polling && providerStatus !== 'verified' && providerStatus !== 'failed' && (
                      <span className="ms-2 spinner-border spinner-border-sm"></span>
                    )}
                  </div>
                  {pollError && <div className="text-danger small mt-1">Poll error: {pollError}</div>}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Skip for Now
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <i className="bi bi-check-circle me-2"></i>
                {submitting ? 'Submitting...' : providerStatus ? 'Re-Init / Retry' : 'Start Verification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

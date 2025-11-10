import React, { useEffect, useState } from 'react';
import { fetchCapabilities, CapabilitiesPayload } from '../services/api';

export const RoleCapabilities: React.FC = () => {
  const [caps, setCaps] = useState<CapabilitiesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCapabilities();
        setCaps(data);
      } catch (e: any) {
        console.error('Failed to load capabilities:', e);
        setError(e.message || 'Failed to load capabilities');
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="alert alert-warning border-0 shadow-sm mb-4">
        <i className="bi bi-exclamation-triangle me-2"></i>
        <small>Unable to load role capabilities. {error}</small>
      </div>
    );
  }

  if (!caps) {
    return (
      <div className="text-muted small">
        <i className="bi bi-arrow-repeat me-1"></i>Loading capabilities...
      </div>
    );
  }

  const items = Object.entries(caps.capabilities);

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center">
        <h6 className="mb-0"><i className="bi bi-person-badge me-2 text-primary"></i>Role Capabilities</h6>
        <span className="badge bg-primary text-uppercase">{caps.role}</span>
      </div>
      <div className="card-body">
        {items.length === 0 ? (
          <div className="text-muted small">No capabilities found for this role.</div>
        ) : (
          <div className="row g-2">
            {items.map(([key, allowed]) => (
              <div className="col-6 col-md-4 col-lg-3" key={key}>
                <div className={`d-flex align-items-center p-2 rounded border ${allowed ? 'border-success bg-light' : 'border-0 bg-transparent'}`}>
                  <i className={`me-2 ${allowed ? 'bi bi-check-circle text-success' : 'bi bi-dash-circle text-muted'}`}></i>
                  <span className={`small ${allowed ? '' : 'text-muted'}`}>{key}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { getStoredToken } from '../services/api';

interface PerformanceMetrics {
  total_investment: number;
  current_value: number;
  total_returns: number;
  roi_percent: number;
  best_performing_asset?: {
    asset_id: number;
    asset_model: string;
    roi_percent: number;
  };
  worst_performing_asset?: {
    asset_id: number;
    asset_model: string;
    roi_percent: number;
  };
  monthly_returns?: Array<{
    month: string;
    returns: number;
  }>;
}

export const PortfolioPerformance: React.FC = () => {
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      if (!token) {
        // No token - silently set empty state
        setPerformance(null);
        setError(null);
        setLoading(false);
        return;
      }
      const response = await fetch('http://localhost:8000/api/portfolio/performance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      
      if (response.status === 401) {
        // Auth error - user session expired, show friendly message
        setPerformance(null);
        setError('Session expired. Please login again.');
        return;
      }
      
      if (!response.ok) {
        // Other errors - show error message but don't crash
        setPerformance(null);
        setError('Unable to load performance data');
        return;
      }
      
      const data = await response.json();
      setPerformance(data);
      setError(null);
    } catch (err: any) {
      // Handle all errors gracefully without crashing
      setError('Unable to load performance data');
      setPerformance(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body text-center py-4">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted small mt-2">Loading performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning border-0 shadow-sm mb-0">
        <i className="bi bi-exclamation-triangle me-2"></i>
        <small>Unable to load performance data. {error}</small>
      </div>
    );
  }

  if (!performance) {
    return null;
  }

  // Add default values to prevent undefined errors
  const totalInvestment = performance.total_investment ?? 0;
  const currentValue = performance.current_value ?? 0;
  const profitLoss = currentValue - totalInvestment;
  const isProfitable = profitLoss >= 0;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
            Portfolio Performance
          </h5>
          <button className="btn btn-sm btn-outline-primary" onClick={fetchPerformance}>
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>
      <div className="card-body">
        {/* Overall Performance Metrics */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="p-3 bg-light rounded">
              <small className="text-muted d-block mb-1">Total Investment</small>
              <h6 className="mb-0 fw-bold">₦{totalInvestment.toLocaleString()}</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-light rounded">
              <small className="text-muted d-block mb-1">Current Value</small>
              <h6 className="mb-0 fw-bold">₦{currentValue.toLocaleString()}</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className={`p-3 rounded ${isProfitable ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
              <small className="text-muted d-block mb-1">Profit/Loss</small>
              <h6 className={`mb-0 fw-bold ${isProfitable ? 'text-success' : 'text-danger'}`}>
                {isProfitable ? '+' : ''}₦{profitLoss.toLocaleString()}
              </h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className={`p-3 rounded ${isProfitable ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
              <small className="text-muted d-block mb-1">ROI</small>
              <h6 className={`mb-0 fw-bold ${isProfitable ? 'text-success' : 'text-danger'}`}>
                {isProfitable ? '+' : ''}{(performance.roi_percent ?? 0).toFixed(2)}%
              </h6>
            </div>
          </div>
        </div>

        {/* Best & Worst Performers */}
        {(performance.best_performing_asset || performance.worst_performing_asset) && (
          <div className="row g-3 mb-4">
            {performance.best_performing_asset && (
              <div className="col-md-6">
                <div className="border border-success rounded p-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-trophy-fill text-success fs-4 me-2"></i>
                    <div>
                      <small className="text-muted d-block">Best Performer</small>
                      <strong>{performance.best_performing_asset.asset_model}</strong>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Asset ID: {performance.best_performing_asset.asset_id}</small>
                    <span className="badge bg-success">
                      +{performance.best_performing_asset.roi_percent.toFixed(2)}% ROI
                    </span>
                  </div>
                </div>
              </div>
            )}
            {performance.worst_performing_asset && (
              <div className="col-md-6">
                <div className="border border-warning rounded p-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-4 me-2"></i>
                    <div>
                      <small className="text-muted d-block">Needs Attention</small>
                      <strong>{performance.worst_performing_asset.asset_model}</strong>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">Asset ID: {performance.worst_performing_asset.asset_id}</small>
                    <span className="badge bg-warning">
                      {performance.worst_performing_asset.roi_percent.toFixed(2)}% ROI
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Monthly Returns Timeline */}
        {performance.monthly_returns && performance.monthly_returns.length > 0 && (
          <div>
            <h6 className="mb-3">
              <i className="bi bi-calendar3 me-2"></i>
              Monthly Returns
            </h6>
            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Returns</th>
                    <th className="text-end">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.monthly_returns.map((month) => {
                    const isPositive = month.returns >= 0;
                    return (
                      <tr key={month.month}>
                        <td className="fw-bold">{month.month}</td>
                        <td className={`text-end ${isPositive ? 'text-success' : 'text-danger'}`}>
                          {isPositive ? '+' : ''}₦{month.returns.toLocaleString()}
                        </td>
                        <td className="text-end">
                          {isPositive ? (
                            <i className="bi bi-arrow-up-right text-success"></i>
                          ) : (
                            <i className="bi bi-arrow-down-right text-danger"></i>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Total Returns Summary */}
        <div className="mt-3 p-3 bg-light rounded">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted d-block">Total Returns Received</small>
              <strong>₦{performance.total_returns.toLocaleString()}</strong>
            </div>
            <i className="bi bi-cash-stack fs-3 text-success"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

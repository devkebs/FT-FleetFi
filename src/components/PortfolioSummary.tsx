import React, { useEffect, useState } from 'react';
import { InvestmentAPI, PortfolioSummary as PortfolioSummaryType, InvestmentRecord } from '../services/api';

export const PortfolioSummary: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioSummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InvestmentAPI.getPortfolio();
      setPortfolio(data);
    } catch (err: any) {
      if (err?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err?.message || 'Failed to fetch portfolio');
      }
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning border-0 shadow-sm">
        <i className="bi bi-exclamation-triangle me-2"></i>
        <small>Unable to load portfolio data. {error}</small>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="alert alert-info border-0 shadow-sm">
        <i className="bi bi-info-circle me-2"></i>
        <small>No portfolio data available yet.</small>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      vehicle: 'E-Keke',
      battery: 'Battery',
      charging_cabinet: 'Cabinet',
    };
    return labels[type] || type;
  };

  const getAssetTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      vehicle: 'bi-truck',
      battery: 'bi-battery-charging',
      charging_cabinet: 'bi-lightning-charge',
    };
    return icons[type] || 'bi-box';
  };

  return (
    <div>
      {/* Overall Metrics */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0"><i className="bi bi-bar-chart-line me-2"></i>Portfolio Summary</h5>
            <button className="btn btn-sm btn-light" onClick={fetchPortfolio}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="text-muted small">Active Investments</span>
                <span className="fs-4 fw-bold text-primary">{portfolio.active_investments || 0}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="text-muted small">Total Invested</span>
                <span className="fs-4 fw-bold text-success">{formatCurrency(portfolio.total_invested || 0)}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="text-muted small">Current Value</span>
                <span className="fs-4 fw-bold text-info">{formatCurrency(portfolio.current_value || 0)}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="text-muted small">Total Earnings</span>
                <span className="fs-4 fw-bold text-warning">{formatCurrency(portfolio.total_earnings || 0)}</span>
                <span className={`badge ${(portfolio.total_roi_percent || 0) >= 0 ? 'bg-success' : 'bg-danger'} mt-1`} style={{ width: 'fit-content' }}>
                  ROI: {(portfolio.total_roi_percent || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Details Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0"><i className="bi bi-list-ul me-2 text-success"></i>Investment Details</h5>
        </div>
        <div className="card-body">
          {!portfolio.investments || portfolio.investments.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-inbox display-4 text-muted"></i>
              <p className="text-muted mt-3">No investments in portfolio yet</p>
              <p className="small text-muted">Browse available assets to start investing</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Ownership</th>
                    <th>Invested</th>
                    <th>Current Value</th>
                    <th>Earnings</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.investments.map((investment: InvestmentRecord) => {
                    const asset = investment.asset;
                    const roi = investment.purchase_price > 0
                      ? ((investment.current_value - investment.purchase_price) / investment.purchase_price * 100)
                      : 0;

                    return (
                      <tr key={investment.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <i className={`bi ${getAssetTypeIcon(asset?.type || '')} fs-4 text-primary me-2`}></i>
                            <div>
                              <div className="fw-bold">{asset?.model || 'Unknown Asset'}</div>
                              <small className="text-muted">{asset?.asset_id || `ID: ${investment.asset_id}`}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {getAssetTypeLabel(asset?.type || '')}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-primary fs-6">
                            {investment.ownership_percentage}%
                          </span>
                        </td>
                        <td className="text-success fw-bold">
                          {formatCurrency(investment.amount)}
                        </td>
                        <td>
                          <div>{formatCurrency(investment.current_value)}</div>
                          <small className={roi >= 0 ? 'text-success' : 'text-danger'}>
                            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                          </small>
                        </td>
                        <td className="text-warning fw-bold">
                          {formatCurrency(investment.total_earnings)}
                        </td>
                        <td>
                          <span className={`badge ${
                            investment.status === 'active' ? 'bg-success' :
                            investment.status === 'pending' ? 'bg-warning text-dark' :
                            investment.status === 'sold' ? 'bg-secondary' : 'bg-danger'
                          }`}>
                            {investment.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

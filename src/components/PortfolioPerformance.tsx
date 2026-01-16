import React, { useEffect, useState, memo } from 'react';
import { InvestmentAPI, PortfolioPerformance as PortfolioPerformanceType } from '../services/api';

const PortfolioPerformanceComponent: React.FC = () => {
  const [performance, setPerformance] = useState<PortfolioPerformanceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await InvestmentAPI.getPerformance();
      setPerformance(data);
    } catch (err: any) {
      if (err?.status === 401) {
        setError('Session expired. Please login again.');
      } else {
        setError(err?.message || 'Unable to load performance data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0">
            <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
            Portfolio Performance
          </h5>
        </div>
        <div className="card-body">
          <div className="alert alert-warning border-0 mb-0">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <small>{error}</small>
          </div>
        </div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0">
            <i className="bi bi-graph-up-arrow me-2 text-primary"></i>
            Portfolio Performance
          </h5>
        </div>
        <div className="card-body text-center py-4">
          <p className="text-muted mb-0">No performance data available yet</p>
        </div>
      </div>
    );
  }

  const totalInvestment = performance.total_invested ?? 0;
  const currentValue = performance.current_value ?? 0;
  const profitLoss = performance.unrealized_gains ?? (currentValue - totalInvestment);
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
              <h6 className="mb-0 fw-bold">{formatCurrency(totalInvestment)}</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-light rounded">
              <small className="text-muted d-block mb-1">Current Value</small>
              <h6 className="mb-0 fw-bold">{formatCurrency(currentValue)}</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className={`p-3 rounded ${isProfitable ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
              <small className="text-muted d-block mb-1">Unrealized Gains</small>
              <h6 className={`mb-0 fw-bold ${isProfitable ? 'text-success' : 'text-danger'}`}>
                {isProfitable ? '+' : ''}{formatCurrency(profitLoss)}
              </h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className={`p-3 rounded ${isProfitable ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
              <small className="text-muted d-block mb-1">Overall ROI</small>
              <h6 className={`mb-0 fw-bold ${isProfitable ? 'text-success' : 'text-danger'}`}>
                {isProfitable ? '+' : ''}{(performance.overall_roi ?? 0).toFixed(2)}%
              </h6>
            </div>
          </div>
        </div>

        {/* Investment Breakdown by Asset Type */}
        {performance.investment_breakdown && (
          <div className="row g-3 mb-4">
            <div className="col-12">
              <h6 className="mb-3">
                <i className="bi bi-pie-chart me-2"></i>
                Investment Breakdown
              </h6>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <i className="bi bi-truck fs-3 text-primary"></i>
                <div className="mt-2">
                  <small className="text-muted d-block">E-Kekes</small>
                  <strong>{formatCurrency(performance.investment_breakdown.vehicles || 0)}</strong>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <i className="bi bi-battery-charging fs-3 text-success"></i>
                <div className="mt-2">
                  <small className="text-muted d-block">Batteries</small>
                  <strong>{formatCurrency(performance.investment_breakdown.batteries || 0)}</strong>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="border rounded p-3 text-center">
                <i className="bi bi-lightning-charge fs-3 text-warning"></i>
                <div className="mt-2">
                  <small className="text-muted d-block">Cabinets</small>
                  <strong>{formatCurrency(performance.investment_breakdown.cabinets || 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Best & Worst Performers */}
        {(performance.best_performer || performance.worst_performer) && (
          <div className="row g-3 mb-4">
            {performance.best_performer && (
              <div className="col-md-6">
                <div className="border border-success rounded p-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-trophy-fill text-success fs-4 me-2"></i>
                    <div>
                      <small className="text-muted d-block">Best Performer</small>
                      <strong>{performance.best_performer.asset_id}</strong>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <span className="badge bg-success">
                      +{performance.best_performer.roi.toFixed(2)}% ROI
                    </span>
                  </div>
                </div>
              </div>
            )}
            {performance.worst_performer && (
              <div className="col-md-6">
                <div className="border border-warning rounded p-3">
                  <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-exclamation-triangle-fill text-warning fs-4 me-2"></i>
                    <div>
                      <small className="text-muted d-block">Needs Attention</small>
                      <strong>{performance.worst_performer.asset_id}</strong>
                    </div>
                  </div>
                  <div className="d-flex justify-content-end">
                    <span className="badge bg-warning text-dark">
                      {performance.worst_performer.roi.toFixed(2)}% ROI
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Monthly Earnings Timeline */}
        {performance.monthly_earnings && performance.monthly_earnings.length > 0 && (
          <div>
            <h6 className="mb-3">
              <i className="bi bi-calendar3 me-2"></i>
              Monthly Earnings
            </h6>
            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Earnings</th>
                    <th className="text-end">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.monthly_earnings.map((month) => {
                    const isPositive = month.earnings >= 0;
                    return (
                      <tr key={month.month}>
                        <td className="fw-bold">{month.month}</td>
                        <td className={`text-end ${isPositive ? 'text-success' : 'text-danger'}`}>
                          {isPositive ? '+' : ''}{formatCurrency(month.earnings)}
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

        {/* Total Earnings Summary */}
        <div className="mt-3 p-3 bg-light rounded">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <small className="text-muted d-block">Total Earnings Received</small>
              <strong>{formatCurrency(performance.total_earnings || 0)}</strong>
            </div>
            <i className="bi bi-cash-stack fs-3 text-success"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PortfolioPerformance = memo(PortfolioPerformanceComponent);

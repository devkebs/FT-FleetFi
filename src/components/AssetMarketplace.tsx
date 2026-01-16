import React, { useState, useEffect } from 'react';
import { InvestmentAPI, InvestableAsset } from '../services/api';
import { InvestmentModal } from './InvestmentModal';

interface AssetMarketplaceProps {
  onInvestmentComplete?: () => void;
}

export const AssetMarketplace: React.FC<AssetMarketplaceProps> = ({ onInvestmentComplete }) => {
  const [assets, setAssets] = useState<InvestableAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<InvestableAsset | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    risk_level: '',
  });

  useEffect(() => {
    loadAssets();
  }, [filters]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await InvestmentAPI.getAvailableAssets(filters);
      setAssets(response.assets || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load assets');
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

  const getRiskBadgeClass = (risk: string) => {
    const classes: Record<string, string> = {
      low: 'bg-success',
      medium: 'bg-warning text-dark',
      high: 'bg-danger',
    };
    return classes[risk] || 'bg-secondary';
  };

  const handleInvestSuccess = () => {
    loadAssets();
    onInvestmentComplete?.();
  };

  if (loading && assets.length === 0) {
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading investment opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-shop me-2"></i>
              Asset Marketplace
            </h5>
            <button className="btn btn-sm btn-light" onClick={loadAssets}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Filters */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label small text-muted">Asset Type</label>
              <select
                className="form-select"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="vehicle">E-Kekes</option>
                <option value="battery">Batteries</option>
                <option value="charging_cabinet">Charging Cabinets</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small text-muted">Risk Level</label>
              <select
                className="form-select"
                value={filters.risk_level}
                onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
              >
                <option value="">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setFilters({ type: '', risk_level: '' })}
              >
                <i className="bi bi-x-circle me-2"></i>
                Clear Filters
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger border-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Asset Grid */}
          {assets.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox display-1 text-muted"></i>
              <p className="text-muted mt-3">No assets available for investment</p>
              <p className="small text-muted">Check back later or adjust your filters</p>
            </div>
          ) : (
            <div className="row g-4">
              {assets.map((asset) => (
                <div className="col-md-6 col-lg-4" key={asset.id}>
                  <div className="card h-100 border hover-shadow" style={{ transition: 'box-shadow 0.2s' }}>
                    <div className="card-header bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="badge bg-secondary">
                          <i className={`bi ${getAssetTypeIcon(asset.type)} me-1`}></i>
                          {getAssetTypeLabel(asset.type)}
                        </span>
                        <span className={`badge ${getRiskBadgeClass(asset.risk_level || 'medium')}`}>
                          {(asset.risk_level || 'medium').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <h5 className="card-title fw-bold">{asset.model}</h5>
                      <p className="card-text small text-muted mb-3">
                        <i className="bi bi-geo-alt me-1"></i>
                        {asset.location}
                      </p>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="text-muted">Health (SOH)</span>
                          <span className="fw-bold text-success">{asset.soh}%</span>
                        </div>
                        <div className="progress" style={{ height: '6px' }}>
                          <div
                            className={`progress-bar ${asset.soh >= 90 ? 'bg-success' : asset.soh >= 70 ? 'bg-warning' : 'bg-danger'}`}
                            style={{ width: `${asset.soh}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <div className="bg-light rounded p-2 text-center">
                            <small className="text-muted d-block">Value</small>
                            <strong className="small">{formatCurrency(asset.current_value)}</strong>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="bg-light rounded p-2 text-center">
                            <small className="text-muted d-block">Expected ROI</small>
                            <strong className="small text-success">{asset.expected_roi}%</strong>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between small mb-1">
                          <span className="text-muted">Ownership Available</span>
                          <span className="fw-bold">{Number(asset.ownership_remaining || 0).toFixed(1)}%</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: `${Number(asset.total_ownership_sold || 0)}%` }}
                          ></div>
                        </div>
                        <small className="text-muted">{Number(asset.total_ownership_sold || 0).toFixed(1)}% sold</small>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                        <div>
                          <small className="text-muted d-block">Min. Investment</small>
                          <strong className="text-primary">{formatCurrency(asset.min_investment)}</strong>
                        </div>
                        <button
                          className="btn btn-success"
                          onClick={() => setSelectedAsset(asset)}
                          disabled={!asset.is_available_for_investment}
                        >
                          <i className="bi bi-cart-plus me-1"></i>
                          Invest
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Investment Modal */}
      {selectedAsset && (
        <InvestmentModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onSuccess={handleInvestSuccess}
        />
      )}
    </div>
  );
};

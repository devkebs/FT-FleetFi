import React, { useState } from 'react';
import { Asset } from '../services/api';
import InvestmentModal from './InvestmentModal';

interface AvailableAssetsSectionProps {
  assets: Asset[];
  hasWallet: boolean;
  kycVerified: boolean;
  onInvestmentSuccess: () => void;
}

export const AvailableAssetsSection: React.FC<AvailableAssetsSectionProps> = ({
  assets,
  hasWallet,
  kycVerified,
  onInvestmentSuccess
}) => {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [sortBy, setSortBy] = useState<'soh' | 'value' | 'swaps'>('soh');

  const handleInvestClick = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowInvestmentModal(true);
  };

  const handleInvestmentSuccess = () => {
    setShowInvestmentModal(false);
    setSelectedAsset(null);
    onInvestmentSuccess();
  };

  // Filter available assets (can add more sophisticated filtering)
  const availableAssets = assets.filter(asset => asset.status === 'Available');

  // Sort assets
  const sortedAssets = [...availableAssets].sort((a, b) => {
    switch (sortBy) {
      case 'soh':
        return b.soh - a.soh;
      case 'value':
        return b.current_value - a.current_value;
      case 'swaps':
        return b.swaps - a.swaps;
      default:
        return 0;
    }
  });

  const investmentDisabled = !kycVerified;

  return (
    <>
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0 fw-bold">
                <i className="bi bi-cart-plus me-2 text-success"></i>
                Available for Investment
              </h5>
              <small className="text-muted">{availableAssets.length} assets available</small>
            </div>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="soh">Sort by Health</option>
              <option value="value">Sort by Value</option>
              <option value="swaps">Sort by Activity</option>
            </select>
          </div>
        </div>
        <div className="card-body">
          {investmentDisabled && (
            <div className="alert alert-warning border-0 mb-4">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>KYC Verification Required</strong>
              <p className="mb-0 mt-1">
                Complete your KYC verification to start investing in tokenized assets.
              </p>
            </div>
          )}

          {sortedAssets.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
              <p className="text-muted mt-3 mb-0">No assets currently available for investment</p>
              <small className="text-muted">Check back soon for new opportunities</small>
            </div>
          ) : (
            <div className="row g-3">
              {sortedAssets.slice(0, 6).map(asset => (
                <div className="col-md-4" key={asset.id}>
                  <div className="card h-100 border hover-shadow">
                    <div className="card-body">
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <span className="badge bg-secondary mb-1">{asset.type}</span>
                          <h6 className="fw-bold mb-0">{asset.asset_id}</h6>
                          <small className="text-muted">{asset.model}</small>
                        </div>
                        <span className="badge bg-success">
                          {asset.status}
                        </span>
                      </div>

                      {/* Metrics */}
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <small className="text-muted d-block">Health (SOH)</small>
                          <div className="d-flex align-items-center">
                            <div className="progress flex-grow-1 me-2" style={{ height: '6px' }}>
                              <div
                                className={`progress-bar ${
                                  asset.soh >= 80 ? 'bg-success' : asset.soh >= 50 ? 'bg-warning' : 'bg-danger'
                                }`}
                                style={{ width: `${asset.soh}%` }}
                              ></div>
                            </div>
                            <strong className="small">{asset.soh}%</strong>
                          </div>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Total Swaps</small>
                          <strong>{asset.swaps}</strong>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Daily Swaps</small>
                          <strong>{asset.daily_swaps}</strong>
                        </div>
                        <div className="col-6">
                          <small className="text-muted d-block">Asset Value</small>
                          <strong>₦{asset.current_value.toLocaleString()}</strong>
                        </div>
                      </div>

                      {/* Investment Info */}
                      <div className="border-top pt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small className="text-muted">Min. Investment</small>
                          <strong>₦{(asset.current_value * 0.01).toLocaleString()}</strong>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted">Est. Annual ROI</small>
                          <strong className="text-success">12%</strong>
                        </div>

                        <button
                          className="btn btn-success btn-sm w-100"
                          onClick={() => handleInvestClick(asset)}
                          disabled={investmentDisabled}
                        >
                          <i className="bi bi-cart-plus me-1"></i>
                          {investmentDisabled ? 'KYC Required' : 'Invest Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Show More Button */}
          {sortedAssets.length > 6 && (
            <div className="text-center mt-4">
              <button className="btn btn-outline-primary">
                View All {sortedAssets.length} Assets
                <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Investment Modal */}
      {showInvestmentModal && selectedAsset && (
        <InvestmentModal
          show={showInvestmentModal}
          asset={selectedAsset}
          onClose={() => setShowInvestmentModal(false)}
          onSuccess={handleInvestmentSuccess}
          hasWallet={hasWallet}
          kycVerified={kycVerified}
        />
      )}

      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          transition: box-shadow 0.3s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default AvailableAssetsSection;

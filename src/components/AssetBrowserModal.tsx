import React, { useState } from 'react';
import { Asset } from '../types';

interface AssetBrowserModalProps {
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  onClose: () => void;
}

export const AssetBrowserModal: React.FC<AssetBrowserModalProps> = ({
  assets = [],
  onSelectAsset,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'soh' | 'swaps' | 'id'>('soh');

  const filteredAssets = assets
    .filter(asset => {
      const matchesSearch = asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || asset.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'soh') return (b.soh || 0) - (a.soh || 0);
      if (sortBy === 'swaps') return (b.swaps || 0) - (a.swaps || 0);
      return a.id.localeCompare(b.id);
    });

  const assetTypes = ['all', ...new Set(assets.map(a => a.type))];

  return (
    <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-search me-2"></i>
              Browse Investment Opportunities
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body p-4">
            {/* Search and Filter Bar */}
            <div className="row g-3 mb-4">
              <div className="col-md-5">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by model or ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select 
                  className="form-select"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                >
                  {assetTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select 
                  className="form-select"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                >
                  <option value="soh">Sort by Health</option>
                  <option value="swaps">Sort by Activity</option>
                  <option value="id">Sort by ID</option>
                </select>
              </div>
              <div className="col-md-1">
                <button 
                  className="btn btn-outline-secondary w-100"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setSortBy('soh');
                  }}
                  title="Clear filters"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-3">
              <small className="text-muted">
                Showing {filteredAssets.length} of {assets.length} assets
              </small>
            </div>

            {/* Asset Grid */}
            {filteredAssets.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <p className="text-muted mt-3">No assets match your search criteria</p>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="row g-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {filteredAssets.map(asset => {
                  const ownership_remaining = (asset as any).ownership_remaining ?? 100;
                  const isFullyOwned = ownership_remaining <= 0;
                  
                  return (
                    <div className="col-md-4" key={asset.id}>
                      <div className={`card h-100 border ${isFullyOwned ? 'border-secondary' : 'border-success'} shadow-sm`}>
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="badge bg-primary">{asset.type}</span>
                            <span className={`badge ${asset.status === 'Available' ? 'bg-success' : 'bg-warning'}`}>
                              {asset.status}
                            </span>
                          </div>
                          
                          <h6 className="fw-bold mb-2">{asset.model}</h6>
                          <p className="small text-muted mb-3">ID: {asset.id}</p>

                          {/* Key Metrics */}
                          <div className="row g-2 mb-3">
                            <div className="col-6">
                              <div className="text-center p-2 bg-light rounded">
                                <div className="small text-muted">Health</div>
                                <div className="fw-bold text-success">{asset.soh}%</div>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="text-center p-2 bg-light rounded">
                                <div className="small text-muted">Swaps</div>
                                <div className="fw-bold">{asset.swaps || 0}</div>
                              </div>
                            </div>
                          </div>

                          {/* Ownership Bar */}
                          <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="text-muted">Available</small>
                              <small className="fw-bold text-success">{ownership_remaining}%</small>
                            </div>
                            <div className="progress" style={{ height: '6px' }}>
                              <div 
                                className="progress-bar bg-success" 
                                style={{ width: `${ownership_remaining}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Daily Revenue Estimate */}
                          {asset.dailySwaps && (
                            <div className="alert alert-success alert-sm py-2 px-3 mb-3">
                              <small>
                                <i className="bi bi-cash-coin me-1"></i>
                                ~₦{((asset.dailySwaps || 0) * 800).toLocaleString()}/day revenue
                              </small>
                            </div>
                          )}

                          {/* Action Button */}
                          <button
                            className={`btn btn-sm w-100 ${isFullyOwned ? 'btn-secondary' : 'btn-success'}`}
                            onClick={() => {
                              if (!isFullyOwned) {
                                onSelectAsset(asset);
                                onClose();
                              }
                            }}
                            disabled={isFullyOwned}
                          >
                            <i className={`bi ${isFullyOwned ? 'bi-lock' : 'bi-cart-plus'} me-1`}></i>
                            {isFullyOwned ? 'Fully Allocated' : 'Invest Now'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetBrowserModal;

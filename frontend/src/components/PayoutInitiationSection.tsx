import React, { useState, useEffect } from 'react';
import { TrovotechAPI, AssetAPI } from '../services/api';

interface Asset {
  id: number;
  asset_id: string;
  model: string;
  type: string;
  current_value: number;
}

interface Token {
  id: number;
  token_id: string;
  asset_id: string;
  user_id: number;
  fraction_owned: number;
  investment_amount: number;
}

interface PayoutDistribution {
  tokenId: string;
  investorWallet: string;
  amount: number;
  percentage: number;
}

export const PayoutInitiationSection: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [period, setPeriod] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [distributions, setDistributions] = useState<PayoutDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'confirm' | 'success'>('input');
  const [error, setError] = useState('');
  const [payoutResult, setPayoutResult] = useState<any>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    if (selectedAsset) {
      loadTokensForAsset(selectedAsset);
    }
  }, [selectedAsset]);

  useEffect(() => {
    if (totalRevenue > 0 && tokens.length > 0) {
      calculateDistributions();
    }
  }, [totalRevenue, tokens]);

  const loadAssets = async () => {
    try {
      const response = await AssetAPI.list();
      setAssets(response.data || []);
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  };

  const loadTokensForAsset = async (assetId: string) => {
    try {
      setLoading(true);
      // This would be a new API endpoint: GET /api/assets/{assetId}/tokens
      // For now, we'll simulate it
      const response = await fetch(`/api/assets/${assetId}/tokens`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens || []);
      } else {
        setTokens([]);
      }
    } catch (err) {
      console.error('Failed to load tokens:', err);
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDistributions = () => {
    const totalOwnership = tokens.reduce((sum, token) => sum + token.fraction_owned, 0);
    
    const dists: PayoutDistribution[] = tokens.map(token => {
      const percentage = (token.fraction_owned / totalOwnership) * 100;
      const amount = (token.fraction_owned / totalOwnership) * totalRevenue;
      
      return {
        tokenId: token.token_id,
        investorWallet: `Investor #${token.user_id}`,
        amount: amount,
        percentage: percentage
      };
    });
    
    setDistributions(dists);
  };

  const handleContinueToPreview = () => {
    setError('');
    
    if (!selectedAsset) {
      setError('Please select an asset');
      return;
    }
    
    if (totalRevenue <= 0) {
      setError('Total revenue must be greater than 0');
      return;
    }
    
    if (!period) {
      setError('Please enter a period (e.g., "November 2025")');
      return;
    }
    
    if (!description) {
      setError('Please enter a description');
      return;
    }
    
    if (tokens.length === 0) {
      setError('No investors found for this asset');
      return;
    }
    
    setStep('preview');
  };

  const handleContinueToConfirm = () => {
    setStep('confirm');
  };

  const handleInitiatePayout = async () => {
    try {
      setProcessing(true);
      setError('');
      
      const tokenIds = tokens.map(t => t.token_id);
      
      const result = await TrovotechAPI.initiatePayout({
        tokenIds: tokenIds,
        totalRevenue: totalRevenue,
        period: period,
        description: description
      });
      
      setPayoutResult(result);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payout');
      setStep('confirm');
    } finally {
      setProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setSelectedAsset('');
    setTotalRevenue(0);
    setPeriod('');
    setDescription('');
    setTokens([]);
    setDistributions([]);
    setError('');
    setPayoutResult(null);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom">
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-cash-stack me-2 text-success"></i>
          Payout Distribution
        </h5>
        <small className="text-muted">Distribute revenue to token holders</small>
      </div>
      
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="animate__animated animate__fadeIn">
            <h6 className="fw-bold mb-3">Step 1: Enter Payout Details</h6>
            
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Select Asset <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                >
                  <option value="">Choose an asset...</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.asset_id}>
                      {asset.asset_id} - {asset.model} ({asset.type})
                    </option>
                  ))}
                </select>
                <small className="text-muted">Select the asset to distribute revenue for</small>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Total Revenue (₦) <span className="text-danger">*</span>
                </label>
                <input
                  type="number"
                  className="form-control"
                  value={totalRevenue}
                  onChange={(e) => setTotalRevenue(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <small className="text-muted">Total amount to distribute</small>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Period <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="e.g., November 2025, Q4 2025"
                />
                <small className="text-muted">Time period for this payout</small>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">
                  Description <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Monthly revenue distribution"
                  maxLength={255}
                />
                <small className="text-muted">Brief description of this payout</small>
              </div>
            </div>

            {/* Token Holders Summary */}
            {loading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading investors...</span>
                </div>
              </div>
            )}

            {!loading && tokens.length > 0 && (
              <div className="alert alert-info border-0">
                <i className="bi bi-info-circle me-2"></i>
                <strong>{tokens.length} investor(s)</strong> will receive payouts for this asset
              </div>
            )}

            {!loading && selectedAsset && tokens.length === 0 && (
              <div className="alert alert-warning border-0">
                <i className="bi bi-exclamation-triangle me-2"></i>
                No investors found for this asset. The asset must have token holders to distribute payouts.
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                className="btn btn-primary"
                onClick={handleContinueToPreview}
                disabled={loading || tokens.length === 0}
              >
                Continue to Preview
                <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview Distribution */}
        {step === 'preview' && (
          <div className="animate__animated animate__fadeIn">
            <h6 className="fw-bold mb-3">Step 2: Preview Distribution</h6>

            <div className="card border-primary mb-3">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <small className="text-muted d-block">Asset</small>
                    <strong>{selectedAsset}</strong>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Total Revenue</small>
                    <strong className="text-success">{formatCurrency(totalRevenue)}</strong>
                  </div>
                  <div className="col-md-4">
                    <small className="text-muted d-block">Period</small>
                    <strong>{period}</strong>
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block">Description</small>
                    <strong>{description}</strong>
                  </div>
                </div>
              </div>
            </div>

            <h6 className="fw-semibold mb-3">Distribution Breakdown</h6>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Token ID</th>
                    <th>Investor</th>
                    <th>Ownership %</th>
                    <th className="text-end">Payout Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((dist, idx) => (
                    <tr key={idx}>
                      <td><code className="small">{dist.tokenId}</code></td>
                      <td>{dist.investorWallet}</td>
                      <td>{dist.percentage.toFixed(2)}%</td>
                      <td className="text-end fw-bold text-success">
                        {formatCurrency(dist.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan={3} className="text-end"><strong>Total:</strong></td>
                    <td className="text-end fw-bold text-success">
                      {formatCurrency(distributions.reduce((sum, d) => sum + d.amount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="d-flex justify-content-between gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setStep('input')}>
                <i className="bi bi-arrow-left me-2"></i>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleContinueToConfirm}>
                Continue to Confirm
                <i className="bi bi-arrow-right ms-2"></i>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="animate__animated animate__fadeIn">
            <h6 className="fw-bold mb-3">Step 3: Confirm Distribution</h6>

            <div className="alert alert-warning border-0 mb-3">
              <i className="bi bi-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> This action will distribute {formatCurrency(totalRevenue)} to {distributions.length} investor(s). 
              This transaction will be recorded on the blockchain and cannot be reversed.
            </div>

            <div className="card border-0 bg-light mb-3">
              <div className="card-body">
                <h6 className="fw-semibold mb-3">Final Summary</h6>
                <div className="d-flex justify-content-between mb-2">
                  <span>Asset:</span>
                  <strong>{selectedAsset}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Total Revenue:</span>
                  <strong className="text-success">{formatCurrency(totalRevenue)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Number of Investors:</span>
                  <strong>{distributions.length}</strong>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Period:</span>
                  <strong>{period}</strong>
                </div>
                <div className="d-flex justify-content-between border-top pt-2 mt-2">
                  <span>Status:</span>
                  <strong className="text-warning">Ready to Execute</strong>
                </div>
              </div>
            </div>

            {processing && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Processing...</span>
                </div>
                <p className="text-muted">Recording distribution on blockchain...</p>
              </div>
            )}

            {!processing && (
              <div className="d-flex justify-content-between gap-2 mt-4">
                <button className="btn btn-secondary" onClick={() => setStep('preview')}>
                  <i className="bi bi-arrow-left me-2"></i>
                  Back
                </button>
                <button className="btn btn-success" onClick={handleInitiatePayout}>
                  <i className="bi bi-check-circle me-2"></i>
                  Confirm & Execute Payout
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="animate__animated animate__bounceIn text-center py-4">
            <div className="mb-4">
              <i className="bi bi-check-circle-fill display-1 text-success"></i>
            </div>
            <h4 className="mb-3 text-success">Payout Distributed Successfully!</h4>
            <p className="text-muted mb-4">
              {formatCurrency(totalRevenue)} has been distributed to {distributions.length} investor(s)
            </p>

            {payoutResult && (
              <div className="card border-success mb-3">
                <div className="card-body">
                  <div className="row g-2">
                    <div className="col-12">
                      <small className="text-muted">Payout ID</small>
                      <div><code>{payoutResult.payoutId}</code></div>
                    </div>
                    <div className="col-12">
                      <small className="text-muted">Transaction Hash</small>
                      <div><code className="small">{payoutResult.txHash}</code></div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Total Amount</small>
                      <div><strong>{formatCurrency(totalRevenue)}</strong></div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Completed At</small>
                      <div><strong>{new Date(payoutResult.completedAt).toLocaleString()}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="alert alert-info border-0">
              <i className="bi bi-info-circle me-2"></i>
              Investors will see this payout in their dashboard. A record has been saved on the blockchain.
            </div>

            <button className="btn btn-primary" onClick={handleReset}>
              <i className="bi bi-plus-circle me-2"></i>
              Initiate Another Payout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayoutInitiationSection;

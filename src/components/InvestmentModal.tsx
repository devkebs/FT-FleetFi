import React, { useState, useEffect } from 'react';
import { InvestmentAPI, InvestableAsset, WalletAPI } from '../services/api';

interface InvestmentModalProps {
  asset: InvestableAsset;
  onClose: () => void;
  onSuccess?: () => void;
}

export const InvestmentModal: React.FC<InvestmentModalProps> = ({ asset, onClose, onSuccess }) => {
  const [step, setStep] = useState<'details' | 'amount' | 'confirm' | 'processing' | 'success' | 'error'>('details');
  const [amount, setAmount] = useState<number>(asset.min_investment);
  const [ownershipPercent, setOwnershipPercent] = useState<number>(0);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    loadWalletBalance();
  }, []);

  useEffect(() => {
    // Calculate ownership percentage based on amount
    if (asset.current_value > 0 && amount > 0) {
      const percentage = (amount / asset.current_value) * 100;
      setOwnershipPercent(Math.min(percentage, asset.ownership_remaining));
    }
  }, [amount, asset.current_value, asset.ownership_remaining]);

  const loadWalletBalance = async () => {
    try {
      const data = await WalletAPI.getMyWallet();
      setWalletBalance(data.wallet?.balance || 0);
    } catch (err) {
      console.error('Failed to load wallet balance:', err);
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
      charging_cabinet: 'Charging Cabinet',
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

  const handleAmountChange = (value: number) => {
    const maxAmount = (asset.ownership_remaining / 100) * asset.current_value;
    setAmount(Math.min(Math.max(value, asset.min_investment), maxAmount));
  };

  const handlePurchase = async () => {
    try {
      setStep('processing');
      setLoading(true);
      setError(null);

      const response = await InvestmentAPI.purchase({
        asset_id: asset.id,
        amount: amount,
        ownership_percentage: ownershipPercent,
      });

      setResult(response);
      setStep('success');

      // Dispatch toast notification
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: {
          type: 'success',
          title: 'Investment Successful!',
          message: `You now own ${ownershipPercent.toFixed(2)}% of ${asset.model}`,
        },
      }));

      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Investment failed. Please try again.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const canAfford = walletBalance >= amount;
  const isValidAmount = amount >= asset.min_investment && ownershipPercent <= asset.ownership_remaining;

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          {/* Header */}
          <div className="modal-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <h5 className="modal-title">
              <i className={`bi ${getAssetTypeIcon(asset.type)} me-2`}></i>
              Invest in {asset.model}
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {/* Step: Asset Details */}
            {step === 'details' && (
              <div>
                <div className="row g-4">
                  {/* Asset Info */}
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-body">
                        <h6 className="card-title mb-3">
                          <i className="bi bi-info-circle me-2 text-primary"></i>
                          Asset Information
                        </h6>
                        <div className="mb-2 d-flex justify-content-between">
                          <span className="text-muted">Type:</span>
                          <span className="badge bg-secondary">{getAssetTypeLabel(asset.type)}</span>
                        </div>
                        <div className="mb-2 d-flex justify-content-between">
                          <span className="text-muted">Asset ID:</span>
                          <span className="font-monospace small">{asset.asset_id}</span>
                        </div>
                        <div className="mb-2 d-flex justify-content-between">
                          <span className="text-muted">Location:</span>
                          <span>{asset.location}</span>
                        </div>
                        <div className="mb-2 d-flex justify-content-between">
                          <span className="text-muted">Health (SOH):</span>
                          <span className="fw-bold text-success">{asset.soh}%</span>
                        </div>
                        <div className="mb-2 d-flex justify-content-between">
                          <span className="text-muted">Daily Swaps:</span>
                          <span>{asset.daily_swaps}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Risk Level:</span>
                          <span className={`badge ${getRiskBadgeClass(asset.risk_level || 'medium')}`}>
                            {(asset.risk_level || 'medium').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Investment Info */}
                  <div className="col-md-6">
                    <div className="card border h-100">
                      <div className="card-body">
                        <h6 className="card-title mb-3">
                          <i className="bi bi-graph-up-arrow me-2 text-success"></i>
                          Investment Details
                        </h6>
                        <div className="mb-2 d-flex justify-content-between">
                          <span className="text-muted">Current Value:</span>
                          <span className="fw-bold">{formatCurrency(asset.current_value)}</span>
                        </div>
                        <div className="mb-2 d-flex justify-content-between">
                          <span className="text-muted">Min Investment:</span>
                          <span>{formatCurrency(asset.min_investment)}</span>
                        </div>
                        <div className="mb-2 d-flex justify-content-between">
                          <span className="text-muted">Expected ROI:</span>
                          <span className="fw-bold text-success">{asset.expected_roi}% p.a.</span>
                        </div>
                        <div className="mb-2 d-flex justify-content-between">
                          <span className="text-muted">Est. Monthly Revenue:</span>
                          <span>{formatCurrency(asset.estimated_monthly_revenue)}</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between">
                          <span className="text-muted">Ownership Available:</span>
                          <span className="badge bg-primary fs-6">{Number(asset.ownership_remaining || 0).toFixed(1)}%</span>
                        </div>
                        <div className="progress mt-2" style={{ height: '8px' }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${Number(asset.total_ownership_sold || 0)}%` }}
                          ></div>
                        </div>
                        <small className="text-muted">{Number(asset.total_ownership_sold || 0).toFixed(1)}% already sold</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-end">
                  <button className="btn btn-outline-secondary me-2" onClick={onClose}>
                    Cancel
                  </button>
                  <button className="btn btn-success" onClick={() => setStep('amount')}>
                    Continue to Investment
                    <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step: Enter Amount */}
            {step === 'amount' && (
              <div>
                <div className="alert alert-info border-0">
                  <i className="bi bi-wallet2 me-2"></i>
                  Your wallet balance: <strong>{formatCurrency(walletBalance)}</strong>
                </div>

                <div className="card border mb-4">
                  <div className="card-body">
                    <h6 className="mb-3">Enter Investment Amount</h6>

                    <div className="mb-3">
                      <label className="form-label">Amount (NGN)</label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        value={amount}
                        onChange={(e) => handleAmountChange(Number(e.target.value))}
                        min={asset.min_investment}
                        step={1000}
                      />
                      <small className="text-muted">
                        Minimum: {formatCurrency(asset.min_investment)}
                      </small>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="d-flex gap-2 flex-wrap mb-3">
                      {[10000, 25000, 50000, 100000].map((quickAmount) => (
                        <button
                          key={quickAmount}
                          type="button"
                          className={`btn btn-sm ${amount === quickAmount ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => handleAmountChange(quickAmount)}
                        >
                          {formatCurrency(quickAmount)}
                        </button>
                      ))}
                    </div>

                    <div className="bg-light p-3 rounded">
                      <div className="d-flex justify-content-between mb-2">
                        <span>Investment Amount:</span>
                        <strong>{formatCurrency(amount)}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span>Ownership You'll Receive:</span>
                        <strong className="text-primary">{ownershipPercent.toFixed(2)}%</strong>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span>Expected Monthly Earnings:</span>
                        <strong className="text-success">
                          {formatCurrency((asset.estimated_monthly_revenue * ownershipPercent) / 100)}
                        </strong>
                      </div>
                    </div>

                    {!canAfford && (
                      <div className="alert alert-danger mt-3 mb-0">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        Insufficient wallet balance. Please deposit funds first.
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex justify-content-between">
                  <button className="btn btn-outline-secondary" onClick={() => setStep('details')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Back
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => setStep('confirm')}
                    disabled={!canAfford || !isValidAmount}
                  >
                    Review Investment
                    <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </div>
              </div>
            )}

            {/* Step: Confirm */}
            {step === 'confirm' && (
              <div>
                <div className="text-center mb-4">
                  <i className="bi bi-shield-check display-1 text-success"></i>
                  <h4 className="mt-3">Confirm Your Investment</h4>
                  <p className="text-muted">Please review the details before confirming</p>
                </div>

                <div className="card border mb-4">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">Asset</small>
                        <div className="fw-bold">{asset.model}</div>
                      </div>
                      <div className="col-6 text-end">
                        <small className="text-muted">Asset ID</small>
                        <div className="font-monospace small">{asset.asset_id}</div>
                      </div>
                    </div>
                    <hr />
                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">Investment Amount</small>
                        <div className="fs-4 fw-bold text-success">{formatCurrency(amount)}</div>
                      </div>
                      <div className="col-6 text-end">
                        <small className="text-muted">Ownership</small>
                        <div className="fs-4 fw-bold text-primary">{ownershipPercent.toFixed(2)}%</div>
                      </div>
                    </div>
                    <hr />
                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">Expected Annual ROI</small>
                        <div className="fw-bold">{asset.expected_roi}%</div>
                      </div>
                      <div className="col-6 text-end">
                        <small className="text-muted">Est. Monthly Earnings</small>
                        <div className="fw-bold text-success">
                          {formatCurrency((asset.estimated_monthly_revenue * ownershipPercent) / 100)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-warning border-0">
                  <i className="bi bi-info-circle me-2"></i>
                  <small>
                    By confirming, {formatCurrency(amount)} will be deducted from your wallet and you'll
                    receive {ownershipPercent.toFixed(2)}% ownership of this asset.
                  </small>
                </div>

                <div className="d-flex justify-content-between">
                  <button className="btn btn-outline-secondary" onClick={() => setStep('amount')}>
                    <i className="bi bi-arrow-left me-2"></i>
                    Back
                  </button>
                  <button className="btn btn-success btn-lg" onClick={handlePurchase}>
                    <i className="bi bi-check-circle me-2"></i>
                    Confirm Investment
                  </button>
                </div>
              </div>
            )}

            {/* Step: Processing */}
            {step === 'processing' && (
              <div className="text-center py-5">
                <div className="spinner-border text-success" style={{ width: '4rem', height: '4rem' }} role="status">
                  <span className="visually-hidden">Processing...</span>
                </div>
                <h4 className="mt-4">Processing Your Investment</h4>
                <p className="text-muted">Please wait while we complete your transaction...</p>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && result && (
              <div className="text-center py-4">
                <i className="bi bi-check-circle-fill display-1 text-success"></i>
                <h4 className="mt-3">Investment Successful!</h4>
                <p className="text-muted mb-4">
                  You now own {ownershipPercent.toFixed(2)}% of {asset.model}
                </p>

                <div className="card border mb-4">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-6">
                        <small className="text-muted">Amount Invested</small>
                        <div className="fw-bold text-success">{formatCurrency(amount)}</div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">New Wallet Balance</small>
                        <div className="fw-bold">{formatCurrency(result.new_balance)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary btn-lg" onClick={onClose}>
                  <i className="bi bi-house me-2"></i>
                  Return to Dashboard
                </button>
              </div>
            )}

            {/* Step: Error */}
            {step === 'error' && (
              <div className="text-center py-4">
                <i className="bi bi-x-circle-fill display-1 text-danger"></i>
                <h4 className="mt-3">Investment Failed</h4>
                <p className="text-muted mb-4">{error}</p>

                <div className="d-flex justify-content-center gap-2">
                  <button className="btn btn-outline-secondary" onClick={onClose}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={() => setStep('confirm')}>
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

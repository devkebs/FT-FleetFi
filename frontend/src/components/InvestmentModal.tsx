import React, { useState, useEffect } from 'react';
import { TrovotechAPI, Asset } from '../services/api';

interface InvestmentModalProps {
  show: boolean;
  asset: Asset | null;
  onClose: () => void;
  onSuccess: () => void;
  hasWallet: boolean;
  kycVerified: boolean;
}

type Step = 'select' | 'review' | 'confirm' | 'processing' | 'success';

export const InvestmentModal: React.FC<InvestmentModalProps> = ({
  show,
  asset,
  onClose,
  onSuccess,
  hasWallet,
  kycVerified
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const [ownershipPercent, setOwnershipPercent] = useState(10);
  const [investmentAmount, setInvestmentAmount] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToRisks, setAgreedToRisks] = useState(false);
  const [error, setError] = useState('');
  const [tokenId, setTokenId] = useState<string>('');

  // Asset value per 1% - simplified calculation
  const valuePerPercent = asset ? asset.current_value / 100 : 0;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (show) {
      setCurrentStep('select');
      setOwnershipPercent(10);
      setAgreedToTerms(false);
      setAgreedToRisks(false);
      setError('');
      setTokenId('');
      calculateInvestmentAmount(10);
    }
  }, [show, asset]);

  const calculateInvestmentAmount = (percent: number) => {
    const amount = percent * valuePerPercent;
    setInvestmentAmount(Number(amount.toFixed(2)));
  };

  const handleOwnershipChange = (value: number) => {
    setOwnershipPercent(value);
    calculateInvestmentAmount(value);
  };

  const handleAmountChange = (value: number) => {
    setInvestmentAmount(value);
    // Reverse calculate ownership
    const percent = (value / asset!.current_value) * 100;
    setOwnershipPercent(Number(Math.min(100, percent).toFixed(2)));
  };

  const calculateProjectedROI = () => {
    // Simplified ROI calculation: 12% annual return
    const monthlyReturn = investmentAmount * 0.01; // 1% monthly
    const annualReturn = investmentAmount * 0.12; // 12% annually
    return { monthly: monthlyReturn, annual: annualReturn };
  };

  const handleContinueToReview = () => {
    if (!hasWallet) {
      setError('Please create a wallet first');
      return;
    }
    if (!kycVerified) {
      setError('Please complete KYC verification first');
      return;
    }
    if (ownershipPercent < 1 || ownershipPercent > 100) {
      setError('Ownership must be between 1% and 100%');
      return;
    }
    setError('');
    setCurrentStep('review');
  };

  const handleContinueToConfirm = () => {
    setCurrentStep('confirm');
  };

  const handleConfirmInvestment = async () => {
    if (!agreedToTerms || !agreedToRisks) {
      setError('Please agree to all terms and conditions');
      return;
    }

    try {
      setError('');
      setCurrentStep('processing');

      // Call token minting API
      const response = await TrovotechAPI.mintToken({
        asset_id: asset!.asset_id,
        fraction_owned: ownershipPercent / 100,
        purchase_price: investmentAmount
      });

      setTokenId(response.token_id || response.id);
      setCurrentStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process investment');
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'review') setCurrentStep('select');
    if (currentStep === 'confirm') setCurrentStep('review');
  };

  const handleClose = () => {
    if (currentStep === 'success') {
      onSuccess();
    }
    onClose();
  };

  const getStepNumber = (step: Step): number => {
    const steps: Step[] = ['select', 'review', 'confirm', 'processing', 'success'];
    return steps.indexOf(step) + 1;
  };

  if (!show || !asset) return null;

  const roi = calculateProjectedROI();

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header border-bottom">
            <div>
              <h5 className="modal-title fw-bold mb-1">
                <i className="bi bi-coin me-2 text-success"></i>
                Invest in {asset.asset_id}
              </h5>
              <small className="text-muted">{asset.model} - {asset.type}</small>
            </div>
            <button type="button" className="btn-close" onClick={handleClose}></button>
          </div>

          {/* Progress Indicator */}
          {currentStep !== 'processing' && currentStep !== 'success' && (
            <div className="px-4 pt-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                {(['select', 'review', 'confirm'] as Step[]).map((step, idx) => (
                  <React.Fragment key={step}>
                    <div className="text-center" style={{ flex: 1 }}>
                      <div
                        className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                          getStepNumber(currentStep) > idx + 1
                            ? 'bg-success text-white'
                            : getStepNumber(currentStep) === idx + 1
                            ? 'bg-primary text-white'
                            : 'bg-light text-muted'
                        }`}
                        style={{ width: '36px', height: '36px' }}
                      >
                        {getStepNumber(currentStep) > idx + 1 ? (
                          <i className="bi bi-check"></i>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <div className="small mt-1">
                        {step === 'select' && 'Select'}
                        {step === 'review' && 'Review'}
                        {step === 'confirm' && 'Confirm'}
                      </div>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`border-top ${
                          getStepNumber(currentStep) > idx + 1 ? 'border-success' : 'border-light'
                        }`}
                        style={{ flex: 2, height: '2px' }}
                      ></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger alert-dismissible fade show">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}

            {/* Step 1: Select Investment Amount */}
            {currentStep === 'select' && (
              <div className="animate__animated animate__fadeIn">
                <h6 className="fw-bold mb-3">Select Your Investment</h6>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Ownership Percentage: {ownershipPercent}%
                  </label>
                  <input
                    type="range"
                    className="form-range"
                    min="1"
                    max="100"
                    value={ownershipPercent}
                    onChange={(e) => handleOwnershipChange(Number(e.target.value))}
                  />
                  <div className="d-flex justify-content-between text-muted small">
                    <span>1%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Investment Amount (₦)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={investmentAmount}
                      onChange={(e) => handleAmountChange(Number(e.target.value))}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Asset Value (₦)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={asset.current_value.toLocaleString()}
                      disabled
                    />
                  </div>
                </div>

                {/* ROI Projection */}
                <div className="card bg-light border-0 mb-3">
                  <div className="card-body">
                    <h6 className="fw-bold mb-3">
                      <i className="bi bi-graph-up me-2 text-success"></i>
                      Projected Returns
                    </h6>
                    <div className="row g-3">
                      <div className="col-6">
                        <small className="text-muted d-block">Monthly (Est.)</small>
                        <strong className="text-success">₦{roi.monthly.toFixed(2)}</strong>
                      </div>
                      <div className="col-6">
                        <small className="text-muted d-block">Annual (Est.)</small>
                        <strong className="text-success">₦{roi.annual.toFixed(2)}</strong>
                      </div>
                    </div>
                    <small className="text-muted d-block mt-2">
                      * Based on 12% annual ROI estimate
                    </small>
                  </div>
                </div>

                {/* Asset Info */}
                <div className="border rounded p-3">
                  <div className="row g-2">
                    <div className="col-6">
                      <small className="text-muted">Status</small>
                      <div><strong>{asset.status}</strong></div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Health (SOH)</small>
                      <div><strong>{asset.soh}%</strong></div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Total Swaps</small>
                      <div><strong>{asset.swaps}</strong></div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Daily Swaps</small>
                      <div><strong>{asset.daily_swaps}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Review */}
            {currentStep === 'review' && (
              <div className="animate__animated animate__fadeIn">
                <h6 className="fw-bold mb-3">Review Your Investment</h6>

                <div className="card border-primary mb-3">
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <small className="text-muted d-block">Asset</small>
                        <strong>{asset.asset_id} - {asset.model}</strong>
                      </div>
                      <div className="col-md-6">
                        <small className="text-muted d-block">Ownership</small>
                        <strong className="text-primary">{ownershipPercent}%</strong>
                      </div>
                      <div className="col-md-6">
                        <small className="text-muted d-block">Investment Amount</small>
                        <strong className="text-success">₦{investmentAmount.toLocaleString()}</strong>
                      </div>
                      <div className="col-md-6">
                        <small className="text-muted d-block">Est. Monthly Return</small>
                        <strong className="text-success">₦{roi.monthly.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info border-0">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>What happens next?</strong>
                  <ul className="mb-0 mt-2">
                    <li>Your investment will be recorded on the blockchain</li>
                    <li>You'll receive a tokenized asset representing your ownership</li>
                    <li>Returns will be distributed proportionally to your ownership</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {currentStep === 'confirm' && (
              <div className="animate__animated animate__fadeIn">
                <h6 className="fw-bold mb-3">Confirm Investment</h6>

                <div className="alert alert-warning border-0 mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Important:</strong> This transaction cannot be reversed once confirmed. 
                  Please review all details carefully.
                </div>

                <div className="border rounded p-3 bg-light mb-3">
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="terms">
                      I agree to the terms and conditions of asset tokenization
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="risk"
                      checked={agreedToRisks}
                      onChange={(e) => setAgreedToRisks(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="risk">
                      I understand the risks associated with this investment
                    </label>
                  </div>
                </div>

                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="fw-semibold mb-2">Final Summary</h6>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Asset:</span>
                      <strong>{asset.asset_id}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span>Ownership:</span>
                      <strong className="text-primary">{ownershipPercent}%</strong>
                    </div>
                    <div className="d-flex justify-content-between border-top pt-2 mt-2">
                      <span>Total Investment:</span>
                      <strong className="text-success fs-5">₦{investmentAmount.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Processing */}
            {currentStep === 'processing' && (
              <div className="animate__animated animate__fadeIn text-center py-5">
                <div className="spinner-border text-primary mb-4" style={{ width: '4rem', height: '4rem' }}>
                  <span className="visually-hidden">Processing...</span>
                </div>
                <h5 className="mb-3">Processing Your Investment</h5>
                <p className="text-muted">
                  Minting your asset token on the blockchain...
                </p>
                <div className="progress mx-auto" style={{ maxWidth: '300px', height: '8px' }}>
                  <div
                    className="progress-bar progress-bar-striped progress-bar-animated"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
            )}

            {/* Step 5: Success */}
            {currentStep === 'success' && (
              <div className="animate__animated animate__bounceIn text-center py-4">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill display-1 text-success"></i>
                </div>
                <h4 className="mb-3 text-success">Investment Successful!</h4>
                <p className="text-muted mb-4">
                  Your {ownershipPercent}% ownership in {asset.asset_id} has been recorded on the blockchain.
                </p>

                <div className="card border-success mb-3">
                  <div className="card-body">
                    <div className="row g-2">
                      <div className="col-12">
                        <small className="text-muted">Token ID</small>
                        <div><code>{tokenId}</code></div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Ownership</small>
                        <div><strong>{ownershipPercent}%</strong></div>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Investment</small>
                        <div><strong>₦{investmentAmount.toLocaleString()}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="alert alert-info border-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Your investment is now active! Returns will be distributed to your wallet proportionally.
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer border-top">
            {currentStep === 'select' && (
              <>
                <button className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleContinueToReview}>
                  Continue to Review
                </button>
              </>
            )}

            {currentStep === 'review' && (
              <>
                <button className="btn btn-secondary" onClick={handleBack}>
                  <i className="bi bi-arrow-left me-1"></i> Back
                </button>
                <button className="btn btn-primary" onClick={handleContinueToConfirm}>
                  Continue to Confirm
                </button>
              </>
            )}

            {currentStep === 'confirm' && (
              <>
                <button className="btn btn-secondary" onClick={handleBack}>
                  <i className="bi bi-arrow-left me-1"></i> Back
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleConfirmInvestment}
                  disabled={!agreedToTerms || !agreedToRisks}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Confirm Investment
                </button>
              </>
            )}

            {currentStep === 'success' && (
              <button className="btn btn-primary" onClick={handleClose}>
                <i className="bi bi-house-door me-1"></i>
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentModal;

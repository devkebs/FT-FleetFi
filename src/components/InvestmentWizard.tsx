import React, { useState, useEffect } from 'react';
import { Asset } from '../types';
import { WalletResponse } from '../services/trovotech';

interface InvestmentWizardProps {
  asset: Asset;
  wallet: WalletResponse;
  onComplete: (params: {
    fractionOwned: number;
    investAmount: number;
  }) => Promise<void>;
  onCancel: () => void;
}

type WizardStep = 'select' | 'review' | 'confirm' | 'processing' | 'success';

export const InvestmentWizard: React.FC<InvestmentWizardProps> = ({
  asset,
  wallet,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select');
  const [fractionOwned, setFractionOwned] = useState(10);
  const [investAmount, setInvestAmount] = useState(100);
  const [estimatedMonthlyReturn, setEstimatedMonthlyReturn] = useState(0);
  const [estimatedAnnualROI, setEstimatedAnnualROI] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingOwnership = (asset as any).ownership_remaining ?? 100;

  // Calculate estimated returns based on investment
  useEffect(() => {
    const baseMonthlyRevenue = 150000; // Estimated monthly revenue per asset (NGN)
    const monthlyReturn = (baseMonthlyRevenue * fractionOwned) / 100;
    const annualReturn = monthlyReturn * 12;
    const roi = investAmount > 0 ? (annualReturn / investAmount) * 100 : 0;

    setEstimatedMonthlyReturn(monthlyReturn);
    setEstimatedAnnualROI(roi);
  }, [fractionOwned, investAmount]);

  const handleNext = () => {
    if (currentStep === 'select') {
      // Validate minimum investment before proceeding
      if (investAmount < 100) {
        setError('Minimum investment amount is ₦100');
        return;
      }
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      setCurrentStep('confirm');
    } else if (currentStep === 'confirm') {
      handleConfirmInvestment();
    }
  };

  const handleBack = () => {
    if (currentStep === 'review') setCurrentStep('select');
    else if (currentStep === 'confirm') setCurrentStep('review');
  };

  const handleConfirmInvestment = async () => {
    setCurrentStep('processing');
    setProcessing(true);
    setError(null);

    try {
      await onComplete({ fractionOwned, investAmount });
      setCurrentStep('success');
    } catch (err: any) {
      setError(err.message || 'Investment failed');
      setCurrentStep('confirm');
    } finally {
      setProcessing(false);
    }
  };

  const getStepNumber = (step: WizardStep): number => {
    const steps: WizardStep[] = ['select', 'review', 'confirm', 'processing', 'success'];
    return steps.indexOf(step) + 1;
  };

  const isStepComplete = (step: WizardStep): boolean => {
    return getStepNumber(step) < getStepNumber(currentStep);
  };

  const isStepActive = (step: WizardStep): boolean => {
    return step === currentStep;
  };

  return (
    <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          {/* Header with Progress Indicator */}
          <div className="modal-header border-bottom-0 pb-0">
            <h5 className="modal-title">
              <i className="bi bi-coin me-2"></i>
              Invest in {asset.model}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onCancel}
              disabled={processing}
            ></button>
          </div>

          {/* Progress Steps */}
          <div className="px-4 pt-3 pb-2">
            <div className="d-flex justify-content-between position-relative">
              {/* Progress Line */}
              <div 
                className="position-absolute top-50 start-0 translate-middle-y" 
                style={{ 
                  height: '2px', 
                  width: '100%', 
                  backgroundColor: '#e9ecef',
                  zIndex: 0
                }}
              >
                <div 
                  style={{
                    height: '100%',
                    width: `${((getStepNumber(currentStep) - 1) / 4) * 100}%`,
                    backgroundColor: '#198754',
                    transition: 'width 0.3s ease'
                  }}
                ></div>
              </div>

              {/* Step Indicators */}
              {[
                { step: 'select' as WizardStep, label: 'Select', icon: 'percent' },
                { step: 'review' as WizardStep, label: 'Review', icon: 'file-text' },
                { step: 'confirm' as WizardStep, label: 'Confirm', icon: 'check-circle' },
                { step: 'processing' as WizardStep, label: 'Processing', icon: 'arrow-repeat' },
                { step: 'success' as WizardStep, label: 'Success', icon: 'trophy' }
              ].map(({ step, label, icon }) => (
                <div 
                  key={step}
                  className="text-center position-relative" 
                  style={{ flex: 1, zIndex: 1 }}
                >
                  <div 
                    className={`rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center ${
                      isStepComplete(step) 
                        ? 'bg-success text-white' 
                        : isStepActive(step)
                        ? 'bg-primary text-white'
                        : 'bg-light text-muted'
                    }`}
                    style={{ 
                      width: '40px', 
                      height: '40px',
                      border: isStepActive(step) ? '3px solid #0d6efd' : '2px solid transparent',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className={`bi bi-${icon}`}></i>
                  </div>
                  <small className={`d-block ${isStepActive(step) ? 'fw-bold text-primary' : 'text-muted'}`}>
                    {label}
                  </small>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Body - Content Changes Based on Step */}
          <div className="modal-body" style={{ minHeight: '350px' }}>
            {error && (
              <div className="alert alert-danger alert-dismissible fade show">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <button type="button" className="btn-close" onClick={() => setError(null)}></button>
              </div>
            )}

            {/* Step 1: Select Investment Amount */}
            {currentStep === 'select' && (
              <div className="animate__animated animate__fadeIn">
                <h6 className="fw-bold mb-3">Choose Your Investment</h6>
                
                <div className="card bg-light mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-1 small text-muted">Asset ID</p>
                        <p className="mb-2 fw-bold">{asset.id}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1 small text-muted">Type</p>
                        <p className="mb-2 fw-bold">{asset.type}</p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1 small text-muted">Status</p>
                        <p className="mb-2"><span className="badge bg-success">{asset.status}</span></p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-1 small text-muted">State of Health</p>
                        <p className="mb-0 fw-bold">{asset.soh}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold">
                    Ownership Percentage
                    <span className="text-muted ms-2 fw-normal small">
                      ({remainingOwnership}% available)
                    </span>
                  </label>
                  <input 
                    type="range" 
                    className="form-range" 
                    min="1" 
                    max={Math.min(100, remainingOwnership)}
                    value={fractionOwned} 
                    onChange={e => setFractionOwned(parseInt(e.target.value))}
                  />
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="badge bg-primary" style={{ fontSize: '1.25rem', padding: '0.5rem 1rem' }}>
                      {fractionOwned}%
                    </span>
                    <div className="text-end">
                      <div className="small text-muted">Estimated Monthly Revenue</div>
                      <div className="fw-bold text-success">₦{estimatedMonthlyReturn.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Investment Amount (₦)</label>
                  <input 
                    type="number" 
                    className="form-control form-control-lg" 
                    value={investAmount} 
                    onChange={e => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setInvestAmount(Math.max(0, value));
                    }}
                    onBlur={() => {
                      // Ensure minimum on blur
                      if (investAmount < 100) {
                        setInvestAmount(100);
                      }
                    }}
                    min="100"
                    step="1"
                  />
                  <div className="form-text">Minimum investment: ₦100</div>
                </div>

                <div className="alert alert-info">
                  <i className="bi bi-lightbulb me-2"></i>
                  <strong>Estimated Annual ROI:</strong> {estimatedAnnualROI.toFixed(1)}%
                </div>
              </div>
            )}

            {/* Step 2: Review Investment Details */}
            {currentStep === 'review' && (
              <div className="animate__animated animate__fadeIn">
                <h6 className="fw-bold mb-3">Review Investment Details</h6>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-2 text-muted">
                          <i className="bi bi-cash-stack me-2"></i>Investment
                        </h6>
                        <p className="card-text display-6 fw-bold text-primary mb-0">
                          ₦{investAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100">
                      <div className="card-body">
                        <h6 className="card-subtitle mb-2 text-muted">
                          <i className="bi bi-percent me-2"></i>Ownership
                        </h6>
                        <p className="card-text display-6 fw-bold text-success mb-0">
                          {fractionOwned}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mt-3">
                  <div className="card-header bg-light">
                    <strong>Expected Returns</strong>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6 border-end">
                        <div className="text-center">
                          <div className="small text-muted mb-1">Monthly Revenue</div>
                          <div className="h5 mb-0 text-success">₦{estimatedMonthlyReturn.toLocaleString()}</div>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="text-center">
                          <div className="small text-muted mb-1">Annual ROI</div>
                          <div className="h5 mb-0 text-success">{estimatedAnnualROI.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card mt-3">
                  <div className="card-header bg-light">
                    <strong>Wallet Information</strong>
                  </div>
                  <div className="card-body">
                    <div className="mb-2">
                      <small className="text-muted">Wallet Address</small>
                      <div className="font-monospace small">{wallet.walletAddress}</div>
                    </div>
                    <div>
                      <small className="text-muted">Current Balance</small>
                      <div className="fw-bold">₦{(wallet.balance || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Final Confirmation */}
            {currentStep === 'confirm' && (
              <div className="animate__animated animate__fadeIn text-center">
                <div className="mb-4">
                  <i className="bi bi-shield-check display-1 text-warning"></i>
                </div>
                <h5 className="mb-3">Confirm Your Investment</h5>
                <p className="text-muted mb-4">
                  You are about to invest <strong className="text-primary">₦{investAmount.toLocaleString()}</strong> for <strong className="text-success">{fractionOwned}%</strong> ownership of {asset.model}.
                </p>

                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Important:</strong> This transaction cannot be reversed once confirmed. 
                  Please review all details carefully.
                </div>

                <div className="border rounded p-3 bg-light text-start">
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="terms" />
                    <label className="form-check-label" htmlFor="terms">
                      I agree to the terms and conditions of asset tokenization
                    </label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="risk" />
                    <label className="form-check-label" htmlFor="risk">
                      I understand the risks associated with this investment
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Processing */}
            {currentStep === 'processing' && (
              <div className="animate__animated animate__fadeIn text-center py-5">
                <div className="spinner-border text-primary mb-4" style={{ width: '4rem', height: '4rem' }} role="status">
                  <span className="visually-hidden">Processing...</span>
                </div>
                <h5 className="mb-3">Processing Your Investment</h5>
                <p className="text-muted">
                  Minting your asset token on the blockchain...
                </p>
                <div className="progress mx-auto" style={{ maxWidth: '300px', height: '8px' }}>
                  <div 
                    className="progress-bar progress-bar-striped progress-bar-animated" 
                    role="progressbar" 
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
                <h4 className="mb-3 text-success">Investment Successful! 🎉</h4>
                <p className="text-muted mb-4">
                  You now own <strong className="text-success">{fractionOwned}%</strong> of {asset.model}
                </p>

                <div className="card mx-auto" style={{ maxWidth: '400px' }}>
                  <div className="card-body">
                    <h6 className="card-subtitle mb-3 text-muted">Investment Summary</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Investment Amount:</span>
                      <strong>₦{investAmount.toLocaleString()}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Ownership Share:</span>
                      <strong>{fractionOwned}%</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Est. Monthly Revenue:</span>
                      <strong className="text-success">₦{estimatedMonthlyReturn.toLocaleString()}</strong>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <span>Est. Annual ROI:</span>
                      <strong className="text-success">{estimatedAnnualROI.toFixed(1)}%</strong>
                    </div>
                  </div>
                </div>

                <div className="alert alert-success mt-4 mx-auto" style={{ maxWidth: '400px' }}>
                  <i className="bi bi-bell me-2"></i>
                  You will receive email notifications for revenue distributions
                </div>
              </div>
            )}
          </div>

          {/* Footer - Navigation Buttons */}
          <div className="modal-footer border-top-0">
            {currentStep !== 'success' && currentStep !== 'processing' && (
              <>
                {currentStep !== 'select' && (
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={handleBack}
                    disabled={processing}
                  >
                    <i className="bi bi-arrow-left me-2"></i>Back
                  </button>
                )}
                <button 
                  className="btn btn-secondary" 
                  onClick={onCancel}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={handleNext}
                  disabled={processing || (currentStep === 'confirm' && remainingOwnership <= 0)}
                >
                  {currentStep === 'confirm' ? (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Confirm Investment
                    </>
                  ) : (
                    <>
                      Continue
                      <i className="bi bi-arrow-right ms-2"></i>
                    </>
                  )}
                </button>
              </>
            )}
            {currentStep === 'success' && (
              <button 
                className="btn btn-primary btn-lg" 
                onClick={onCancel}
              >
                <i className="bi bi-house me-2"></i>
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

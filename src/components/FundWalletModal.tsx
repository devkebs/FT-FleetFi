import React, { useState } from 'react';
import { PaymentAPI } from '../services/api';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number, newBalance: number) => void;
  currentBalance?: number;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance = 0,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [gateway, setGateway] = useState<'paystack' | 'flutterwave'>('paystack');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fee, setFee] = useState<number>(0);

  const quickAmounts = [1000, 5000, 10000, 25000, 50000, 100000];

  const handleAmountChange = async (value: string) => {
    setAmount(value);
    setError(null);

    const numAmount = parseFloat(value);
    if (numAmount >= 100) {
      try {
        const feeData = await PaymentAPI.calculateFee(numAmount, gateway, 'funding');
        setFee(feeData.fee);
      } catch {
        // Fallback fee calculation
        const calcFee = gateway === 'paystack'
          ? Math.min((numAmount * 0.015) + 100, 2000)
          : Math.min(numAmount * 0.014, 2000);
        setFee(calcFee);
      }
    } else {
      setFee(0);
    }
  };

  const handleQuickAmount = (value: number) => {
    handleAmountChange(value.toString());
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount < 100) {
      setError('Minimum amount is N100');
      return;
    }

    if (numAmount > 10000000) {
      setError('Maximum amount is N10,000,000');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await PaymentAPI.fundWallet(numAmount, gateway);

      if (response.success && response.authorization_url) {
        // Store reference for callback verification
        sessionStorage.setItem('pending_payment', JSON.stringify({
          reference: response.reference,
          gateway,
          amount: numAmount,
        }));

        // Redirect to payment page
        window.location.href = response.authorization_url;
      } else {
        setError('Failed to initialize payment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-success text-white">
            <h5 className="modal-title">
              <i className="bi bi-wallet-fill me-2"></i>
              Fund Your Wallet
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            {/* Current Balance */}
            <div className="bg-light rounded p-3 mb-4 text-center">
              <small className="text-muted">Current Balance</small>
              <h3 className="mb-0 text-success">N{currentBalance.toLocaleString()}</h3>
            </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger py-2 mb-3">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Amount to Fund</label>
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-success text-white">N</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  min="100"
                  max="10000000"
                  disabled={loading}
                />
              </div>
              <small className="text-muted">Minimum: N100 | Maximum: N10,000,000</small>
            </div>

            {/* Quick Amounts */}
            <div className="mb-4">
              <label className="form-label text-muted small">Quick Select</label>
              <div className="d-flex flex-wrap gap-2">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`btn btn-sm ${
                      parseFloat(amount) === value ? 'btn-success' : 'btn-outline-success'
                    }`}
                    onClick={() => handleQuickAmount(value)}
                    disabled={loading}
                  >
                    N{value.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Gateway Selection */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Payment Method</label>
              <div className="row g-2">
                <div className="col-6">
                  <div
                    className={`card cursor-pointer ${gateway === 'paystack' ? 'border-success border-2' : ''}`}
                    onClick={() => !loading && setGateway('paystack')}
                    style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    <div className="card-body text-center py-3">
                      <img
                        src="https://website-v3-assets.s3.amazonaws.com/assets/img/hero/Paystack-mark-white-twitter.png"
                        alt="Paystack"
                        className="mb-2"
                        style={{ height: '24px', filter: gateway === 'paystack' ? 'none' : 'grayscale(100%)' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="fw-semibold text-success">Paystack</div>
                      <small className="text-muted">Cards, Bank, USSD</small>
                    </div>
                  </div>
                </div>
                <div className="col-6">
                  <div
                    className={`card cursor-pointer ${gateway === 'flutterwave' ? 'border-success border-2' : ''}`}
                    onClick={() => !loading && setGateway('flutterwave')}
                    style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                  >
                    <div className="card-body text-center py-3">
                      <img
                        src="https://flutterwave.com/images/logo/full.svg"
                        alt="Flutterwave"
                        className="mb-2"
                        style={{ height: '24px', filter: gateway === 'flutterwave' ? 'none' : 'grayscale(100%)' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="fw-semibold text-warning">Flutterwave</div>
                      <small className="text-muted">Cards, Bank, Mobile</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Summary */}
            {numAmount >= 100 && (
              <div className="bg-light rounded p-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Amount</span>
                  <span>N{numAmount.toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Processing Fee</span>
                  <span className="text-danger">-N{fee.toLocaleString()}</span>
                </div>
                <hr className="my-2" />
                <div className="d-flex justify-content-between">
                  <span className="fw-semibold">You'll Receive</span>
                  <span className="fw-bold text-success">N{(numAmount - fee).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-success px-4"
              onClick={handleSubmit}
              disabled={loading || numAmount < 100}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="bi bi-credit-card me-2"></i>
                  Pay N{numAmount.toLocaleString()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundWalletModal;

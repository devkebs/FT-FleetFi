import React, { useState, useEffect } from 'react';
import { PaymentAPI, PaymentMethod, Bank } from '../services/api';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number, newBalance: number) => void;
  currentBalance: number;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentBalance,
}) => {
  const [step, setStep] = useState<'select' | 'add' | 'confirm'>('select');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add bank form
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const fee = (() => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 5000) return 10;
    if (numAmount <= 50000) return 25;
    return 50;
  })();

  useEffect(() => {
    if (isOpen) {
      loadPaymentMethods();
      loadBanks();
    }
  }, [isOpen]);

  const loadPaymentMethods = async () => {
    try {
      const methods = await PaymentAPI.getPaymentMethods();
      setPaymentMethods(methods);
      if (methods.length > 0) {
        const defaultMethod = methods.find(m => m.is_default) || methods[0];
        setSelectedMethodId(defaultMethod.id);
      }
    } catch (err) {
      console.error('Failed to load payment methods:', err);
    }
  };

  const loadBanks = async () => {
    try {
      const bankList = await PaymentAPI.getBanks();
      setBanks(bankList);
    } catch (err) {
      console.error('Failed to load banks:', err);
    }
  };

  const handleVerifyAccount = async () => {
    if (!accountNumber || accountNumber.length !== 10) {
      setError('Please enter a valid 10-digit account number');
      return;
    }
    if (!bankCode) {
      setError('Please select a bank');
      return;
    }

    setVerifying(true);
    setError(null);
    setAccountName('');

    try {
      const result = await PaymentAPI.verifyBankAccount(accountNumber, bankCode);
      setAccountName(result.account_name);
    } catch (err: any) {
      setError(err.message || 'Failed to verify account');
    } finally {
      setVerifying(false);
    }
  };

  const handleAddBank = async () => {
    if (!accountName) {
      setError('Please verify your account first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newMethod = await PaymentAPI.addBankAccount(accountNumber, bankCode);
      setPaymentMethods([...paymentMethods, newMethod]);
      setSelectedMethodId(newMethod.id);
      setStep('select');
      setAccountNumber('');
      setAccountName('');
      setBankCode('');
      setSuccess('Bank account added successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to add bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount < 1000) {
      setError('Minimum withdrawal is N1,000');
      return;
    }

    if (numAmount > currentBalance) {
      setError('Insufficient balance');
      return;
    }

    if (!selectedMethodId) {
      setError('Please select a bank account');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await PaymentAPI.withdraw(numAmount, selectedMethodId);

      if (response.success) {
        setSuccess(`Withdrawal of N${numAmount.toLocaleString()} is being processed. You will receive N${response.net_amount.toLocaleString()} shortly.`);
        setStep('confirm');

        if (onSuccess) {
          onSuccess(numAmount, currentBalance - numAmount);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setAmount('');
    setError(null);
    setSuccess(null);
    setAccountNumber('');
    setAccountName('');
    setBankCode('');
    onClose();
  };

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId);

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-cash-stack me-2"></i>
              {step === 'add' ? 'Add Bank Account' : step === 'confirm' ? 'Withdrawal Successful' : 'Withdraw Funds'}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={handleClose}
              disabled={loading}
            ></button>
          </div>

          <div className="modal-body">
            {/* Success Message */}
            {success && step === 'confirm' && (
              <div className="text-center py-4">
                <div className="mb-4">
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                </div>
                <h5 className="text-success mb-3">Withdrawal Initiated</h5>
                <p className="text-muted">{success}</p>
                <button className="btn btn-success" onClick={handleClose}>
                  Done
                </button>
              </div>
            )}

            {/* Select Account Step */}
            {step === 'select' && (
              <>
                {/* Current Balance */}
                <div className="bg-light rounded p-3 mb-4 text-center">
                  <small className="text-muted">Available Balance</small>
                  <h3 className="mb-0 text-primary">N{currentBalance.toLocaleString()}</h3>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger py-2 mb-3">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && step === 'select' && (
                  <div className="alert alert-success py-2 mb-3">
                    <i className="bi bi-check-circle me-2"></i>
                    {success}
                  </div>
                )}

                {/* Amount Input */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Amount to Withdraw</label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text bg-primary text-white">N</span>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setError(null);
                      }}
                      min="1000"
                      max={currentBalance}
                      disabled={loading}
                    />
                  </div>
                  <small className="text-muted">Minimum: N1,000</small>
                </div>

                {/* Bank Account Selection */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-semibold mb-0">Withdraw To</label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setStep('add')}
                    >
                      <i className="bi bi-plus me-1"></i>Add Bank
                    </button>
                  </div>

                  {paymentMethods.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded">
                      <i className="bi bi-bank display-4 text-muted"></i>
                      <p className="text-muted mt-2 mb-0">No bank accounts added</p>
                      <button
                        className="btn btn-primary btn-sm mt-2"
                        onClick={() => setStep('add')}
                      >
                        Add Bank Account
                      </button>
                    </div>
                  ) : (
                    <div className="list-group">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`list-group-item list-group-item-action d-flex align-items-center ${
                            selectedMethodId === method.id ? 'active' : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <input
                            type="radio"
                            className="form-check-input me-3"
                            name="paymentMethod"
                            checked={selectedMethodId === method.id}
                            onChange={() => setSelectedMethodId(method.id)}
                          />
                          <div className="flex-grow-1">
                            <div className="fw-semibold">{method.bank_name}</div>
                            <small className={selectedMethodId === method.id ? 'text-white-50' : 'text-muted'}>
                              {method.account_number} - {method.account_name}
                            </small>
                          </div>
                          {method.is_default && (
                            <span className="badge bg-success">Default</span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fee Summary */}
                {numAmount >= 1000 && (
                  <div className="bg-light rounded p-3">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Withdrawal Amount</span>
                      <span>N{numAmount.toLocaleString()}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Transfer Fee</span>
                      <span className="text-danger">-N{fee}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between">
                      <span className="fw-semibold">You'll Receive</span>
                      <span className="fw-bold text-primary">N{(numAmount - fee).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Add Bank Account Step */}
            {step === 'add' && (
              <>
                <button
                  className="btn btn-link text-decoration-none p-0 mb-3"
                  onClick={() => {
                    setStep('select');
                    setError(null);
                    setAccountNumber('');
                    setAccountName('');
                    setBankCode('');
                  }}
                >
                  <i className="bi bi-arrow-left me-2"></i>Back
                </button>

                {/* Error Message */}
                {error && (
                  <div className="alert alert-danger py-2 mb-3">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                  </div>
                )}

                {/* Bank Selection */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Select Bank</label>
                  <select
                    className="form-select"
                    value={bankCode}
                    onChange={(e) => {
                      setBankCode(e.target.value);
                      setAccountName('');
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    <option value="">Choose a bank...</option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Account Number */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Account Number</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter 10-digit account number"
                      value={accountNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setAccountNumber(val);
                        setAccountName('');
                        setError(null);
                      }}
                      disabled={loading}
                      maxLength={10}
                    />
                    <button
                      className="btn btn-outline-primary"
                      onClick={handleVerifyAccount}
                      disabled={verifying || accountNumber.length !== 10 || !bankCode}
                    >
                      {verifying ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        'Verify'
                      )}
                    </button>
                  </div>
                </div>

                {/* Account Name (verified) */}
                {accountName && (
                  <div className="alert alert-success py-2 mb-3">
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>{accountName}</strong>
                  </div>
                )}
              </>
            )}
          </div>

          {step !== 'confirm' && (
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>

              {step === 'select' && (
                <button
                  type="button"
                  className="btn btn-primary px-4"
                  onClick={handleWithdraw}
                  disabled={loading || numAmount < 1000 || numAmount > currentBalance || !selectedMethodId}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send me-2"></i>
                      Withdraw N{numAmount.toLocaleString()}
                    </>
                  )}
                </button>
              )}

              {step === 'add' && (
                <button
                  type="button"
                  className="btn btn-primary px-4"
                  onClick={handleAddBank}
                  disabled={loading || !accountName}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-plus-circle me-2"></i>
                      Add Bank Account
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;

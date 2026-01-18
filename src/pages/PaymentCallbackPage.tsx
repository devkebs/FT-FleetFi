import React, { useEffect, useState } from 'react';
import { PaymentAPI } from '../services/api';

interface PaymentCallbackPageProps {
  onComplete: () => void;
  onNavigate: (page: string) => void;
}

export const PaymentCallbackPage: React.FC<PaymentCallbackPageProps> = ({
  onComplete,
  onNavigate,
}) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [amount, setAmount] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    // Get reference from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference') || urlParams.get('trxref') || urlParams.get('tx_ref');

    // Get stored pending payment info
    const pendingPaymentStr = sessionStorage.getItem('pending_payment');
    let pendingPayment: { reference: string; gateway: 'paystack' | 'flutterwave'; amount: number } | null = null;

    if (pendingPaymentStr) {
      try {
        pendingPayment = JSON.parse(pendingPaymentStr);
      } catch {
        // Invalid JSON
      }
    }

    const gateway = pendingPayment?.gateway || (urlParams.get('gateway') as 'paystack' | 'flutterwave') || 'paystack';
    const paymentReference = reference || pendingPayment?.reference;

    if (!paymentReference) {
      setStatus('failed');
      setMessage('No payment reference found. Please try again.');
      return;
    }

    try {
      const result = await PaymentAPI.verifyPayment(paymentReference, gateway);

      if (result.success) {
        setStatus('success');
        setMessage('Payment successful!');
        setAmount(result.amount);
        setNewBalance(result.new_balance);

        // Clear pending payment
        sessionStorage.removeItem('pending_payment');

        // Notify parent
        onComplete();
      } else {
        setStatus('failed');
        setMessage('Payment verification failed. Please contact support if you were charged.');
      }
    } catch (err: any) {
      setStatus('failed');
      setMessage(err.message || 'Payment verification failed. Please try again.');
    }
  };

  const handleRetry = () => {
    setStatus('verifying');
    setMessage('Verifying your payment...');
    verifyPayment();
  };

  const handleGoToDashboard = () => {
    onNavigate('dashboard');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="card-body text-center p-5">
          {status === 'verifying' && (
            <>
              <div className="spinner-border text-success mb-4" style={{ width: '4rem', height: '4rem' }}></div>
              <h4 className="mb-3">Verifying Payment</h4>
              <p className="text-muted mb-0">{message}</p>
              <p className="text-muted small">Please don't close this page...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
              </div>
              <h4 className="text-success mb-3">Payment Successful!</h4>

              {amount && (
                <div className="bg-success bg-opacity-10 rounded p-3 mb-3">
                  <div className="text-muted small">Amount Funded</div>
                  <div className="h3 text-success mb-0">N{amount.toLocaleString()}</div>
                </div>
              )}

              {newBalance !== null && (
                <div className="bg-light rounded p-3 mb-4">
                  <div className="text-muted small">New Wallet Balance</div>
                  <div className="h4 mb-0">N{newBalance.toLocaleString()}</div>
                </div>
              )}

              <p className="text-muted mb-4">
                Your wallet has been credited successfully. You can now use your balance to make investments.
              </p>

              <button
                className="btn btn-success btn-lg px-5"
                onClick={handleGoToDashboard}
              >
                <i className="bi bi-house-door me-2"></i>
                Go to Dashboard
              </button>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="mb-4">
                <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: '5rem' }}></i>
              </div>
              <h4 className="text-danger mb-3">Payment Failed</h4>
              <p className="text-muted mb-4">{message}</p>

              <div className="d-flex gap-3 justify-content-center">
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleGoToDashboard}
                >
                  <i className="bi bi-house-door me-2"></i>
                  Dashboard
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleRetry}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Retry Verification
                </button>
              </div>

              <div className="mt-4 p-3 bg-light rounded">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  If you were charged but the payment wasn't credited, please contact support with your transaction reference.
                </small>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;

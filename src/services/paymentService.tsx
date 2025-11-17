import { useState } from 'react';

interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number; // in kobo (smallest currency unit)
  currency: 'NGN' | 'USD' | 'GHS' | 'ZAR';
  reference: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: 'NGN' | 'USD' | 'GHS' | 'ZAR';
  payment_options: string;
  customer: {
    email: string;
    phone_number?: string;
    name?: string;
  };
  customizations: {
    title: string;
    description: string;
    logo?: string;
  };
  callback: (response: any) => void;
  onclose: () => void;
}

export class PaymentService {
  private static paystackPublicKey = (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY || '';
  private static flutterwavePublicKey = (import.meta as any).env?.VITE_FLUTTERWAVE_PUBLIC_KEY || '';

  /**
   * Initialize Paystack payment
   */
  static initializePaystack(config: Omit<PaystackConfig, 'publicKey'>): void {
    if (!this.paystackPublicKey) {
      console.error('Paystack public key not configured');
      return;
    }

    // Load Paystack script if not already loaded
    if (!(window as any).PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => this.openPaystack(config);
      document.body.appendChild(script);
    } else {
      this.openPaystack(config);
    }
  }

  private static openPaystack(config: Omit<PaystackConfig, 'publicKey'>): void {
    const handler = (window as any).PaystackPop.setup({
      key: this.paystackPublicKey,
      email: config.email,
      amount: config.amount,
      currency: config.currency,
      ref: config.reference,
      onClose: config.onClose,
      callback: (response: any) => {
        if (response.status === 'success') {
          config.onSuccess(response.reference);
        }
      },
    });

    handler.openIframe();
  }

  /**
   * Initialize Flutterwave payment
   */
  static initializeFlutterwave(config: Omit<FlutterwaveConfig, 'public_key'>): void {
    if (!this.flutterwavePublicKey) {
      console.error('Flutterwave public key not configured');
      return;
    }

    // Load Flutterwave script if not already loaded
    if (!(window as any).FlutterwaveCheckout) {
      const script = document.createElement('script');
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      script.onload = () => this.openFlutterwave(config);
      document.body.appendChild(script);
    } else {
      this.openFlutterwave(config);
    }
  }

  private static openFlutterwave(config: Omit<FlutterwaveConfig, 'public_key'>): void {
    (window as any).FlutterwaveCheckout({
      public_key: this.flutterwavePublicKey,
      tx_ref: config.tx_ref,
      amount: config.amount,
      currency: config.currency,
      payment_options: config.payment_options,
      customer: config.customer,
      customizations: config.customizations,
      callback: config.callback,
      onclose: config.onclose,
    });
  }

  /**
   * Generate unique payment reference
   */
  static generateReference(prefix: string = 'FLEET'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Verify payment on backend
   */
  static async verifyPayment(reference: string, gateway: 'paystack' | 'flutterwave'): Promise<any> {
    const response = await fetch(`/api/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ reference, gateway }),
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    return response.json();
  }
}

interface PaymentButtonProps {
  amount: number;
  email: string;
  currency?: 'NGN' | 'USD' | 'GHS' | 'ZAR';
  gateway?: 'paystack' | 'flutterwave';
  purpose: 'investment' | 'wallet_funding' | 'subscription';
  metadata?: Record<string, any>;
  onSuccess: (reference: string) => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentButton({
  amount,
  email,
  currency = 'NGN',
  gateway = 'paystack',
  purpose,
  metadata = {},
  onSuccess,
  onError,
  className = 'btn btn-primary',
  children = 'Pay Now',
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = () => {
    setLoading(true);
    const reference = PaymentService.generateReference(purpose.toUpperCase());

    if (gateway === 'paystack') {
      PaymentService.initializePaystack({
        email,
        amount: amount * 100, // Convert to kobo
        currency,
        reference,
        onSuccess: async (ref) => {
          try {
            await PaymentService.verifyPayment(ref, 'paystack');
            onSuccess(ref);
          } catch (error) {
            onError?.(error instanceof Error ? error.message : 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        onClose: () => {
          setLoading(false);
          onError?.('Payment cancelled');
        },
      });
    } else {
      PaymentService.initializeFlutterwave({
        tx_ref: reference,
        amount,
        currency,
        payment_options: 'card,banktransfer,ussd',
        customer: {
          email,
          name: metadata.customer_name,
          phone_number: metadata.customer_phone,
        },
        customizations: {
          title: 'FleetFi',
          description: `${purpose} payment`,
          logo: 'https://fleetfi.com/logo.png',
        },
        callback: async (response) => {
          if (response.status === 'successful') {
            try {
              await PaymentService.verifyPayment(response.tx_ref, 'flutterwave');
              onSuccess(response.tx_ref);
            } catch (error) {
              onError?.(error instanceof Error ? error.message : 'Payment verification failed');
            }
          } else {
            onError?.('Payment failed');
          }
          setLoading(false);
        },
        onclose: () => {
          setLoading(false);
          onError?.('Payment cancelled');
        },
      });
    }
  };

  return (
    <button 
      className={className} 
      onClick={handlePayment}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Example usage component
export function WalletFundingModal({ isOpen, onClose, userEmail }: { 
  isOpen: boolean; 
  onClose: () => void; 
  userEmail: string;
}) {
  const [amount, setAmount] = useState('');
  const [gateway, setGateway] = useState<'paystack' | 'flutterwave'>('paystack');

  const handleSuccess = (reference: string) => {
    alert(`Payment successful! Reference: ${reference}`);
    onClose();
    // Refresh wallet balance
    window.location.reload();
  };

  const handleError = (error: string) => {
    alert(`Payment failed: ${error}`);
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Fund Wallet</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Amount (NGN)</label>
              <input
                type="number"
                className="form-control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                min="100"
              />
              <small className="text-muted">Minimum: ₦100</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Payment Gateway</label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${gateway === 'paystack' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setGateway('paystack')}
                >
                  <img 
                    src="https://paystack.com/assets/img/logo/paystack-icon-blue.png" 
                    alt="Paystack" 
                    height="20"
                    className="me-2"
                  />
                  Paystack
                </button>
                <button
                  type="button"
                  className={`btn ${gateway === 'flutterwave' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setGateway('flutterwave')}
                >
                  <img 
                    src="https://flutterwave.com/images/logo/logo-colored.svg" 
                    alt="Flutterwave" 
                    height="20"
                    className="me-2"
                  />
                  Flutterwave
                </button>
              </div>
            </div>

            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              You will be redirected to a secure payment page
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <PaymentButton
              amount={parseFloat(amount) || 0}
              email={userEmail}
              gateway={gateway}
              purpose="wallet_funding"
              onSuccess={handleSuccess}
              onError={handleError}
              className="btn btn-primary"
            >
              Proceed to Payment
            </PaymentButton>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { TokenManager } from '../services/api';

interface WalletTransaction {
  id: number;
  type: string;
  amount: number;
  currency: string;
  status: string;
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  description: string | null;
  created_at: string;
  completed_at: string | null;
}

interface WalletWidgetProps {
  userId: number;
  walletAddress?: string;
  balance?: number;
  onRefresh?: () => void;
}

export const WalletWidget: React.FC<WalletWidgetProps> = ({
  userId,
  walletAddress,
  balance = 0,
  onRefresh
}) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [userId]);

  const loadTransactions = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const token = TokenManager.get();
      const response = await fetch(`http://127.0.0.1:8000/api/wallet/${userId}/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !transferTo || !transferAmount) return;
    
    try {
      setTransferring(true);
      const token = TokenManager.get();
      const response = await fetch(`http://127.0.0.1:8000/api/wallet/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_user_id: userId,
          to_address: transferTo,
          amount: parseFloat(transferAmount),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Transfer failed');
      }

      const result = await response.json();
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'success', title: 'Transfer Successful', message: `Sent ${transferAmount} NGN` }
      }));
      
      setShowTransfer(false);
      setTransferTo('');
      setTransferAmount('');
      loadTransactions();
      onRefresh?.();
    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'danger', title: 'Transfer Failed', message: error.message || 'Unable to transfer' }
      }));
    } finally {
      setTransferring(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'deposit': return 'bi-arrow-down-circle text-success';
      case 'withdrawal': return 'bi-arrow-up-circle text-danger';
      case 'transfer_in': return 'bi-arrow-left-circle text-info';
      case 'transfer_out': return 'bi-arrow-right-circle text-warning';
      case 'token_purchase': return 'bi-cart-check text-primary';
      case 'payout_received': return 'bi-cash-coin text-success';
      default: return 'bi-circle';
    }
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      deposit: 'success',
      withdrawal: 'danger',
      transfer_in: 'info',
      transfer_out: 'warning',
      token_purchase: 'primary',
      payout_received: 'success',
    };
    return badges[type] || 'secondary';
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-wallet2 me-2"></i>Wallet
        </h5>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-light" onClick={loadTransactions} disabled={loading}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="btn btn-sm btn-success" onClick={() => setShowTransfer(!showTransfer)}>
            <i className="bi bi-send me-1"></i>Transfer
          </button>
        </div>
      </div>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
          <div>
            <small className="text-muted d-block">Balance</small>
            <h3 className="mb-0">₦{balance.toLocaleString()}</h3>
          </div>
          {walletAddress && (
            <div className="text-end">
              <small className="text-muted d-block">Address</small>
              <code className="small">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</code>
              <button 
                className="btn btn-sm btn-link p-0 ms-2" 
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  window.dispatchEvent(new CustomEvent('app:toast', {
                    detail: { type: 'success', title: 'Copied', message: 'Address copied to clipboard' }
                  }));
                }}
              >
                <i className="bi bi-clipboard"></i>
              </button>
            </div>
          )}
        </div>

        {showTransfer && (
          <form onSubmit={handleTransfer} className="mb-3 p-3 border rounded bg-light">
            <h6>Transfer Funds</h6>
            <div className="mb-2">
              <label className="form-label small">To Address</label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="0x..."
                value={transferTo}
                onChange={e => setTransferTo(e.target.value)}
                required
              />
            </div>
            <div className="mb-2">
              <label className="form-label small">Amount (NGN)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balance}
                className="form-control form-control-sm"
                placeholder="0.00"
                value={transferAmount}
                onChange={e => setTransferAmount(e.target.value)}
                required
              />
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm" disabled={transferring}>
                {transferring ? 'Sending...' : 'Send'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTransfer(false)}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <h6 className="border-bottom pb-2">Recent Transactions</h6>
        {transactions.length === 0 ? (
          <p className="text-muted text-center py-3"><small>No transactions yet</small></p>
        ) : (
          <div className="list-group list-group-flush">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="list-group-item px-0 py-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-start gap-2">
                    <i className={`${getTypeIcon(tx.type)} fs-5`}></i>
                    <div>
                      <div className="fw-semibold small">{tx.description || tx.type.replace('_', ' ')}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                      {tx.tx_hash && (
                        <code className="small text-muted">{tx.tx_hash.slice(0, 10)}...</code>
                      )}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className={`fw-bold ${tx.type.includes('in') || tx.type.includes('deposit') || tx.type === 'payout_received' ? 'text-success' : 'text-danger'}`}>
                      {tx.type.includes('in') || tx.type.includes('deposit') || tx.type === 'payout_received' ? '+' : '-'}
                      ₦{tx.amount.toLocaleString()}
                    </div>
                    <span className={`badge bg-${getTypeBadge(tx.type)} small`}>{tx.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {transactions.length > 5 && (
          <div className="text-center mt-2">
            <small className="text-muted">Showing 5 of {transactions.length} transactions</small>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { WalletAPI, WalletData, WalletTransaction, WalletStats } from '../services/api';

interface WalletWidgetProps {
  userId: number;
  walletAddress?: string;
  balance?: number;
  onRefresh?: () => void;
  compact?: boolean;
}

type ModalType = 'transfer' | 'deposit' | 'withdraw' | null;

export const WalletWidget: React.FC<WalletWidgetProps> = ({
  userId,
  walletAddress: initialWalletAddress,
  balance: initialBalance = 0,
  onRefresh,
  compact = false
}) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Form states
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('bank_transfer');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [processing, setProcessing] = useState(false);

  // Use wallet data or props as fallback
  const walletAddress = wallet?.wallet_address || initialWalletAddress || '';
  const balance = wallet?.balance ?? initialBalance;

  const emitToast = (type: string, title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: { type, title, message }
    }));
  };

  const loadWalletData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);

      // Load wallet, transactions and stats in parallel
      const [walletResponse, transactionsResponse, statsResponse] = await Promise.allSettled([
        WalletAPI.getMyWallet(),
        WalletAPI.getTransactions(userId, { per_page: 10 }),
        WalletAPI.getStats(userId)
      ]);

      if (walletResponse.status === 'fulfilled') {
        setWallet(walletResponse.value.wallet);
        if (walletResponse.value.recent_transactions) {
          setTransactions(walletResponse.value.recent_transactions);
        }
      }

      if (transactionsResponse.status === 'fulfilled') {
        setTransactions(transactionsResponse.value.transactions);
      }

      if (statsResponse.status === 'fulfilled' && statsResponse.value.stats) {
        setStats(statsResponse.value.stats);
      }
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  // Auto-refresh wallet data every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadWalletData, 30000);
    return () => clearInterval(interval);
  }, [loadWalletData]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTo || !transferAmount) return;

    const amount = parseFloat(transferAmount);
    if (amount <= 0 || amount > balance) {
      emitToast('danger', 'Invalid Amount', 'Please enter a valid amount');
      return;
    }

    try {
      setProcessing(true);
      await WalletAPI.transfer(transferTo, amount, 'Transfer from wallet');
      emitToast('success', 'Transfer Successful', `Sent ₦${amount.toLocaleString()}`);
      setActiveModal(null);
      setTransferTo('');
      setTransferAmount('');
      loadWalletData();
      onRefresh?.();
    } catch (error: any) {
      emitToast('danger', 'Transfer Failed', error.message || 'Unable to complete transfer');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (amount < 1000) {
      emitToast('danger', 'Invalid Amount', 'Minimum deposit is ₦1,000');
      return;
    }

    try {
      setProcessing(true);
      await WalletAPI.deposit(amount, depositMethod);
      emitToast('success', 'Deposit Successful', `Added ₦${amount.toLocaleString()} to your wallet`);
      setActiveModal(null);
      setDepositAmount('');
      loadWalletData();
      onRefresh?.();
    } catch (error: any) {
      emitToast('danger', 'Deposit Failed', error.message || 'Unable to complete deposit');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (amount < 1000) {
      emitToast('danger', 'Invalid Amount', 'Minimum withdrawal is ₦1,000');
      return;
    }
    if (amount > balance) {
      emitToast('danger', 'Insufficient Balance', 'You do not have enough funds');
      return;
    }

    try {
      setProcessing(true);
      await WalletAPI.withdraw(amount, withdrawBank);
      emitToast('success', 'Withdrawal Initiated', `₦${amount.toLocaleString()} will be sent to your bank`);
      setActiveModal(null);
      setWithdrawAmount('');
      setWithdrawBank('');
      loadWalletData();
      onRefresh?.();
    } catch (error: any) {
      emitToast('danger', 'Withdrawal Failed', error.message || 'Unable to process withdrawal');
    } finally {
      setProcessing(false);
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

  const isCredit = (type: string) =>
    ['deposit', 'transfer_in', 'payout_received'].includes(type);

  const formatCurrency = (amount: number) => `₦${amount.toLocaleString()}`;

  // Compact view for sidebar/small widgets
  if (compact) {
    return (
      <div className="card shadow-sm">
        <div className="card-body p-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="text-muted small">
              <i className="bi bi-wallet2 me-1"></i>Wallet Balance
            </span>
            <button className="btn btn-sm btn-link p-0" onClick={loadWalletData} disabled={loading}>
              <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
            </button>
          </div>
          <h4 className="mb-2">{formatCurrency(balance)}</h4>
          <div className="d-flex gap-1">
            <button className="btn btn-sm btn-success flex-fill" onClick={() => setActiveModal('deposit')}>
              <i className="bi bi-plus-circle me-1"></i>Add
            </button>
            <button className="btn btn-sm btn-primary flex-fill" onClick={() => setActiveModal('transfer')}>
              <i className="bi bi-send me-1"></i>Send
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-wallet2 me-2"></i>Wallet
        </h5>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-light" onClick={loadWalletData} disabled={loading}>
            <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spin' : ''}`}></i>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Balance Display */}
        <div className="d-flex justify-content-between align-items-center mb-3 p-3 bg-light rounded">
          <div>
            <small className="text-muted d-block">Available Balance</small>
            <h3 className="mb-0">{formatCurrency(balance)}</h3>
            {wallet?.status && (
              <span className={`badge bg-${wallet.status === 'active' ? 'success' : 'warning'} mt-1`}>
                {wallet.status}
              </span>
            )}
          </div>
          {walletAddress && (
            <div className="text-end">
              <small className="text-muted d-block">Wallet Address</small>
              <code className="small">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</code>
              <button
                className="btn btn-sm btn-link p-0 ms-2"
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                  emitToast('success', 'Copied', 'Address copied to clipboard');
                }}
                title="Copy address"
              >
                <i className="bi bi-clipboard"></i>
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="row g-2 mb-3">
            <div className="col-6">
              <div className="p-2 border rounded text-center">
                <small className="text-muted d-block">This Month Income</small>
                <span className="text-success fw-bold">{formatCurrency(stats.monthly_income)}</span>
              </div>
            </div>
            <div className="col-6">
              <div className="p-2 border rounded text-center">
                <small className="text-muted d-block">This Month Expense</small>
                <span className="text-danger fw-bold">{formatCurrency(stats.monthly_expense)}</span>
              </div>
            </div>
            {stats.pending_transactions > 0 && (
              <div className="col-12">
                <div className="alert alert-warning py-2 mb-0 small">
                  <i className="bi bi-clock-history me-1"></i>
                  {stats.pending_transactions} pending transaction(s)
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-2 mb-3">
          <button
            className="btn btn-success flex-fill"
            onClick={() => setActiveModal('deposit')}
          >
            <i className="bi bi-plus-circle me-1"></i>Deposit
          </button>
          <button
            className="btn btn-primary flex-fill"
            onClick={() => setActiveModal('transfer')}
          >
            <i className="bi bi-send me-1"></i>Transfer
          </button>
          <button
            className="btn btn-outline-danger flex-fill"
            onClick={() => setActiveModal('withdraw')}
          >
            <i className="bi bi-cash-stack me-1"></i>Withdraw
          </button>
        </div>

        {/* Modal Forms */}
        {activeModal && (
          <div className="mb-3 p-3 border rounded bg-light">
            {activeModal === 'transfer' && (
              <form onSubmit={handleTransfer}>
                <h6><i className="bi bi-send me-2"></i>Transfer Funds</h6>
                <div className="mb-2">
                  <label className="form-label small">Recipient Wallet Address</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="G..."
                    value={transferTo}
                    onChange={e => setTransferTo(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Amount (NGN)</label>
                  <input
                    type="number"
                    step="100"
                    min="100"
                    max={balance}
                    className="form-control form-control-sm"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={e => setTransferAmount(e.target.value)}
                    required
                  />
                  <small className="text-muted">Available: {formatCurrency(balance)}</small>
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary btn-sm" disabled={processing}>
                    {processing ? 'Sending...' : 'Send'}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'deposit' && (
              <form onSubmit={handleDeposit}>
                <h6><i className="bi bi-plus-circle me-2"></i>Deposit Funds</h6>
                <div className="mb-2">
                  <label className="form-label small">Amount (NGN)</label>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    className="form-control form-control-sm"
                    placeholder="Minimum ₦1,000"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label small">Payment Method</label>
                  <select
                    className="form-select form-select-sm"
                    value={depositMethod}
                    onChange={e => setDepositMethod(e.target.value)}
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Debit Card</option>
                    <option value="mobile_money">Mobile Money</option>
                  </select>
                </div>
                <div className="alert alert-info py-2 small mb-2">
                  <i className="bi bi-info-circle me-1"></i>
                  Demo mode: Deposits are simulated instantly
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-success btn-sm" disabled={processing}>
                    {processing ? 'Processing...' : 'Deposit'}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'withdraw' && (
              <form onSubmit={handleWithdraw}>
                <h6><i className="bi bi-cash-stack me-2"></i>Withdraw Funds</h6>
                <div className="mb-2">
                  <label className="form-label small">Amount (NGN)</label>
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    max={balance}
                    className="form-control form-control-sm"
                    placeholder="Minimum ₦1,000"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    required
                  />
                  <small className="text-muted">Available: {formatCurrency(balance)}</small>
                </div>
                <div className="mb-2">
                  <label className="form-label small">Bank Account (Last 4 digits)</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="****"
                    maxLength={4}
                    value={withdrawBank}
                    onChange={e => setWithdrawBank(e.target.value)}
                  />
                </div>
                <div className="alert alert-warning py-2 small mb-2">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Withdrawals may take 1-3 business days
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-danger btn-sm" disabled={processing}>
                    {processing ? 'Processing...' : 'Withdraw'}
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveModal(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Transactions List */}
        <h6 className="border-bottom pb-2">Recent Transactions</h6>
        {loading && transactions.length === 0 ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-muted text-center py-3">
            <i className="bi bi-inbox fs-4 d-block mb-2"></i>
            <small>No transactions yet</small>
          </p>
        ) : (
          <div className="list-group list-group-flush">
            {transactions.slice(0, 5).map(tx => (
              <div key={tx.id} className="list-group-item px-0 py-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div className="d-flex align-items-start gap-2">
                    <i className={`${getTypeIcon(tx.type)} fs-5`}></i>
                    <div>
                      <div className="fw-semibold small">
                        {tx.description || tx.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                      {tx.tx_hash && (
                        <code className="small text-muted d-block">{tx.tx_hash.slice(0, 12)}...</code>
                      )}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className={`fw-bold ${isCredit(tx.type) ? 'text-success' : 'text-danger'}`}>
                      {isCredit(tx.type) ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                    <span className={`badge bg-${tx.status === 'completed' ? getTypeBadge(tx.type) : tx.status === 'pending' ? 'warning' : 'danger'} small`}>
                      {tx.status}
                    </span>
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

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

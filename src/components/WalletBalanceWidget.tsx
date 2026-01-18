import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { WalletAPI, WalletData, WalletTransaction, WalletStats } from '../services/api';

interface WalletBalanceWidgetProps {
  className?: string;
  showActions?: boolean;
}

export const WalletBalanceWidget: React.FC<WalletBalanceWidgetProps> = ({
  className = '',
  showActions = true
}) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Action modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadWallet = useCallback(async () => {
    try {
      setError(null);

      // Load wallet and stats in parallel
      const [walletResponse, statsResponse] = await Promise.allSettled([
        WalletAPI.getMyWallet(),
        WalletAPI.getStats()
      ]);

      if (walletResponse.status === 'fulfilled') {
        setWallet(walletResponse.value.wallet);
        if (walletResponse.value.recent_transactions) {
          setRecentTransactions(walletResponse.value.recent_transactions);
        }
      } else {
        // Wallet not found - not an error, user just doesn't have one
        if ((walletResponse.reason as any)?.status === 404) {
          setError('no_wallet');
        } else {
          throw walletResponse.reason;
        }
      }

      if (statsResponse.status === 'fulfilled' && statsResponse.value.stats) {
        setStats(statsResponse.value.stats);
      }
    } catch (err: any) {
      console.error('Error loading wallet:', err);
      if (err?.status === 404 || err?.message?.includes('not found')) {
        setError('no_wallet');
      } else {
        setError('Failed to load wallet');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!processing) {
        loadWallet();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadWallet, processing]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  const emitToast = (type: string, title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('app:toast', {
      detail: { type, title, message }
    }));
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (amount < 1000) {
      emitToast('danger', 'Invalid Amount', 'Minimum deposit is ₦1,000');
      return;
    }

    try {
      setProcessing(true);
      await WalletAPI.deposit(amount, 'bank_transfer');
      emitToast('success', 'Deposit Successful', `₦${amount.toLocaleString()} added to your wallet`);
      setShowDepositModal(false);
      setDepositAmount('');
      await loadWallet();
    } catch (err: any) {
      emitToast('danger', 'Deposit Failed', err.message || 'Unable to process deposit');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (amount < 1000) {
      emitToast('danger', 'Invalid Amount', 'Minimum withdrawal is ₦1,000');
      return;
    }
    if (wallet && amount > wallet.balance) {
      emitToast('danger', 'Insufficient Balance', 'You do not have enough funds');
      return;
    }

    try {
      setProcessing(true);
      await WalletAPI.withdraw(amount);
      emitToast('success', 'Withdrawal Initiated', `₦${amount.toLocaleString()} withdrawal processing`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      await loadWallet();
    } catch (err: any) {
      emitToast('danger', 'Withdrawal Failed', err.message || 'Unable to process withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return `₦${(amount || 0).toLocaleString()}`;
  };

  const getTransactionIcon = (type: string) => {
    if (['deposit', 'transfer_in', 'payout_received'].includes(type)) {
      return <ArrowDownLeft className="text-success" size={16} />;
    }
    return <ArrowUpRight className="text-danger" size={16} />;
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-center py-4">
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="text-muted">Loading wallet...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'no_wallet' || !wallet) {
    return (
      <div className={`card border-secondary ${className}`}>
        <div className="card-body">
          <div className="d-flex align-items-center">
            <Wallet className="text-secondary me-3" size={32} />
            <div className="flex-grow-1">
              <h6 className="text-muted mb-1">Wallet Not Available</h6>
              <small className="text-muted">Please create a wallet to start</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card border-danger ${className}`}>
        <div className="card-body">
          <div className="d-flex align-items-center">
            <Wallet className="text-danger me-3" size={32} />
            <div className="flex-grow-1">
              <h6 className="text-danger mb-1">Error Loading Wallet</h6>
              <small className="text-muted">{error}</small>
            </div>
            <button className="btn btn-sm btn-outline-primary" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-body">
        {/* Header with Balance */}
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
              <Wallet className="text-primary" size={24} />
            </div>
            <div>
              <small className="text-muted d-block">Available Balance</small>
              <h4 className="mb-0 fw-bold">{formatCurrency(wallet.balance)}</h4>
            </div>
          </div>
          <button
            className="btn btn-link btn-sm p-0 text-primary"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh balance"
          >
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          </button>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="row g-2 mb-3">
            <div className="col-6">
              <div className="bg-success bg-opacity-10 rounded p-2 text-center">
                <small className="text-muted d-block">This Month In</small>
                <span className="text-success fw-bold small">{formatCurrency(stats.monthly_income)}</span>
              </div>
            </div>
            <div className="col-6">
              <div className="bg-danger bg-opacity-10 rounded p-2 text-center">
                <small className="text-muted d-block">This Month Out</small>
                <span className="text-danger fw-bold small">{formatCurrency(stats.monthly_expense)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Wallet Address */}
        <div className="d-flex justify-content-between align-items-center py-2 border-top border-bottom mb-3">
          <div>
            <small className="text-muted d-block">Wallet Address</small>
            <code className="small">{wallet.wallet_address.slice(0, 10)}...{wallet.wallet_address.slice(-6)}</code>
          </div>
          <span className={`badge bg-${wallet.status === 'active' ? 'success' : 'warning'}`}>
            {wallet.status}
          </span>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="d-flex gap-2 mb-3">
            <button
              className="btn btn-success btn-sm flex-fill"
              onClick={() => setShowDepositModal(true)}
            >
              <ArrowDownLeft size={14} className="me-1" />
              Deposit
            </button>
            <button
              className="btn btn-outline-danger btn-sm flex-fill"
              onClick={() => setShowWithdrawModal(true)}
              disabled={wallet.balance < 1000}
            >
              <ArrowUpRight size={14} className="me-1" />
              Withdraw
            </button>
          </div>
        )}

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div>
            <small className="text-muted fw-bold d-block mb-2">Recent Activity</small>
            <div className="list-group list-group-flush">
              {recentTransactions.slice(0, 3).map(tx => (
                <div key={tx.id} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    {getTransactionIcon(tx.type)}
                    <div>
                      <small className="d-block">{tx.description || tx.type.replace(/_/g, ' ')}</small>
                      <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                        {new Date(tx.created_at).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                  <span className={`small fw-bold ${['deposit', 'transfer_in', 'payout_received'].includes(tx.type) ? 'text-success' : 'text-danger'}`}>
                    {['deposit', 'transfer_in', 'payout_received'].includes(tx.type) ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {wallet.balance === 0 && recentTransactions.length === 0 && (
          <div className="alert alert-info alert-sm mb-0 py-2">
            <small>
              <strong>Tip:</strong> Fund your wallet to start investing and receiving returns
            </small>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Deposit Funds</h6>
                <button type="button" className="btn-close" onClick={() => setShowDepositModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small">Amount (NGN)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Minimum ₦1,000"
                    min="1000"
                    step="1000"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                  />
                </div>
                <div className="alert alert-info py-2 small">
                  <i className="bi bi-info-circle me-1"></i>
                  Demo mode: Deposits are simulated instantly
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowDepositModal(false)}>Cancel</button>
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleDeposit}
                  disabled={processing || !depositAmount || parseFloat(depositAmount) < 1000}
                >
                  {processing ? 'Processing...' : 'Deposit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Withdraw Funds</h6>
                <button type="button" className="btn-close" onClick={() => setShowWithdrawModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small">Amount (NGN)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Minimum ₦1,000"
                    min="1000"
                    max={wallet.balance}
                    step="1000"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                  />
                  <small className="text-muted">Available: {formatCurrency(wallet.balance)}</small>
                </div>
                <div className="alert alert-warning py-2 small">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Withdrawals may take 1-3 business days
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary btn-sm" onClick={() => setShowWithdrawModal(false)}>Cancel</button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleWithdraw}
                  disabled={processing || !withdrawAmount || parseFloat(withdrawAmount) < 1000 || parseFloat(withdrawAmount) > wallet.balance}
                >
                  {processing ? 'Processing...' : 'Withdraw'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default WalletBalanceWidget;

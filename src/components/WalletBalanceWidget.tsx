import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCw } from 'lucide-react';
import { getUserWallet, WalletInfoResponse } from '../services/trovotechService';

interface WalletBalanceWidgetProps {
  className?: string;
}

export const WalletBalanceWidget: React.FC<WalletBalanceWidgetProps> = ({ className = '' }) => {
  const [wallet, setWallet] = useState<WalletInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setError(null);
      const walletData = await getUserWallet();
      setWallet(walletData);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('No wallet found');
      } else {
        setError('Failed to load wallet');
      }
      console.error('Error loading wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  const formatBalance = (balance: number): string => {
    const safeBalance = Number(balance) || 0;
    if (safeBalance === 0) return '0.00';
    if (safeBalance < 0.01) return safeBalance.toFixed(7);
    return safeBalance.toFixed(2);
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

  if (error || !wallet) {
    return (
      <div className={`card border-secondary ${className}`}>
        <div className="card-body">
          <div className="d-flex align-items-center">
            <Wallet className="text-secondary me-3" size={32} />
            <div className="flex-grow-1">
              <h6 className="text-muted mb-1">Wallet Not Available</h6>
              <small className="text-muted">{error || 'Please complete wallet setup'}</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const balance = wallet?.wallet?.balance ?? 0;

  return (
    <div className={`card ${className}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
              <Wallet className="text-primary" size={24} />
            </div>
            <div>
              <small className="text-muted d-block">Wallet Balance</small>
              <h4 className="mb-0">{formatBalance(balance)} XLM</h4>
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

        <div className="d-flex justify-content-between align-items-center pt-3 border-top">
          <div>
            <small className="text-muted d-block">Address</small>
            <code className="small">{wallet.wallet.address_short}</code>
          </div>
          {wallet.wallet.trovotech_username && (
            <div className="text-end">
              <small className="text-muted d-block">Username</small>
              <span className="badge bg-primary">{wallet.wallet.trovotech_username}</span>
            </div>
          )}
        </div>

        {balance === 0 && (
          <div className="alert alert-info alert-sm mt-3 mb-0 py-2">
            <small>
              <strong>Tip:</strong> Fund your wallet to start receiving investment returns
            </small>
          </div>
        )}
      </div>

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

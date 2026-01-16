import React, { useState, useEffect } from 'react';
import { WalletAPI } from '../services/api';

interface Wallet {
  wallet_address: string;
  status: string;
  created_at?: string;
}

interface WalletSectionProps {
  userId: number;
  onWalletCreated?: (wallet: Wallet) => void;
}

export const WalletSection: React.FC<WalletSectionProps> = ({ userId, onWalletCreated }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWallet();
  }, [userId]);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const response = await WalletAPI.getBalance();
      // Map response to Wallet interface
      if (response.data.balance) {
        setWallet({
          wallet_address: response.data.address,
          status: 'active',
          created_at: new Date().toISOString() // Mock since controller doesn't return created_at yet
        });
      }
    } catch (err: any) {
      // No wallet found is not an error
      if (err.response?.status === 404) {
        setWallet(null);
      } else {
        console.error('Error loading wallet:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setCreating(true);
      setError('');
      const response = await WalletAPI.createWallet();
      setWallet({
        wallet_address: response.data.wallet.address,
        status: 'active',
        created_at: response.data.wallet.created_at
      });
      onWalletCreated?.(response.data.wallet);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create wallet');
    } finally {
      setCreating(false);
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show toast or temporary success message
      const btn = document.getElementById('copy-btn');
      if (btn) {
        btn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
        setTimeout(() => {
          btn.innerHTML = '<i class="bi bi-clipboard"></i> Copy';
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading wallet...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-bottom">
        <h5 className="mb-0 fw-bold">
          <i className="bi bi-wallet2 me-2 text-primary"></i>
          TrovoTech Wallet
        </h5>
      </div>
      <div className="card-body">
        {!wallet ? (
          // No wallet - show creation
          <div className="text-center py-4">
            <div className="mb-4">
              <i className="bi bi-wallet2 text-muted" style={{ fontSize: '4rem' }}></i>
            </div>
            <h6 className="fw-bold mb-2">No Wallet Found</h6>
            <p className="text-muted mb-4">
              Create a TrovoTech wallet to start investing in tokenized assets
            </p>

            {error && (
              <div className="alert alert-danger mb-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleCreateWallet}
              disabled={creating}
            >
              {creating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating Wallet...
                </>
              ) : (
                <>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Wallet
                </>
              )}
            </button>

            <div className="mt-4 p-3 bg-light rounded">
              <small className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Your wallet will be created on the Bantu blockchain testnet and secured by TrovoTech's custody solution.
              </small>
            </div>
          </div>
        ) : (
          // Wallet exists - show details
          <div>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <small className="text-muted d-block">Wallet Address</small>
                <div className="d-flex align-items-center gap-2">
                  <code className="fs-6">{truncateAddress(wallet.wallet_address)}</code>
                  <button
                    id="copy-btn"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => copyToClipboard(wallet.wallet_address)}
                  >
                    <i className="bi bi-clipboard"></i> Copy
                  </button>
                </div>
              </div>
              <span className={`badge ${wallet.status === 'active' ? 'bg-success' : 'bg-warning'} fs-6 px-3 py-2`}>
                {wallet.status}
              </span>
            </div>

            <div className="border-top pt-3">
              <div className="row g-3">
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Network</small>
                  <strong>Bantu Testnet</strong>
                </div>
                <div className="col-md-6">
                  <small className="text-muted d-block mb-1">Provider</small>
                  <strong>TrovoTech</strong>
                </div>
                {wallet.created_at && (
                  <div className="col-12">
                    <small className="text-muted d-block mb-1">Created</small>
                    <strong>{new Date(wallet.created_at).toLocaleDateString()}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="alert alert-info border-0 mt-3 mb-0">
              <i className="bi bi-shield-check me-2"></i>
              <small>
                Your wallet is secured by TrovoTech's SEC-compliant custody solution.
                All transactions are recorded on the blockchain.
              </small>
            </div>

            <div className="mt-3">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={loadWallet}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletSection;

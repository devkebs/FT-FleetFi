import React, { useState, useEffect } from 'react';
import { Asset, Token, Payout } from '../types';
import { createWallet, getWallet, mintAssetToken, getMyTokens, WalletResponse, TokenMintResponse } from '../services/trovotech';
import { fetchRevenueSummary, RevenueBreakdown as RevenueBreakdownType } from '../services/api';
import { PortfolioSummary } from '../components/PortfolioSummary';
import { PortfolioPerformance } from '../components/PortfolioPerformance';
import { TransactionHistory } from '../components/TransactionHistory';
import { PayoutHistory } from '../components/PayoutHistory';
import { RoleCapabilities } from '../components/RoleCapabilities';
import { WalletWidget } from '../components/WalletWidget';
import { InvestmentWizard } from '../components/InvestmentWizard';
import RevenueBreakdown from '../components/RevenueBreakdown';
import { trackEvent, trackMilestone } from '../services/analytics';

interface InvestorDashboardProps {
  assets: Asset[];
  tokens: Token[];
  payouts: Payout[];
  kycStatus?: 'pending' | 'submitted' | 'verified' | 'rejected';
  onOpenKyc?: () => void;
}

export const InvestorDashboard: React.FC<InvestorDashboardProps> = ({ 
  assets, 
  tokens, 
  payouts,
  kycStatus = 'pending',
  onOpenKyc
}) => {
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [myTokens, setMyTokens] = useState<TokenMintResponse[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueBreakdownType | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Load wallet and tokens on mount
  useEffect(() => {
    const initDashboard = async () => {
      try {
        await Promise.all([loadWallet(), loadMyTokens(), loadRevenue()]);
      } catch (e: any) {
        console.error('Dashboard init error:', e);
        // Check if it's an auth error (401)
        if (e?.status === 401) {
          setAuthError(true);
        }
      } finally {
        setInitialLoading(false);
      }
    };
    initDashboard();
  }, []);

  const loadWallet = async () => {
    try {
      const w = await getWallet();
      setWallet(w);
    } catch (e) {
      console.log('No wallet yet:', e);
    }
  };

  const loadMyTokens = async () => {
    try {
      const t = await getMyTokens();
      setMyTokens(t);
    } catch (e) {
      console.warn('Failed to load tokens:', e);
    }
  };

  const loadRevenue = async () => {
    try {
      setLoadingRevenue(true);
      const data = await fetchRevenueSummary();
      setRevenueData(data);
    } catch (e) {
      console.warn('Failed to load revenue summary:', e);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const handleCreateWallet = async () => {
    try {
      setLoadingWallet(true);
      
      // Track wallet creation attempt
      trackEvent('wallet_creation_initiated', {});
      
      const w = await createWallet();
      setWallet(w);
      
      // Track successful wallet creation
      trackEvent('wallet_created', { wallet_address: w.walletAddress });
      trackMilestone('wallet_created', { wallet_address: w.walletAddress });
      
      window.dispatchEvent(new CustomEvent('app:toast', { 
        detail: { type: 'success', title: 'Wallet Created', message: `Your wallet address: ${w.walletAddress.slice(0,12)}...` } 
      }));
    } catch (err) {
      // Track wallet creation failure
      trackEvent('wallet_creation_failed', { error: (err as any).message });
      
      window.dispatchEvent(new CustomEvent('app:toast', { 
        detail: { type: 'danger', title: 'Wallet Creation Failed', message: (err as any).message } 
      }));
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleInvestClick = (asset: Asset) => {
    if (!wallet) {
      window.dispatchEvent(new CustomEvent('app:toast', { 
        detail: { type: 'warning', title: 'Wallet Required', message: 'Please create a wallet first' } 
      }));
      return;
    }
    if (kycStatus !== 'verified') {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'warning', title: 'KYC Required', message: 'You must complete KYC verification before investing.' }
      }));
      onOpenKyc?.();
      return;
    }
    // Determine remaining ownership capacity (requires backend extended fields)
    const remaining = (asset as any).ownership_remaining ?? 100;
    if (remaining <= 0) {
      window.dispatchEvent(new CustomEvent('app:toast', {
        detail: { type: 'info', title: 'Fully Allocated', message: 'Ownership for this asset is fully sold out.' }
      }));
      return;
    }
    setSelectedAsset(asset as Asset);
    setShowInvestModal(true);
  };

  const handleMintToken = async (params: { fractionOwned: number; investAmount: number }) => {
    if (!selectedAsset || !wallet) return;
    
    // Track investment attempt
    trackEvent('investment_initiated', { 
      asset_id: selectedAsset.id, 
      asset_type: selectedAsset.type,
      fraction_owned: params.fractionOwned,
      invest_amount: params.investAmount 
    });
    
    const token = await mintAssetToken({
      assetId: selectedAsset.id,
      assetType: selectedAsset.type as any,
      fractionOwned: params.fractionOwned,
      investAmount: params.investAmount,
      investorWallet: wallet.walletAddress,
    });
    
    // Track successful investment
    trackEvent('investment_completed', { 
      asset_id: selectedAsset.id, 
      token_id: token.tokenId,
      fraction_owned: params.fractionOwned,
      invest_amount: params.investAmount 
    });
    
    // Track first investment milestone
    trackMilestone('first_investment', { 
      asset_id: selectedAsset.id,
      amount: params.investAmount 
    });
    
    window.dispatchEvent(new CustomEvent('app:toast', { 
      detail: { type: 'success', title: 'Token Minted!', message: `Successfully purchased ${params.fractionOwned}% of ${selectedAsset.model}` } 
    }));
    
    await loadMyTokens();
  };

  // Calculate metrics
  const totalInvestment = myTokens.reduce((sum, token) => sum + (token.investAmount || 0), 0);
  const totalPayoutsReceived = (payouts || []).reduce((sum, payout) => sum + (payout.investorShare || 0), 0);

  // Get available assets for investment
  const availableAssets = (assets || []).filter(asset => 
    !myTokens.some(token => token.assetId === asset.id)
  );

  const kycGateMessage = kycStatus === 'pending' ? 'KYC required before investing.'
    : kycStatus === 'submitted' ? 'KYC under review. Investing temporarily disabled.'
    : kycStatus === 'rejected' ? 'KYC rejected. Please resubmit to continue.'
    : null;

  const investmentDisabled = kycStatus !== 'verified';

  // Handle authentication error - redirect to login
  if (authError) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="alert alert-warning border-0 shadow-sm">
          <h5><i className="bi bi-exclamation-triangle me-2"></i>Session Expired</h5>
          <p className="mb-3">Your session has expired. Please login again to continue.</p>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              // Clear any stored data
              localStorage.removeItem('auth_token');
              sessionStorage.removeItem('auth_token');
              // Reload to trigger app auth check
              window.location.href = '/';
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="container-fluid py-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h1 className="h2 fw-bold mb-1">Investor Dashboard</h1>
            <p className="text-muted mb-0">Manage your tokenized EV investments</p>
          </div>
        {!wallet && (
          <button className="btn btn-success btn-lg" onClick={handleCreateWallet} disabled={loadingWallet}>
            <i className="bi bi-wallet2 me-2"></i>
            {loadingWallet ? 'Creating...' : 'Create Wallet'}
          </button>
        )}
      </div>

      {/* Wallet Info Card */}
      {wallet && (
        <div className="card shadow-sm mb-4 border-0">
          <div className="card-body bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="row align-items-center text-white">
              <div className="col-md-8">
                <h5 className="mb-2"><i className="bi bi-wallet2 me-2"></i>My Wallet</h5>
                <p className="mb-1 font-monospace small">{wallet.walletAddress}</p>
                <p className="mb-0 small opacity-75">Trustee Ref: {wallet.trusteeRef || 'Pending'}</p>
              </div>
              <div className="col-md-4 text-md-end mt-3 mt-md-0">
                <div className="badge bg-light text-dark fs-5 px-3 py-2">
                  Balance: ₦{(wallet.balance || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Capabilities */}
      <RoleCapabilities />

      {/* Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body bg-success text-white">
              <h6 className="text-white-50 mb-2">Total Investment</h6>
              <h3 className="fw-bold mb-0">₦{(totalInvestment || 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body bg-primary text-white">
              <h6 className="text-white-50 mb-2">My Tokens</h6>
              <h3 className="fw-bold mb-0">{myTokens.length || 0}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body bg-info text-white">
              <h6 className="text-white-50 mb-2">Total Payouts</h6>
              <h3 className="fw-bold mb-0">₦{(totalPayoutsReceived || 0).toLocaleString()}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body bg-warning text-white">
              <h6 className="text-white-50 mb-2">Avg ROI</h6>
              <h3 className="fw-bold mb-0">{totalInvestment > 0 ? ((totalPayoutsReceived / totalInvestment) * 100).toFixed(1) : '0'}%</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Widget & KYC Enforcement */}
      <div className="row g-3 mb-4">
        {wallet && (
          <div className="col-lg-6">
            <WalletWidget 
              userId={(wallet as any).userId || 1} 
              walletAddress={wallet.walletAddress}
              balance={wallet.balance || 0}
              onRefresh={loadWallet}
            />
          </div>
        )}
        <div className={wallet ? 'col-lg-6' : 'col-12'}>
          {investmentDisabled && (
            <div className="alert alert-warning border-0 shadow-sm h-100 d-flex align-items-center">
              <div className="d-flex align-items-start w-100">
                <i className="bi bi-shield-exclamation fs-3 me-3"></i>
                <div className="flex-grow-1">
                  <h5 className="mb-2">Identity Verification Required</h5>
                  <p className="mb-2 small">{kycGateMessage}</p>
                  {kycStatus === 'pending' && (
                    <button className="btn btn-sm btn-primary" onClick={onOpenKyc}>Complete KYC Now</button>
                  )}
                  {kycStatus === 'rejected' && (
                    <button className="btn btn-sm btn-danger" onClick={onOpenKyc}>Resubmit KYC</button>
                  )}
                  {kycStatus === 'submitted' && (
                    <span className="badge bg-info">Review in progress</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Summary */}
      {wallet && myTokens.length > 0 && (
        <div className="mb-4">
          <PortfolioSummary />
        </div>
      )}

      {/* Portfolio Performance */}
      {wallet && myTokens.length > 0 && (
        <div className="mb-4">
          <PortfolioPerformance />
        </div>
      )}

      {/* Revenue Allocation Breakdown */}
      <div className="mb-4">
        <RevenueBreakdown data={revenueData} loading={loadingRevenue} />
      </div>

      {/* Transaction History */}
      {wallet && (
        <div className="mb-4">
          <TransactionHistory walletAddress={wallet.walletAddress} />
        </div>
      )}

      {/* Available Assets for Investment */}
      {availableAssets.length > 0 && (
        <div className="card shadow-sm mb-4 border-0">
          <div className="card-header bg-white border-bottom">
            <h5 className="mb-0"><i className="bi bi-shop me-2 text-success"></i>Available for Investment</h5>
          </div>
          <div className="card-body">
            {!wallet && (
              <div className="alert alert-info mb-3">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Create a wallet to start investing!</strong> Click the "Create Wallet" button above to get started.
              </div>
            )}
            <div className="row g-3">
              {availableAssets.slice(0, 6).map(asset => (
                <div className="col-md-4" key={asset.id}>
                  <div className="card h-100 border">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-secondary">{asset.type}</span>
                        <span className={`badge ${asset.status === 'Available' ? 'bg-success' : 'bg-warning'}`}>
                          {asset.status}
                        </span>
                      </div>
                      <h6 className="fw-bold">{asset.model}</h6>
                      <p className="small text-muted mb-2">ID: {asset.id}</p>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="small">SOH: <span className="fw-bold text-success">{asset.soh}%</span></span>
                        <span className="small">Swaps: {asset.swaps}</span>
                      </div>
                      <div className="position-relative">
                        <button
                          className="btn btn-success btn-sm w-100"
                          onClick={() => handleInvestClick(asset)}
                          disabled={investmentDisabled}
                        >
                          <i className="bi bi-cart-plus me-1"></i>
                          {investmentDisabled ? 'KYC Needed' : 'Invest Now'}
                        </button>
                        {investmentDisabled && (
                          <div className="small text-muted mt-2">
                            {kycStatus === 'pending' && 'Complete KYC to invest.'}
                            {kycStatus === 'submitted' && 'Awaiting verification.'}
                            {kycStatus === 'rejected' && 'KYC rejected - resubmit.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Show message when no assets available */}
      {availableAssets.length === 0 && assets.length > 0 && (
        <div className="alert alert-success border-0 shadow-sm mb-4">
          <i className="bi bi-check-circle me-2"></i>
          <strong>Great!</strong> You've already invested in all available assets. Check out your portfolio above.
        </div>
      )}

      {/* Show message when no assets exist at all */}
      {assets.length === 0 && (
        <div className="alert alert-info border-0 shadow-sm mb-4">
          <i className="bi bi-info-circle me-2"></i>
          <strong>No assets available yet.</strong> New investment opportunities will appear here once assets are added to the platform.
        </div>
      )}

      {/* My Tokenized Assets */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0"><i className="bi bi-coin me-2 text-primary"></i>My Tokenized Assets</h5>
        </div>
        <div className="card-body">
          {myTokens.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox display-1 text-muted"></i>
              <p className="text-muted mt-3">No tokens yet. Start investing to build your portfolio!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Token ID</th>
                    <th>Asset</th>
                    <th>Ownership</th>
                    <th>Investment</th>
                    <th>TX Hash</th>
                    <th>Minted</th>
                  </tr>
                </thead>
                <tbody>
                  {myTokens.map(token => {
                    const asset = assets.find(a => a.id === token.assetId);
                    return (
                      <tr key={token.tokenId}>
                        <td className="font-monospace small">{token.tokenId.slice(0, 12)}...</td>
                        <td>
                          <div className="fw-bold">{asset?.model || token.assetName}</div>
                          <small className="text-muted">{token.assetId}</small>
                        </td>
                        <td>
                          <span className="badge bg-primary">{token.fractionOwned || 0}%</span>
                        </td>
                        <td className="fw-bold text-success">₦{(token.investAmount || 0).toLocaleString()}</td>
                        <td className="font-monospace small text-muted">{token.txHash ? token.txHash.slice(0, 10) : 'N/A'}...</td>
                        <td className="small text-muted">{token.mintedAt ? new Date(token.mintedAt).toLocaleDateString() : 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payout History */}
      <div className="mb-4">
        <PayoutHistory payouts={payouts} tokens={tokens} />
      </div>

      {/* Investment Wizard */}
      {showInvestModal && selectedAsset && wallet && (
        <InvestmentWizard
          asset={selectedAsset}
          wallet={wallet}
          onComplete={handleMintToken}
          onCancel={() => setShowInvestModal(false)}
        />
      )}
    </div>
  );
};

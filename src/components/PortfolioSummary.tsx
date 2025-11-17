import React, { useEffect, useState } from 'react';
import { getStoredToken } from '../services/api';

interface ChainSummary {
  chain: string;
  count: number;
  total_investment: number;
  total_current_value: number;
  total_returns: number;
  roi_percent: number;
}

interface PortfolioToken {
  id: number;
  token_id: string;
  asset_id: number;
  asset_model: string | null;
  fraction_owned: number;
  investment_amount: number;
  current_value: number;
  total_returns: number;
  status: string;
  chain: string | null;
  minted_at: string | null;
  tx_hash: string | null;
}

interface PortfolioData {
  overall: {
    total_tokens: number;
    total_investment: number;
    total_current_value: number;
    total_returns: number;
    roi_percent: number;
  };
  by_chain: ChainSummary[];
  tokens: PortfolioToken[];
}

export const PortfolioSummary: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch('http://localhost:8000/api/tokens/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }
      const data = await response.json();
      setPortfolio(data);
    } catch (err) {
      setError((err as Error).message);
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-warning border-0 shadow-sm">
        <i className="bi bi-exclamation-triangle me-2"></i>
        <small>Unable to load portfolio data. {error}</small>
      </div>
    );
  }

  if (!portfolio || !portfolio.overall) {
    return (
      <div className="alert alert-info border-0 shadow-sm">
        <i className="bi bi-info-circle me-2"></i>
        <small>No portfolio data available yet.</small>
      </div>
    );
  }

  return (
    <div>
      {/* Overall Metrics */}
      <div className="card shadow-sm mb-4 border-0">
        <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <h5 className="mb-0"><i className="bi bi-bar-chart-line me-2"></i>Portfolio Summary</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="text-muted small">Total Tokens</span>
                <span className="fs-4 fw-bold text-primary">{portfolio.overall.total_tokens || 0}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="text-muted small">Total Investment</span>
                <span className="fs-4 fw-bold text-success">₦{(portfolio.overall.total_investment || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="text-muted small">Current Value</span>
                <span className="fs-4 fw-bold text-info">₦{(portfolio.overall.total_current_value || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="text-muted small">Total Returns</span>
                <span className="fs-4 fw-bold text-warning">₦{(portfolio.overall.total_returns || 0).toLocaleString()}</span>
                <span className={`badge ${(portfolio.overall.roi_percent || 0) >= 0 ? 'bg-success' : 'bg-danger'} mt-1`}>
                  ROI: {(portfolio.overall.roi_percent || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* By Chain Breakdown */}
      {portfolio.by_chain && portfolio.by_chain.length > 0 && (
        <div className="card shadow-sm mb-4 border-0">
          <div className="card-header bg-white border-bottom">
            <h5 className="mb-0"><i className="bi bi-diagram-3 me-2 text-primary"></i>By Blockchain</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              {portfolio.by_chain.map((chain) => (
                <div className="col-md-4" key={chain.chain}>
                  <div className="card h-100 border">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-dark text-uppercase">{chain.chain || 'Unknown'}</span>
                        <span className="badge bg-secondary">{chain.count} tokens</span>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Investment</small>
                        <div className="fw-bold">₦{(Number(chain.total_investment) || 0).toLocaleString()}</div>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Returns</small>
                        <div className="fw-bold text-success">₦{(Number(chain.total_returns) || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className={`badge ${chain.roi_percent >= 0 ? 'bg-success' : 'bg-danger'}`}>
                          ROI: {chain.roi_percent}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Token Details Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0"><i className="bi bi-list-ul me-2 text-success"></i>Token Details</h5>
        </div>
        <div className="card-body">
          {!portfolio.tokens || portfolio.tokens.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-inbox display-4 text-muted"></i>
              <p className="text-muted mt-3">No tokens in portfolio</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Token ID</th>
                    <th>Asset</th>
                    <th>Chain</th>
                    <th>Ownership</th>
                    <th>Investment</th>
                    <th>Current Value</th>
                    <th>Returns</th>
                    <th>Minted</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.tokens.map((token) => (
                    <tr key={token.id}>
                      <td className="font-monospace small">{token.token_id}</td>
                      <td>
                        <div className="fw-bold">{token.asset_model || 'N/A'}</div>
                        <small className="text-muted">Asset #{token.asset_id}</small>
                      </td>
                      <td>
                        <span className="badge bg-dark text-uppercase">{token.chain || 'N/A'}</span>
                      </td>
                      <td>
                        <span className="badge bg-primary">{token.fraction_owned}%</span>
                      </td>
                      <td className="text-success">₦{(Number(token.investment_amount) || 0).toLocaleString()}</td>
                      <td className="text-info">₦{(Number(token.current_value) || 0).toLocaleString()}</td>
                      <td className="text-warning fw-bold">₦{(Number(token.total_returns) || 0).toLocaleString()}</td>
                      <td className="small text-muted">
                        {token.minted_at ? new Date(token.minted_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

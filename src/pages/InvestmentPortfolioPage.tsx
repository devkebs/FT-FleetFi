import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface Investment {
  id: number;
  asset_id: number;
  asset_name: string;
  vehicle_registration: string;
  amount: number;
  tokens: number;
  purchase_date: string;
  current_value: number;
  total_revenue: number;
  roi_percentage: number;
  status: 'active' | 'pending' | 'completed';
}

interface PortfolioSummary {
  total_invested: number;
  total_value: number;
  total_revenue: number;
  total_roi: number;
  active_investments: number;
}

export default function InvestmentPortfolioPage() {
  const { user } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'roi'>('date');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await api.get('/investments');
      setInvestments(response.data.investments);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvestments = investments
    .filter(inv => filter === 'all' || inv.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'roi':
          return b.roi_percentage - a.roi_percentage;
        default:
          return new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime();
      }
    });

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="h3 mb-0">Investment Portfolio</h1>
          <p className="text-muted">Track your EV asset investments and returns</p>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      {summary && (
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted small mb-1">Total Invested</p>
                    <h3 className="h4 mb-0">{formatCurrency(summary.total_invested)}</h3>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-2 rounded">
                    <i className="bi bi-wallet2 text-primary fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted small mb-1">Current Value</p>
                    <h3 className="h4 mb-0">{formatCurrency(summary.total_value)}</h3>
                  </div>
                  <div className="bg-success bg-opacity-10 p-2 rounded">
                    <i className="bi bi-graph-up text-success fs-4"></i>
                  </div>
                </div>
                <small className={`badge ${summary.total_value >= summary.total_invested ? 'bg-success' : 'bg-danger'} mt-2`}>
                  {summary.total_value >= summary.total_invested ? '+' : ''}
                  {((summary.total_value - summary.total_invested) / summary.total_invested * 100).toFixed(2)}%
                </small>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted small mb-1">Total Revenue</p>
                    <h3 className="h4 mb-0">{formatCurrency(summary.total_revenue)}</h3>
                  </div>
                  <div className="bg-info bg-opacity-10 p-2 rounded">
                    <i className="bi bi-cash-stack text-info fs-4"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted small mb-1">Average ROI</p>
                    <h3 className="h4 mb-0">{summary.total_roi.toFixed(2)}%</h3>
                  </div>
                  <div className="bg-warning bg-opacity-10 p-2 rounded">
                    <i className="bi bi-percent text-warning fs-4"></i>
                  </div>
                </div>
                <small className="text-muted">{summary.active_investments} active</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Sorting */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="btn-group" role="group">
                <button 
                  className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('all')}
                >
                  All ({investments.length})
                </button>
                <button 
                  className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('active')}
                >
                  Active ({investments.filter(i => i.status === 'active').length})
                </button>
                <button 
                  className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('pending')}
                >
                  Pending ({investments.filter(i => i.status === 'pending').length})
                </button>
                <button 
                  className={`btn ${filter === 'completed' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed ({investments.filter(i => i.status === 'completed').length})
                </button>
              </div>
            </div>
            <div className="col-md-6 text-end">
              <label className="me-2">Sort by:</label>
              <select 
                className="form-select d-inline-block w-auto"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="date">Date</option>
                <option value="amount">Amount</option>
                <option value="roi">ROI</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Investments Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-4">Your Investments</h5>
          
          {filteredInvestments.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox fs-1 text-muted"></i>
              <p className="text-muted mt-3">No investments found</p>
              <a href="/marketplace" className="btn btn-primary">
                Browse Available Assets
              </a>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Vehicle</th>
                    <th>Invested</th>
                    <th>Tokens</th>
                    <th>Current Value</th>
                    <th>Revenue Earned</th>
                    <th>ROI</th>
                    <th>Purchase Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestments.map((investment) => (
                    <tr key={investment.id}>
                      <td>
                        <strong>{investment.asset_name}</strong>
                      </td>
                      <td>
                        <span className="badge bg-secondary">{investment.vehicle_registration}</span>
                      </td>
                      <td>{formatCurrency(investment.amount)}</td>
                      <td>
                        <span className="badge bg-primary">{investment.tokens} tokens</span>
                      </td>
                      <td>
                        <strong>{formatCurrency(investment.current_value)}</strong>
                        <br />
                        <small className={investment.current_value >= investment.amount ? 'text-success' : 'text-danger'}>
                          {investment.current_value >= investment.amount ? '▲' : '▼'} 
                          {' '}
                          {formatCurrency(Math.abs(investment.current_value - investment.amount))}
                        </small>
                      </td>
                      <td className="text-success">
                        <strong>{formatCurrency(investment.total_revenue)}</strong>
                      </td>
                      <td>
                        <span className={`badge ${investment.roi_percentage >= 0 ? 'bg-success' : 'bg-danger'}`}>
                          {investment.roi_percentage >= 0 ? '+' : ''}{investment.roi_percentage.toFixed(2)}%
                        </span>
                      </td>
                      <td>{formatDate(investment.purchase_date)}</td>
                      <td>
                        <span className={`badge ${
                          investment.status === 'active' ? 'bg-success' : 
                          investment.status === 'pending' ? 'bg-warning text-dark' : 
                          'bg-secondary'
                        }`}>
                          {investment.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" title="View Details">
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-outline-success" title="Download Report">
                            <i className="bi bi-download"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Performance Chart Section */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Portfolio Growth</h5>
              <div className="text-center py-4">
                <p className="text-muted">Chart coming soon...</p>
                <small className="text-muted">Historical value tracking</small>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Revenue Distribution</h5>
              <div className="text-center py-4">
                <p className="text-muted">Chart coming soon...</p>
                <small className="text-muted">Revenue by asset type</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

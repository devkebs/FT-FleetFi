import React, { useEffect, useState } from 'react';
import { getStoredToken } from '../services/api';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  tx_hash?: string;
  from_address?: string;
  to_address?: string;
}

interface TransactionHistoryProps {
  walletAddress?: string; // For future use with blockchain explorer links
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getStoredToken();
      if (!token) {
        // No token - show empty state
        setTransactions([]);
        setLoading(false);
        return;
      }

      // Get current user ID from token or auth context
      const userResponse = await fetch('http://localhost:8000/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (userResponse.status === 401) {
        // Auth error - show empty state
        setTransactions([]);
        setError('Please login to view transactions');
        return;
      }

      if (!userResponse.ok) {
        setTransactions([]);
        setError('Unable to load transactions');
        return;
      }

      const user = await userResponse.json();
      
      const response = await fetch(`http://localhost:8000/api/wallet/${user.id}/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.status === 401) {
        setTransactions([]);
        setError('Session expired');
        return;
      }

      if (!response.ok) {
        setTransactions([]);
        setError('No transactions found');
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions || data || []);
      setError(null);
    } catch (err) {
      // Handle all errors gracefully
      setTransactions([]);
      setError('Unable to load transactions');
      console.error('Transaction fetch error:', err);
      // Set empty array on error so component still renders
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTransactions = () => {
    // Ensure transactions is always an array
    const txArray = Array.isArray(transactions) ? transactions : [];
    let filtered = [...txArray]; // Create a copy to avoid mutating state
    
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.type.toLowerCase() === filter.toLowerCase());
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return b.amount - a.amount;
      }
    });

    return filtered;
  };

  const getTransactionIcon = (type: string) => {
    const typeMap: Record<string, string> = {
      'deposit': 'bi-arrow-down-circle text-success',
      'withdrawal': 'bi-arrow-up-circle text-danger',
      'investment': 'bi-cart-check text-primary',
      'payout': 'bi-cash-coin text-success',
      'transfer': 'bi-arrow-left-right text-info',
    };
    return typeMap[type.toLowerCase()] || 'bi-circle text-secondary';
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      'completed': 'bg-success',
      'pending': 'bg-warning',
      'failed': 'bg-danger',
      'processing': 'bg-info',
    };
    return statusMap[status.toLowerCase()] || 'bg-secondary';
  };

  const filteredTransactions = getFilteredTransactions();

  if (loading) {
    return (
      <div className="card shadow-sm border-0">
        <div className="card-body text-center py-4">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted small mt-2">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">
            <i className="bi bi-clock-history me-2 text-primary"></i>
            Transaction History
          </h5>
          <div className="d-flex gap-2">
            {/* Filter */}
            <select 
              className="form-select form-select-sm" 
              style={{ width: 'auto' }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="investment">Investments</option>
              <option value="payout">Payouts</option>
              <option value="transfer">Transfers</option>
            </select>
            
            {/* Sort */}
            <select 
              className="form-select form-select-sm" 
              style={{ width: 'auto' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>

            {/* Refresh */}
            <button className="btn btn-sm btn-outline-primary" onClick={fetchTransactions}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-warning border-0 mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <small>{error}</small>
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-4 text-muted"></i>
            <p className="text-muted mt-3">
              {filter === 'all' 
                ? 'No transactions yet' 
                : `No ${filter} transactions found`}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '50px' }}></th>
                  <th>Type</th>
                  <th>Description</th>
                  <th className="text-end">Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ width: '100px' }}>TX Hash</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <i className={`bi ${getTransactionIcon(tx.type)} fs-5`}></i>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark">{tx.type}</span>
                    </td>
                    <td>
                      <div>
                        <div className="fw-bold">{tx.description}</div>
                        {tx.from_address && (
                          <small className="text-muted d-block">
                            From: {tx.from_address.slice(0, 10)}...
                          </small>
                        )}
                        {tx.to_address && (
                          <small className="text-muted d-block">
                            To: {tx.to_address.slice(0, 10)}...
                          </small>
                        )}
                      </div>
                    </td>
                    <td className={`text-end fw-bold ${
                      tx.type === 'deposit' || tx.type === 'payout' ? 'text-success' : 'text-dark'
                    }`}>
                      {tx.type === 'deposit' || tx.type === 'payout' ? '+' : '-'}
                      ₦{tx.amount.toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>
                      <small className="text-muted">
                        {new Date(tx.created_at).toLocaleDateString()}
                        <br />
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </small>
                    </td>
                    <td>
                      {tx.tx_hash ? (
                        <a 
                          href={`https://polygonscan.com/tx/${tx.tx_hash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none small"
                          title={tx.tx_hash}
                        >
                          <i className="bi bi-box-arrow-up-right me-1"></i>
                          View
                        </a>
                      ) : (
                        <small className="text-muted">N/A</small>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Stats */}
        {filteredTransactions.length > 0 && (
          <div className="mt-3 p-3 bg-light rounded">
            <div className="row g-3">
              <div className="col-md-4">
                <small className="text-muted d-block">Total Transactions</small>
                <strong>{filteredTransactions.length}</strong>
              </div>
              <div className="col-md-4">
                <small className="text-muted d-block">Total Inflow</small>
                <strong className="text-success">
                  ₦{filteredTransactions
                    .filter(tx => tx.type === 'deposit' || tx.type === 'payout')
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString()}
                </strong>
              </div>
              <div className="col-md-4">
                <small className="text-muted d-block">Total Outflow</small>
                <strong className="text-danger">
                  ₦{filteredTransactions
                    .filter(tx => tx.type === 'withdrawal' || tx.type === 'investment')
                    .reduce((sum, tx) => sum + tx.amount, 0)
                    .toLocaleString()}
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

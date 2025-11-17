import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle } from 'lucide-react';

export interface Transaction {
  id: string;
  type: 'investment' | 'payout' | 'withdrawal' | 'transfer';
  asset_name?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  description: string;
  transaction_hash?: string;
}

interface InvestmentTransactionHistoryProps {
  transactions?: Transaction[];
  loading?: boolean;
  className?: string;
}

export const InvestmentTransactionHistory: React.FC<InvestmentTransactionHistoryProps> = ({ 
  transactions = [],
  loading = false,
  className = ''
}) => {
  const [filter, setFilter] = useState<'all' | Transaction['type']>('all');

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'investment':
        return <ArrowDownCircle className="text-danger" size={20} />;
      case 'payout':
      case 'withdrawal':
        return <ArrowUpCircle className="text-success" size={20} />;
      case 'transfer':
        return <ArrowUpCircle className="text-info" size={20} />;
      default:
        return <Clock className="text-secondary" size={20} />;
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="badge bg-success bg-opacity-10 text-success">
            <CheckCircle size={12} className="me-1" />
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="badge bg-warning bg-opacity-10 text-warning">
            <Clock size={12} className="me-1" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="badge bg-danger bg-opacity-10 text-danger">
            <XCircle size={12} className="me-1" />
            Failed
          </span>
        );
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number, type: Transaction['type']) => {
    const safeAmount = Number(amount) || 0;
    const prefix = type === 'investment' ? '-' : '+';
    return `${prefix}${Math.abs(safeAmount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h5 className="mb-0">Transaction History</h5>
        </div>
        <div className="card-body">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted mt-3">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Transaction History</h5>
          <div className="btn-group btn-group-sm" role="group">
            <button 
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`btn ${filter === 'investment' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('investment')}
            >
              Investments
            </button>
            <button 
              className={`btn ${filter === 'payout' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('payout')}
            >
              Payouts
            </button>
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-5">
            <Clock className="text-muted mb-3" size={48} />
            <p className="text-muted mb-0">
              {filter === 'all' ? 'No transactions yet' : `No ${filter} transactions`}
            </p>
            <small className="text-muted">
              Your transaction history will appear here
            </small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th className="text-end">Amount</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        {getTypeIcon(transaction.type)}
                        <span className="ms-2 text-capitalize small">
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="fw-medium">{transaction.description}</div>
                        {transaction.asset_name && (
                          <small className="text-muted">{transaction.asset_name}</small>
                        )}
                        {transaction.transaction_hash && (
                          <div>
                            <small className="text-muted font-monospace">
                              {transaction.transaction_hash.slice(0, 8)}...
                            </small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <small className="text-muted">
                        {formatDate(transaction.timestamp)}
                      </small>
                    </td>
                    <td className="text-end">
                      <span className={`fw-bold ${
                        transaction.type === 'investment' ? 'text-danger' : 'text-success'
                      }`}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </span>
                      <small className="text-muted ms-1">{transaction.currency}</small>
                    </td>
                    <td className="text-center">
                      {getStatusBadge(transaction.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {filteredTransactions.length > 0 && (
        <div className="card-footer text-center">
          <button className="btn btn-sm btn-link text-decoration-none">
            View All Transactions
          </button>
        </div>
      )}
    </div>
  );
};

export default InvestmentTransactionHistory;

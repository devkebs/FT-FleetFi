import React, { useState, useEffect } from 'react';
import { PayoutAPI } from '../services/api';

interface Payout {
  id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  asset_id: string;
  paid_at: string;
  transaction_hash?: string;
}

interface PayoutsSectionProps {
  userId: number;
}

export const PayoutsSection: React.FC<PayoutsSectionProps> = ({ userId }) => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadPayouts();
  }, [userId]);

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const data = await PayoutAPI.getUserPayouts(userId);
      setPayouts(data.payouts || []);
    } catch (error) {
      console.error('Failed to load payouts:', error);
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalEarnings = () => {
    return payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const calculateMonthlyEarnings = () => {
    const now = new Date();
    const thisMonth = payouts.filter(p => {
      const paidDate = new Date(p.paid_at);
      return (
        p.status === 'completed' &&
        paidDate.getMonth() === now.getMonth() &&
        paidDate.getFullYear() === now.getFullYear()
      );
    });
    return thisMonth.reduce((sum, p) => sum + p.amount, 0);
  };

  const getFilteredPayouts = () => {
    if (filterStatus === 'all') return payouts;
    return payouts.filter(p => p.status === filterStatus);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'failed': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const truncateHash = (hash?: string) => {
    if (!hash) return '-';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
  };

  const totalEarnings = calculateTotalEarnings();
  const monthlyEarnings = calculateMonthlyEarnings();
  const filteredPayouts = getFilteredPayouts();

  return (
    <div className="mb-4">
      {/* Earnings Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="text-muted mb-0">Total Earnings</h6>
                <i className="bi bi-wallet2 text-success fs-4"></i>
              </div>
              <h3 className="fw-bold mb-0 text-success">{formatCurrency(totalEarnings)}</h3>
              <small className="text-muted">All-time payouts</small>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="text-muted mb-0">This Month</h6>
                <i className="bi bi-calendar-check text-primary fs-4"></i>
              </div>
              <h3 className="fw-bold mb-0 text-primary">{formatCurrency(monthlyEarnings)}</h3>
              <small className="text-muted">
                {payouts.filter(p => {
                  const now = new Date();
                  const paidDate = new Date(p.paid_at);
                  return paidDate.getMonth() === now.getMonth() && 
                         paidDate.getFullYear() === now.getFullYear() &&
                         p.status === 'completed';
                }).length} payouts
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold">
              <i className="bi bi-cash-stack me-2 text-success"></i>
              Payout History
            </h5>
            <div className="d-flex gap-2 align-items-center">
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <button className="btn btn-sm btn-outline-primary" onClick={loadPayouts}>
                <i className="bi bi-arrow-clockwise"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading payouts...</span>
              </div>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
              <p className="text-muted mt-3 mb-0">
                {filterStatus === 'all' 
                  ? 'No payouts yet'
                  : `No ${filterStatus} payouts`}
              </p>
              <small className="text-muted">
                Payouts will appear here once returns are distributed
              </small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Asset</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id}>
                      <td>
                        <small>{formatDate(payout.paid_at)}</small>
                      </td>
                      <td>
                        <strong>{payout.asset_id}</strong>
                      </td>
                      <td>
                        <span className="fw-bold text-success">
                          {formatCurrency(payout.amount)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                      <td>
                        {payout.transaction_hash ? (
                          <code className="small">{truncateHash(payout.transaction_hash)}</code>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Stats */}
          {!loading && filteredPayouts.length > 0 && (
            <div className="border-top pt-3 mt-3">
              <div className="row g-3 text-center">
                <div className="col-md-3">
                  <small className="text-muted d-block">Total Payouts</small>
                  <strong>{payouts.length}</strong>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block">Completed</small>
                  <strong className="text-success">
                    {payouts.filter(p => p.status === 'completed').length}
                  </strong>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block">Pending</small>
                  <strong className="text-warning">
                    {payouts.filter(p => p.status === 'pending').length}
                  </strong>
                </div>
                <div className="col-md-3">
                  <small className="text-muted d-block">Failed</small>
                  <strong className="text-danger">
                    {payouts.filter(p => p.status === 'failed').length}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROI Information Card */}
      {totalEarnings > 0 && (
        <div className="card border-0 bg-light mt-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <h6 className="fw-semibold mb-2">
                  <i className="bi bi-graph-up-arrow me-2 text-success"></i>
                  Return on Investment
                </h6>
                <p className="text-muted small mb-0">
                  Your earnings are distributed proportionally based on your ownership percentage
                  in each asset. Returns are calculated from ride revenues, battery swaps, and
                  asset utilization.
                </p>
              </div>
              <div className="col-md-6">
                <h6 className="fw-semibold mb-2">
                  <i className="bi bi-info-circle me-2 text-primary"></i>
                  Payout Schedule
                </h6>
                <p className="text-muted small mb-0">
                  Operators distribute returns on a regular schedule. Payouts are recorded on the
                  blockchain for transparency. Check back regularly for new distributions.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutsSection;

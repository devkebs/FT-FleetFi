import React, { useState, useMemo } from 'react';
import { Payout, Token } from '../types';

interface PayoutHistoryProps {
  payouts?: Payout[];
  tokens?: Token[];
}

export const PayoutHistory: React.FC<PayoutHistoryProps> = ({ payouts = [], tokens = [] }) => {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Enrich payouts with token data
  const enrichedPayouts = useMemo(() => {
    if (!payouts || !tokens) return [];
    return payouts.map(payout => {
      const token = tokens.find(t => t.id === payout.tokenId);
      return {
        ...payout,
        assetId: token?.assetId,
        fractionOwned: token?.fraction ? token.fraction * 100 : 0,
      };
    });
  }, [payouts, tokens]);

  // Filter and sort payouts
  const filteredPayouts = useMemo(() => {
    let filtered = enrichedPayouts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payout => 
        payout.month?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.assetId?.toString().includes(searchTerm)
      );
    }

    // Month filter
    if (filter !== 'all') {
      filtered = filtered.filter(payout => payout.month === filter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'date') {
        const dateA = new Date(a.month || '');
        const dateB = new Date(b.month || '');
        comparison = dateB.getTime() - dateA.getTime();
      } else {
        comparison = (b.investorShare || 0) - (a.investorShare || 0);
      }

      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return filtered;
  }, [enrichedPayouts, filter, sortBy, sortOrder, searchTerm]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalPayouts = filteredPayouts.reduce((sum, p) => sum + (p.investorShare || 0), 0);
    const avgPayout = filteredPayouts.length > 0 ? totalPayouts / filteredPayouts.length : 0;
    const totalRevenue = filteredPayouts.reduce((sum, p) => sum + (p.grossRevenue || 0), 0);
    
    // Get unique months
    const uniqueMonths = Array.from(new Set(payouts.map(p => p.month).filter(Boolean)));

    return {
      totalPayouts,
      avgPayout,
      totalRevenue,
      count: filteredPayouts.length,
      months: uniqueMonths,
    };
  }, [filteredPayouts, payouts]);

  const exportToCSV = () => {
    const headers = ['Month', 'Asset ID', 'Gross Revenue', 'My Share', 'Ownership %'];
    const csvData = filteredPayouts.map(payout => [
      payout.month || 'N/A',
      payout.assetId || 'N/A',
      payout.grossRevenue || 0,
      payout.investorShare || 0,
      payout.fractionOwned ? `${payout.fractionOwned.toFixed(2)}%` : 'N/A',
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">
            <i className="bi bi-cash-stack me-2 text-success"></i>
            Detailed Payout History
          </h5>
          <button 
            className="btn btn-sm btn-success"
            onClick={exportToCSV}
            disabled={filteredPayouts.length === 0}
          >
            <i className="bi bi-download me-1"></i>
            Export CSV
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {/* Statistics Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="p-3 bg-success bg-opacity-10 rounded">
              <small className="text-muted d-block mb-1">Total Earned</small>
              <h6 className="mb-0 fw-bold text-success">₦{stats.totalPayouts.toLocaleString()}</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-primary bg-opacity-10 rounded">
              <small className="text-muted d-block mb-1">Average Payout</small>
              <h6 className="mb-0 fw-bold text-primary">₦{stats.avgPayout.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-info bg-opacity-10 rounded">
              <small className="text-muted d-block mb-1">Total Revenue</small>
              <h6 className="mb-0 fw-bold text-info">₦{stats.totalRevenue.toLocaleString()}</h6>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 bg-warning bg-opacity-10 rounded">
              <small className="text-muted d-block mb-1">Payout Count</small>
              <h6 className="mb-0 fw-bold text-warning">{stats.count}</h6>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="row g-2 mb-3">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by month, asset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select 
              className="form-select form-select-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Months</option>
              {stats.months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <select 
              className="form-select form-select-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
          </div>
          <div className="col-md-2">
            <button 
              className="btn btn-sm btn-outline-secondary w-100"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <i className={`bi bi-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
              {sortOrder === 'asc' ? ' Asc' : ' Desc'}
            </button>
          </div>
        </div>

        {/* Table */}
        {filteredPayouts.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-4 text-muted"></i>
            <p className="text-muted mt-3">
              {searchTerm || filter !== 'all' 
                ? 'No payouts match your filters' 
                : 'No payouts received yet'}
            </p>
            {(searchTerm || filter !== 'all') && (
              <button 
                className="btn btn-sm btn-outline-primary"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Period</th>
                  <th>Asset ID</th>
                  <th className="text-end">Gross Revenue</th>
                  <th className="text-end">My Share</th>
                  <th className="text-center">Ownership</th>
                  <th className="text-center">Payout %</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((payout) => {
                  const payoutPercent = payout.grossRevenue > 0 
                    ? (payout.investorShare / payout.grossRevenue * 100) 
                    : 0;

                  return (
                    <tr key={payout.payoutId}>
                      <td>
                        <div className="fw-bold">{payout.month || 'N/A'}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {payout.assetId || 'N/A'}
                        </span>
                      </td>
                      <td className="text-end">
                        <span className="text-muted">₦{payout.grossRevenue?.toLocaleString() || 0}</span>
                      </td>
                      <td className="text-end">
                        <strong className="text-success">
                          ₦{payout.investorShare?.toLocaleString() || 0}
                        </strong>
                      </td>
                      <td className="text-center">
                        <span className="badge bg-primary">
                          {payout.fractionOwned ? `${payout.fractionOwned.toFixed(2)}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="text-center">
                        <small className="text-muted">
                          {payoutPercent.toFixed(1)}%
                        </small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="table-light">
                <tr>
                  <td colSpan={2} className="text-end fw-bold">Totals:</td>
                  <td className="text-end fw-bold">
                    ₦{filteredPayouts.reduce((sum, p) => sum + (p.grossRevenue || 0), 0).toLocaleString()}
                  </td>
                  <td className="text-end fw-bold text-success">
                    ₦{filteredPayouts.reduce((sum, p) => sum + (p.investorShare || 0), 0).toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Monthly Breakdown Chart (Simple) */}
        {filteredPayouts.length > 0 && stats.months.length > 1 && (
          <div className="mt-4">
            <h6 className="mb-3">
              <i className="bi bi-bar-chart me-2"></i>
              Monthly Earnings Trend
            </h6>
            <div className="row g-2">
              {stats.months.slice(0, 12).map(month => {
                const monthPayouts = filteredPayouts.filter(p => p.month === month);
                const monthTotal = monthPayouts.reduce((sum, p) => sum + (p.investorShare || 0), 0);
                const maxPayout = Math.max(...stats.months.map(m => 
                  filteredPayouts.filter(p => p.month === m).reduce((sum, p) => sum + (p.investorShare || 0), 0)
                ));
                const barHeight = maxPayout > 0 ? (monthTotal / maxPayout * 100) : 0;

                return (
                  <div key={month} className="col" style={{ minWidth: '80px' }}>
                    <div className="text-center">
                      <div 
                        className="bg-success rounded-top mx-auto"
                        style={{ 
                          width: '40px', 
                          height: `${Math.max(barHeight, 5)}px`,
                          minHeight: '20px',
                          maxHeight: '150px'
                        }}
                        title={`₦${monthTotal.toLocaleString()}`}
                      ></div>
                      <small className="text-muted d-block mt-2" style={{ fontSize: '0.7rem' }}>
                        {month.split('-')[1]}/{month.split('-')[0].slice(2)}
                      </small>
                      <small className="fw-bold d-block" style={{ fontSize: '0.7rem' }}>
                        ₦{(monthTotal / 1000).toFixed(0)}k
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

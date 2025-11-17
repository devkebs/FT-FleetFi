import React, { useState, memo } from 'react';

interface RevenueMetrics {
  totalRides: number;
  totalSwaps: number;
  grossRevenue: number;
  vehicleNetRevenue: number;
  swapRevenue: number;
}

const DualRevenueBreakdownComponent: React.FC<{ metrics?: RevenueMetrics }> = ({ 
  metrics = {
    totalRides: 0,
    totalSwaps: 0,
    grossRevenue: 0,
    vehicleNetRevenue: 0,
    swapRevenue: 0
  }
}) => {
  const [activeTab, setActiveTab] = useState<'vehicle' | 'swap'>('vehicle');

  // Vehicle Revenue Breakdown (EKT Layer)
  const vehicleBreakdown = {
    grossPerCycle: 11000,
    swapFeeDeduction: 3500,
    netRevenue: 7500,
    distribution: [
      { stakeholder: 'Investor (EKT Holders)', percentage: 50, amount: 3750, color: 'success', icon: 'bi-wallet2' },
      { stakeholder: 'Rider Earnings', percentage: 25, amount: 1875, color: 'primary', icon: 'bi-person-badge' },
      { stakeholder: 'FT Management', percentage: 20, amount: 1500, color: 'info', icon: 'bi-building' },
      { stakeholder: 'Reserve Fund', percentage: 5, amount: 375, color: 'warning', icon: 'bi-shield-check' }
    ]
  };

  // Swap Station Revenue Breakdown (SST Layer)
  const swapBreakdown = {
    swapFee: 3500,
    distribution: [
      { stakeholder: 'SST Investors', percentage: 60, amount: 2100, color: 'success', icon: 'bi-lightning-charge' },
      { stakeholder: 'FT Operations', percentage: 25, amount: 875, color: 'info', icon: 'bi-gear' },
      { stakeholder: 'Energy Provider', percentage: 10, amount: 350, color: 'warning', icon: 'bi-sun' },
      { stakeholder: 'Rider Loyalty Pool', percentage: 5, amount: 175, color: 'primary', icon: 'bi-gift' }
    ]
  };

  // Calculate actual distributions based on metrics
  const actualVehicleDistribution = vehicleBreakdown.distribution.map(item => ({
    ...item,
    actualAmount: metrics.vehicleNetRevenue * (item.percentage / 100)
  }));

  const actualSwapDistribution = swapBreakdown.distribution.map(item => ({
    ...item,
    actualAmount: metrics.swapRevenue * (item.percentage / 100)
  }));

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white border-bottom">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-diagram-3 me-2 text-primary"></i>
            Dual Revenue Framework (FRF)
          </h5>
          <span className="badge bg-primary">Bantu Blockchain</span>
        </div>
        <p className="text-muted small mb-0 mt-2">
          Two synchronized revenue layers: Vehicle Ownership (EKT) + Swap Infrastructure (SST)
        </p>
      </div>

      <div className="card-body">
        {/* Tab Navigation */}
        <ul className="nav nav-pills mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'vehicle' ? 'active' : ''}`}
              onClick={() => setActiveTab('vehicle')}
              type="button"
            >
              <i className="bi bi-ev-front me-2"></i>
              Vehicle Revenue (EKT)
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === 'swap' ? 'active' : ''}`}
              onClick={() => setActiveTab('swap')}
              type="button"
            >
              <i className="bi bi-lightning-charge me-2"></i>
              Swap Station (SST)
            </button>
          </li>
        </ul>

        {/* Vehicle Revenue Tab */}
        {activeTab === 'vehicle' && (
          <div>
            {/* Revenue Flow */}
            <div className="alert alert-info border-0 mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="text-center flex-fill">
                  <small className="text-muted d-block">Gross Revenue</small>
                  <h5 className="mb-0 fw-bold">₦{vehicleBreakdown.grossPerCycle.toLocaleString()}</h5>
                  <small className="text-muted">per ride cycle</small>
                </div>
                <i className="bi bi-arrow-right fs-3 text-muted mx-3"></i>
                <div className="text-center flex-fill">
                  <small className="text-muted d-block">Swap Fee Deduction</small>
                  <h5 className="mb-0 fw-bold text-danger">-₦{vehicleBreakdown.swapFeeDeduction.toLocaleString()}</h5>
                  <small className="text-muted">paid to SST</small>
                </div>
                <i className="bi bi-arrow-right fs-3 text-muted mx-3"></i>
                <div className="text-center flex-fill">
                  <small className="text-muted d-block">Net Revenue</small>
                  <h5 className="mb-0 fw-bold text-success">₦{vehicleBreakdown.netRevenue.toLocaleString()}</h5>
                  <small className="text-muted">distributable</small>
                </div>
              </div>
            </div>

            {/* Distribution Table */}
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Stakeholder</th>
                    <th className="text-center">Share %</th>
                    <th className="text-end">Per Cycle (₦)</th>
                    <th className="text-end">Total Earned (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {actualVehicleDistribution.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <i className={`${item.icon} me-2 text-${item.color}`}></i>
                        <strong>{item.stakeholder}</strong>
                      </td>
                      <td className="text-center">
                        <span className={`badge bg-${item.color} bg-opacity-10 text-${item.color}`}>
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="text-end">₦{item.amount.toLocaleString()}</td>
                      <td className="text-end">
                        <strong>₦{item.actualAmount.toLocaleString()}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td colSpan={2}>TOTAL NET REVENUE</td>
                    <td className="text-end">₦{vehicleBreakdown.netRevenue.toLocaleString()}</td>
                    <td className="text-end">₦{metrics.vehicleNetRevenue.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Smart Contract Info */}
            <div className="alert alert-secondary border-0 mb-0">
              <small>
                <i className="bi bi-file-code me-2"></i>
                <strong>Smart Contract:</strong> <code>distributeRideRevenue()</code>
                <br />
                <i className="bi bi-clock-history me-2 ms-0"></i>
                <strong>Token Lifecycle:</strong> EKT (3-year term) → UST minted per ride → Burned post-payout
              </small>
            </div>
          </div>
        )}

        {/* Swap Station Tab */}
        {activeTab === 'swap' && (
          <div>
            {/* Revenue Summary */}
            <div className="alert alert-warning border-0 mb-4">
              <div className="text-center">
                <small className="text-muted d-block">Swap Fee per Event</small>
                <h4 className="mb-0 fw-bold">₦{swapBreakdown.swapFee.toLocaleString()}</h4>
                <small className="text-muted">Distributed among infrastructure investors</small>
              </div>
            </div>

            {/* Distribution Table */}
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Stakeholder</th>
                    <th className="text-center">Share %</th>
                    <th className="text-end">Per Swap (₦)</th>
                    <th className="text-end">Total Earned (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {actualSwapDistribution.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <i className={`${item.icon} me-2 text-${item.color}`}></i>
                        <strong>{item.stakeholder}</strong>
                      </td>
                      <td className="text-center">
                        <span className={`badge bg-${item.color} bg-opacity-10 text-${item.color}`}>
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="text-end">₦{item.amount.toLocaleString()}</td>
                      <td className="text-end">
                        <strong>₦{item.actualAmount.toLocaleString()}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td colSpan={2}>TOTAL SWAP REVENUE</td>
                    <td className="text-end">₦{swapBreakdown.swapFee.toLocaleString()}</td>
                    <td className="text-end">₦{metrics.swapRevenue.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Smart Contract Info */}
            <div className="alert alert-secondary border-0 mb-0">
              <small>
                <i className="bi bi-file-code me-2"></i>
                <strong>Smart Contract:</strong> <code>distributeSwapRevenue()</code>
                <br />
                <i className="bi bi-clock-history me-2 ms-0"></i>
                <strong>Token Lifecycle:</strong> SST (5-year term) → UST minted per swap → Pro-rata distribution
              </small>
            </div>
          </div>
        )}

        {/* Token Architecture Summary */}
        <div className="mt-4 pt-4 border-top">
          <h6 className="mb-3">
            <i className="bi bi-coin me-2"></i>
            Token Architecture
          </h6>
          <div className="row g-2">
            <div className="col-md-3">
              <div className="p-3 bg-success bg-opacity-10 rounded">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong className="text-success">EKT</strong>
                  <span className="badge bg-success">Vehicle</span>
                </div>
                <small className="text-muted d-block">3-year term ownership</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 bg-warning bg-opacity-10 rounded">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong className="text-warning">SST</strong>
                  <span className="badge bg-warning">Infrastructure</span>
                </div>
                <small className="text-muted d-block">5-year swap station</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 bg-primary bg-opacity-10 rounded">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong className="text-primary">UST</strong>
                  <span className="badge bg-primary">Activity</span>
                </div>
                <small className="text-muted d-block">Burned post-payout</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="p-3 bg-info bg-opacity-10 rounded">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong className="text-info">RCT</strong>
                  <span className="badge bg-info">ESG</span>
                </div>
                <small className="text-muted d-block">Annual carbon credits</small>
              </div>
            </div>
          </div>
        </div>

        {/* Data Flow Footer */}
        <div className="mt-3 p-3 bg-light rounded">
          <small className="text-muted">
            <i className="bi bi-diagram-3 me-2"></i>
            <strong>Data Flow:</strong> Qoray Telemetry → Trovotech Node → Smart Contract → Bantu Blockchain → FleetFi Dashboard
          </small>
        </div>
      </div>
    </div>
  );
};

export const DualRevenueBreakdown = memo(DualRevenueBreakdownComponent);

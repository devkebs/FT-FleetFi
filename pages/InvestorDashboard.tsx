import React from 'react';
import { Asset, Token, Payout } from '../src/types';

interface InvestorDashboardProps {
  assets: Asset[];
  tokens: Token[];
  payouts: Payout[];
}

export const InvestorDashboard: React.FC<InvestorDashboardProps> = ({ 
  assets, 
  tokens, 
  payouts 
}) => {
  // Calculate metrics
  const totalInvestment = tokens.reduce((sum, token) => sum + token.investAmount, 0);
  const totalROIProjection = tokens.reduce((sum, token) => sum + token.roiProjection, 0);
  const totalPayoutsReceived = payouts.reduce((sum, payout) => sum + payout.investorShare, 0);
  const avgROI = totalInvestment > 0 ? ((totalROIProjection / totalInvestment) * 100).toFixed(1) : '0';

  // Get user's tokenized assets
  const myAssets = assets.filter(asset => 
    tokens.some(token => token.assetId === asset.id)
  );

  return (
    <div className="min-h-screen bg-brand-gray-light py-8">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-brand-charcoal mb-8">
          Investor Dashboard
        </h1>

        {/* Metrics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Investment"
            value={`₦${totalInvestment.toLocaleString()}`}
            bgColor="bg-brand-green"
          />
          <MetricCard
            title="Projected ROI"
            value={`₦${totalROIProjection.toLocaleString()}`}
            bgColor="bg-brand-yellow text-brand-charcoal"
          />
          <MetricCard
            title="Payouts Received"
            value={`₦${totalPayoutsReceived.toLocaleString()}`}
            bgColor="bg-blue-600"
          />
          <MetricCard
            title="Avg ROI %"
            value={`${avgROI}%`}
            bgColor="bg-purple-600"
          />
        </div>

        {/* My Tokenized Assets */}
        <section className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-4">
            My Tokenized Assets
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-gray-light">
                <tr>
                  <th className="px-4 py-3 text-left">Asset ID</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Ownership %</th>
                  <th className="px-4 py-3 text-left">Investment</th>
                  <th className="px-4 py-3 text-left">SOH</th>
                </tr>
              </thead>
              <tbody>
                {myAssets.map(asset => {
                  const token = tokens.find(t => t.assetId === asset.id);
                  return (
                    <tr key={asset.id} className="border-b hover:bg-brand-gray-light/50">
                      <td className="px-4 py-3 font-medium">{asset.id}</td>
                      <td className="px-4 py-3">{asset.type}</td>
                      <td className="px-4 py-3">{asset.model}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="px-4 py-3">
                        {token ? `${(token.fraction * 100).toFixed(1)}%` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        ₦{token?.investAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <SOHIndicator soh={asset.soh} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Payouts */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-4">
            Recent Payouts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-gray-light">
                <tr>
                  <th className="px-4 py-3 text-left">Month</th>
                  <th className="px-4 py-3 text-left">Asset ID</th>
                  <th className="px-4 py-3 text-left">Gross Revenue</th>
                  <th className="px-4 py-3 text-left">My Share</th>
                  <th className="px-4 py-3 text-left">Ownership %</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(payout => {
                  const token = tokens.find(t => t.id === payout.tokenId);
                  return (
                    <tr key={payout.payoutId} className="border-b hover:bg-brand-gray-light/50">
                      <td className="px-4 py-3 font-medium">{payout.month}</td>
                      <td className="px-4 py-3">{token?.assetId}</td>
                      <td className="px-4 py-3">₦{payout.grossRevenue.toLocaleString()}</td>
                      <td className="px-4 py-3 text-brand-green font-semibold">
                        ₦{payout.investorShare.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {token ? `${(token.fraction * 100).toFixed(1)}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string; bgColor: string }> = ({ 
  title, 
  value, 
  bgColor 
}) => (
  <div className={`${bgColor} text-white rounded-xl shadow-md p-6`}>
    <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = {
    'Available': 'bg-green-100 text-green-800',
    'In Use': 'bg-blue-100 text-blue-800',
    'Charging': 'bg-yellow-100 text-yellow-800',
    'Maintenance': 'bg-red-100 text-red-800',
  };
  
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const SOHIndicator: React.FC<{ soh: number }> = ({ soh }) => {
  const getColor = () => {
    if (soh >= 90) return 'text-green-600';
    if (soh >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <span className={`font-semibold ${getColor()}`}>
      {soh}%
    </span>
  );
};

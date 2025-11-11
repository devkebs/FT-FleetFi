import React from 'react';
import { Asset } from '../src/types';

interface OperatorDashboardProps {
  assets: Asset[];
}

export const OperatorDashboard: React.FC<OperatorDashboardProps> = ({ assets }) => {
  // Calculate fleet metrics
  const totalAssets = assets.length;
  const activeAssets = assets.filter(a => a.status === 'In Use' || a.status === 'Available').length;
  const totalSwaps = assets.reduce((sum, a) => sum + a.swaps, 0);
  const avgSOH = (assets.reduce((sum, a) => sum + a.soh, 0) / totalAssets).toFixed(1);
  const dailySwaps = assets.reduce((sum, a) => sum + a.dailySwaps, 0);

  // Group assets by type
  const assetsByType = assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Assets needing attention
  const maintenanceAssets = assets.filter(a => a.status === 'Maintenance');
  const lowSOHAssets = assets.filter(a => a.soh < 85);

  return (
    <div className="min-h-screen bg-brand-gray-light py-8">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-brand-charcoal mb-8">
          Fleet Operations Dashboard
        </h1>

        {/* Fleet Overview Metrics */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <MetricCard title="Total Assets" value={totalAssets.toString()} bgColor="bg-brand-green" />
          <MetricCard title="Active Assets" value={activeAssets.toString()} bgColor="bg-blue-600" />
          <MetricCard title="Total Swaps" value={totalSwaps.toLocaleString()} bgColor="bg-purple-600" />
          <MetricCard title="Avg SOH" value={`${avgSOH}%`} bgColor="bg-yellow-500 text-brand-charcoal" />
          <MetricCard title="Daily Swaps" value={dailySwaps.toString()} bgColor="bg-indigo-600" />
        </div>

        {/* Asset Type Distribution */}
        <section className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-4">
            Fleet Composition
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(assetsByType).map(([type, count]) => (
              <div key={type} className="bg-brand-gray-light rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-brand-green">{count as number}</div>
                <div className="text-brand-gray-dark mt-1">{type}s</div>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts Section */}
        {(maintenanceAssets.length > 0 || lowSOHAssets.length > 0) && (
          <section className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-brand-charcoal mb-4">
              ⚠️ Attention Required
            </h2>
            <div className="space-y-4">
              {maintenanceAssets.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <h3 className="font-semibold text-red-800 mb-2">
                    Assets in Maintenance ({maintenanceAssets.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {maintenanceAssets.map(asset => (
                      <span key={asset.id} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                        {asset.id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {lowSOHAssets.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">
                    Low SOH Assets ({lowSOHAssets.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {lowSOHAssets.map(asset => (
                      <span key={asset.id} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                        {asset.id} ({asset.soh}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* All Assets Table */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-4">
            Fleet Inventory
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-brand-gray-light">
                <tr>
                  <th className="px-4 py-3 text-left">Asset ID</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Model</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">SOH</th>
                  <th className="px-4 py-3 text-left">Total Swaps</th>
                  <th className="px-4 py-3 text-left">Daily Swaps</th>
                  <th className="px-4 py-3 text-left">Value (₦)</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => (
                  <tr key={asset.id} className="border-b hover:bg-brand-gray-light/50">
                    <td className="px-4 py-3 font-medium">{asset.id}</td>
                    <td className="px-4 py-3">{asset.type}</td>
                    <td className="px-4 py-3">{asset.model}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={asset.status} />
                    </td>
                    <td className="px-4 py-3">{asset.location}</td>
                    <td className="px-4 py-3">
                      <SOHIndicator soh={asset.soh} />
                    </td>
                    <td className="px-4 py-3">{asset.swaps.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold text-brand-green">{asset.dailySwaps}</td>
                    <td className="px-4 py-3">₦{asset.originalValue.toLocaleString()}</td>
                  </tr>
                ))}
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

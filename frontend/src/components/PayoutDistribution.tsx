import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface Asset {
  id: number;
  name: string;
  registration_number: string;
  total_revenue: number;
  available_for_distribution: number;
  investor_count: number;
}

interface DistributionRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  amount: number;
  investor_count: number;
  period_start: string;
  period_end: string;
  distributed_at: string;
  status: string;
}

const PayoutDistribution: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'distribute' | 'history'>('distribute');

  useEffect(() => {
    fetchAssets();
    fetchDistributionHistory();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await apiService.get('/operator/assets-for-payout');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchDistributionHistory = async () => {
    try {
      const response = await apiService.get('/operator/payout-history');
      setDistributionHistory(response.data);
    } catch (error) {
      console.error('Error fetching distribution history:', error);
    }
  };

  const handleDistribute = async () => {
    if (!selectedAsset || !amount || !periodStart || !periodEnd) {
      alert('Please fill in all fields');
      return;
    }

    setIsProcessing(true);
    try {
      await apiService.post('/operator/distribute-payout', {
        asset_id: selectedAsset,
        amount: parseFloat(amount),
        period_start: periodStart,
        period_end: periodEnd,
      });

      alert('Payout distributed successfully!');
      setShowModal(false);
      setSelectedAsset(null);
      setAmount('');
      setPeriodStart('');
      setPeriodEnd('');
      fetchAssets();
      fetchDistributionHistory();
    } catch (error: any) {
      alert(`Error distributing payout: ${error.response?.data?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedAssetData = assets.find(a => a.id === selectedAsset);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Revenue Distribution</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
        >
          Distribute Payout
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('distribute')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'distribute'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ready for Distribution
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Distribution History
          </button>
        </div>
      </div>

      {/* Assets Ready for Distribution */}
      {activeTab === 'distribute' && (
        <div className="space-y-4">
          {assets.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No assets with pending revenue distribution</p>
          ) : (
            assets.map((asset) => (
              <div key={asset.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{asset.name}</h3>
                    <p className="text-sm text-gray-600">{asset.registration_number}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Total Revenue:</span> ₦{asset.total_revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Available for Distribution:</span>{' '}
                        <span className="text-green-600 font-semibold">
                          ₦{asset.available_for_distribution.toLocaleString()}
                        </span>
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Investors:</span> {asset.investor_count}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAsset(asset.id);
                      setAmount(asset.available_for_distribution.toString());
                      setShowModal(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                  >
                    Distribute Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Distribution History */}
      {activeTab === 'history' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Investors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {distributionHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No distribution history yet
                  </td>
                </tr>
              ) : (
                distributionHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.asset_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₦{record.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.investor_count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(record.period_start).toLocaleDateString()} -{' '}
                        {new Date(record.period_end).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(record.distributed_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        record.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Distribution Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Distribute Revenue Payout</h3>

            {selectedAssetData && (
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium text-gray-700">{selectedAssetData.name}</p>
                <p className="text-xs text-gray-600">{selectedAssetData.registration_number}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter amount to distribute"
                />
                {selectedAssetData && (
                  <p className="text-xs text-gray-500 mt-1">
                    Available: ₦{selectedAssetData.available_for_distribution.toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {selectedAssetData && (
                <div className="p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">
                    This will distribute <span className="font-semibold">₦{parseFloat(amount || '0').toLocaleString()}</span> to{' '}
                    <span className="font-semibold">{selectedAssetData.investor_count}</span> investor(s) based on their ownership percentage.
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAsset(null);
                  setAmount('');
                  setPeriodStart('');
                  setPeriodEnd('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleDistribute}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Confirm Distribution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutDistribution;

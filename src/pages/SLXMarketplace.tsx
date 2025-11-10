import React from 'react';
import { Asset, SLXListing } from '../types';

interface SLXMarketplaceProps {
  assets: Asset[];
  slxListings: SLXListing[];
}

export const SLXMarketplace: React.FC<SLXMarketplaceProps> = ({ assets, slxListings }) => {
  // Get full asset data for listed items
  const listedAssets = slxListings.map(listing => {
    const asset = assets.find(a => a.id === listing.assetId);
    return { ...listing, asset };
  }).filter(item => item.asset);

  const totalListings = listedAssets.length;
  const totalValue = slxListings.reduce((sum, l) => sum + l.salvageValue, 0);

  return (
    <div className="min-h-screen bg-brand-gray-light py-8">
      <div className="container mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brand-charcoal mb-4">
            SLX Secondary Market
          </h1>
          <p className="text-xl text-brand-gray-dark">
            Buy and sell fractional ownership of end-of-lifecycle EV assets
          </p>
        </div>

        {/* Market Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <MarketMetric
            title="Active Listings"
            value={totalListings.toString()}
            icon="📋"
          />
          <MarketMetric
            title="Total Market Value"
            value={`₦${totalValue.toLocaleString()}`}
            icon="💰"
          />
          <MarketMetric
            title="Avg Salvage Value"
            value={totalListings > 0 ? `₦${(totalValue / totalListings).toLocaleString()}` : '₦0'}
            icon="📊"
          />
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ About the SLX Marketplace
          </h3>
          <p className="text-blue-800">
            The Secondary Lifecycle Exchange (SLX) allows investors to trade fractional 
            ownership of assets nearing end-of-life. Assets with SOH below 80% can be 
            listed for salvage value, enabling portfolio rebalancing and circular economy practices.
          </p>
        </div>

        {/* Listings Table */}
        <section className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-brand-charcoal">
              Available Listings
            </h2>
            <button className="px-6 py-2 bg-brand-green text-white rounded-lg font-semibold hover:bg-brand-green/90 transition-colors">
              + List Asset
            </button>
          </div>

          {listedAssets.length === 0 ? (
            <div className="text-center py-12 text-brand-gray-dark">
              <div className="text-6xl mb-4">🏪</div>
              <p className="text-xl">No assets currently listed on the marketplace</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-brand-gray-light">
                  <tr>
                    <th className="px-4 py-3 text-left">Asset ID</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Model</th>
                    <th className="px-4 py-3 text-left">SOH</th>
                    <th className="px-4 py-3 text-left">Total Swaps</th>
                    <th className="px-4 py-3 text-left">Original Value</th>
                    <th className="px-4 py-3 text-left">Salvage Value</th>
                    <th className="px-4 py-3 text-left">Listed Since</th>
                    <th className="px-4 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {listedAssets.map(({ asset, salvageValue, listedAt }) => {
                    if (!asset) return null;
                    const discountPercent = ((1 - salvageValue / asset.originalValue) * 100).toFixed(0);
                    
                    return (
                      <tr key={asset.id} className="border-b hover:bg-brand-gray-light/50">
                        <td className="px-4 py-3 font-medium">{asset.id}</td>
                        <td className="px-4 py-3">{asset.type}</td>
                        <td className="px-4 py-3">{asset.model}</td>
                        <td className="px-4 py-3">
                          <SOHBadge soh={asset.soh} />
                        </td>
                        <td className="px-4 py-3">{asset.swaps.toLocaleString()}</td>
                        <td className="px-4 py-3 text-brand-gray-medium line-through">
                          ₦{asset.originalValue.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-brand-green">
                            ₦{salvageValue.toLocaleString()}
                          </div>
                          <div className="text-xs text-red-600">
                            -{discountPercent}%
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {new Date(listedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button className="px-4 py-2 bg-brand-yellow text-brand-charcoal rounded-md font-semibold hover:bg-brand-yellow/90 transition-colors text-sm">
                            Buy Now
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* How It Works */}
        <section className="mt-12 bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-6">
            How SLX Trading Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Step
              number="1"
              title="Asset Evaluation"
              description="Assets below 80% SOH are eligible for SLX listing"
            />
            <Step
              number="2"
              title="Price Discovery"
              description="Salvage value calculated based on SOH and remaining utility"
            />
            <Step
              number="3"
              title="List or Buy"
              description="Sell your tokens or buy discounted assets"
            />
            <Step
              number="4"
              title="Circular Economy"
              description="Repurpose or recycle end-of-life assets responsibly"
            />
          </div>
        </section>

        {/* Benefits */}
        <section className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-900 mb-3">
              ✅ For Sellers
            </h3>
            <ul className="space-y-2 text-green-800">
              <li>• Liquidate underperforming assets</li>
              <li>• Recover capital for reinvestment</li>
              <li>• Portfolio optimization</li>
              <li>• Tax-loss harvesting opportunities</li>
            </ul>
          </div>
          <div className="bg-blue-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-3">
              ✅ For Buyers
            </h3>
            <ul className="space-y-2 text-blue-800">
              <li>• Discounted entry into fleet ownership</li>
              <li>• Lower capital requirements</li>
              <li>• Potential for refurbishment value</li>
              <li>• Support circular economy initiatives</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

const MarketMetric: React.FC<{ title: string; value: string; icon: string }> = ({ 
  title, 
  value, 
  icon 
}) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-brand-gray-dark">{title}</h3>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className="text-3xl font-bold text-brand-charcoal">{value}</p>
  </div>
);

const SOHBadge: React.FC<{ soh: number }> = ({ soh }) => {
  const getBadgeColor = () => {
    if (soh >= 90) return 'bg-green-100 text-green-800';
    if (soh >= 75) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBadgeColor()}`}>
      {soh}%
    </span>
  );
};

const Step: React.FC<{ number: string; title: string; description: string }> = ({ 
  number, 
  title, 
  description 
}) => (
  <div className="text-center">
    <div className="w-12 h-12 bg-brand-green text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">
      {number}
    </div>
    <h4 className="font-semibold text-brand-charcoal mb-2">{title}</h4>
    <p className="text-sm text-brand-gray-dark">{description}</p>
  </div>
);

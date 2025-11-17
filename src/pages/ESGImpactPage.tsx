import React from 'react';
import { Asset } from '../types';

interface ESGImpactPageProps {
  assets: Asset[];
}

export const ESGImpactPage: React.FC<ESGImpactPageProps> = ({ assets = [] }) => {
  // Calculate impact metrics
  const totalSwaps = assets.reduce((sum, a) => sum + a.swaps, 0);
  const co2Saved = (totalSwaps * 2.3).toFixed(0); // Assume 2.3 kg CO2 saved per swap
  const petrolReplaced = (totalSwaps * 1.5).toFixed(0); // Assume 1.5 liters per swap
  const activeEVs = assets.filter(a => a.type === 'EV').length;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-brand-charcoal mb-4">
          Environmental, Social & Governance Impact
        </h1>
        <p className="text-xl text-brand-gray-dark mb-8">
          Tracking our contribution to sustainable mobility in Africa
        </p>

        {/* Key Impact Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <ImpactCard
            icon="🌍"
            title="CO₂ Emissions Saved"
            value={`${co2Saved} kg`}
            description="Equivalent to planting 120 trees"
            bgColor="bg-green-500"
          />
          <ImpactCard
            icon="⛽"
            title="Petrol Replaced"
            value={`${petrolReplaced} L`}
            description="Fossil fuel consumption avoided"
            bgColor="bg-blue-500"
          />
          <ImpactCard
            icon="🚗"
            title="Active EVs"
            value={activeEVs.toString()}
            description="Zero-emission vehicles on road"
            bgColor="bg-purple-500"
          />
          <ImpactCard
            icon="♻️"
            title="Battery Swaps"
            value={totalSwaps.toLocaleString()}
            description="Clean energy transactions"
            bgColor="bg-yellow-500 text-brand-charcoal"
          />
        </div>

        {/* Environmental Impact Details */}
        <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-brand-charcoal mb-6">
            🌱 Environmental Impact
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-brand-green mb-3">
                Carbon Footprint Reduction
              </h3>
              <ul className="space-y-2 text-brand-gray-dark">
                <li>✓ Zero tailpipe emissions from all electric vehicles</li>
                <li>✓ Biogas-powered charging infrastructure (100% renewable)</li>
                <li>✓ Avoided {co2Saved}kg of CO₂ emissions to date</li>
                <li>✓ Equivalent to {(parseInt(co2Saved) / 411).toFixed(0)} passenger vehicles off the road for one year</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-brand-green mb-3">
                Resource Conservation
              </h3>
              <ul className="space-y-2 text-brand-gray-dark">
                <li>✓ {petrolReplaced}L of petrol consumption avoided</li>
                <li>✓ Reduced air pollution in urban areas</li>
                <li>✓ Battery recycling program for end-of-life units</li>
                <li>✓ Circular economy model for asset lifecycle</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Social Impact */}
        <section className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-brand-charcoal mb-6">
            👥 Social Impact
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <SocialMetric
              icon="👨‍💼"
              title="Jobs Created"
              value="450+"
              description="Riders, technicians, and station operators"
            />
            <SocialMetric
              icon="📚"
              title="Training Programs"
              value="25"
              description="EV maintenance and safe driving courses"
            />
            <SocialMetric
              icon="💰"
              title="Income Generated"
              value="₦12.5M"
              description="Monthly earnings for riders"
            />
          </div>
        </section>

        {/* Governance & Transparency */}
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-brand-charcoal mb-6">
            📊 Governance & Transparency
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-brand-green mb-3">
                Blockchain-Based Accountability
              </h3>
              <ul className="space-y-2 text-brand-gray-dark">
                <li>✓ All asset ownership recorded on blockchain</li>
                <li>✓ Real-time revenue tracking via smart contracts</li>
                <li>✓ Automated payout distribution to investors</li>
                <li>✓ Transparent fee structure (no hidden charges)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-brand-green mb-3">
                Regulatory Compliance
              </h3>
              <ul className="space-y-2 text-brand-gray-dark">
                <li>✓ SEC ARIP-compliant tokenization framework</li>
                <li>✓ Trovotech VASP partnership for legal compliance</li>
                <li>✓ Quarterly impact reports published</li>
                <li>✓ Third-party audit of ESG metrics</li>
              </ul>
            </div>
          </div>
        </section>

        {/* SDG Alignment */}
        <section className="mt-12 text-center">
          <h2 className="text-3xl font-bold text-brand-charcoal mb-6">
            UN Sustainable Development Goals
          </h2>
          <p className="text-brand-gray-dark mb-4">FleetFi contributes to:</p>
          <div className="flex justify-center gap-4 text-4xl">
            <span title="SDG 7: Affordable & Clean Energy">🔋</span>
            <span title="SDG 8: Decent Work & Economic Growth">💼</span>
            <span title="SDG 9: Industry, Innovation & Infrastructure">🏗️</span>
            <span title="SDG 11: Sustainable Cities">🏙️</span>
            <span title="SDG 13: Climate Action">🌍</span>
          </div>
        </section>
      </div>
    </div>
  );
};

const ImpactCard: React.FC<{ 
  icon: string; 
  title: string; 
  value: string; 
  description: string; 
  bgColor: string;
}> = ({ icon, title, value, description, bgColor }) => (
  <div className={`${bgColor} text-white rounded-xl shadow-md p-6`}>
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
    <p className="text-3xl font-bold mb-2">{value}</p>
    <p className="text-xs opacity-80">{description}</p>
  </div>
);

const SocialMetric: React.FC<{
  icon: string;
  title: string;
  value: string;
  description: string;
}> = ({ icon, title, value, description }) => (
  <div className="bg-brand-gray-light rounded-lg p-6 text-center">
    <div className="text-5xl mb-3">{icon}</div>
    <h3 className="text-lg font-semibold text-brand-charcoal mb-2">{title}</h3>
    <div className="text-3xl font-bold text-brand-green mb-1">{value}</div>
    <p className="text-sm text-brand-gray-dark">{description}</p>
  </div>
);

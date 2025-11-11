import React from 'react';
import { Page } from '../src/types';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-gray-light to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold text-brand-charcoal mb-6">
            Driving Africa's Clean Mobility Revolution
          </h1>
          <p className="text-xl text-brand-gray-dark mb-8">
            Co-own electric vehicles, earn returns, and power sustainable transport 
            through biogas-powered battery swaps
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate(Page.InvestorDashboard)}
              className="px-8 py-4 bg-brand-green text-white rounded-lg font-semibold text-lg hover:bg-brand-green/90 transition-colors shadow-lg"
            >
              Start Investing
            </button>
            <button
              onClick={() => onNavigate(Page.OperatorDashboard)}
              className="px-8 py-4 bg-brand-yellow text-brand-charcoal rounded-lg font-semibold text-lg hover:bg-brand-yellow/90 transition-colors shadow-lg"
            >
              Fleet Operations
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-brand-charcoal mb-12">
          How FleetFi Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="🚗"
            title="Fractional EV Ownership"
            description="Invest in tokenized electric vehicles and earn ROI from daily operations"
          />
          <FeatureCard
            icon="⚡"
            title="Battery Swap Network"
            description="Biogas-powered swap stations provide clean, fast, and affordable energy"
          />
          <FeatureCard
            icon="💰"
            title="Transparent Returns"
            description="Smart contracts automatically distribute earnings to investors and riders"
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-brand-green text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <StatCard value="1,500+" label="Active EVs" />
            <StatCard value="₦2.5M" label="Avg. Monthly Returns" />
            <StatCard value="450" label="Investors" />
            <StatCard value="15%" label="Avg. ROI" />
          </div>
        </div>
      </section>

      {/* ESG Impact Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-center text-brand-charcoal mb-8">
            Environmental Impact
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ImpactCard
              icon="🌱"
              value="12,000 tons"
              label="CO₂ Reduced Annually"
            />
            <ImpactCard
              icon="♻️"
              value="100%"
              label="Renewable Energy"
            />
            <ImpactCard
              icon="🔋"
              value="50,000+"
              label="Clean Battery Swaps"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-bold text-brand-charcoal mb-4">
          Ready to Join the Revolution?
        </h2>
        <p className="text-xl text-brand-gray-dark mb-8">
          Start investing in Africa's clean mobility future today
        </p>
        <button
          onClick={() => onNavigate(Page.InvestorDashboard)}
          className="px-10 py-4 bg-brand-green text-white rounded-lg font-semibold text-lg hover:bg-brand-green/90 transition-colors shadow-lg"
        >
          Get Started
        </button>
      </section>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({ 
  icon, 
  title, 
  description 
}) => (
  <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-brand-charcoal mb-2">{title}</h3>
    <p className="text-brand-gray-dark">{description}</p>
  </div>
);

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div>
    <div className="text-4xl font-bold mb-2">{value}</div>
    <div className="text-brand-yellow">{label}</div>
  </div>
);

const ImpactCard: React.FC<{ icon: string; value: string; label: string }> = ({ 
  icon, 
  value, 
  label 
}) => (
  <div className="text-center">
    <div className="text-5xl mb-3">{icon}</div>
    <div className="text-3xl font-bold text-brand-green mb-1">{value}</div>
    <div className="text-brand-gray-dark">{label}</div>
  </div>
);

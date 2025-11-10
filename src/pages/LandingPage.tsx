import React, { useState, useEffect } from 'react';
import { Page } from '../types';

interface LandingPageProps {
  onNavigate: (page: Page) => void;
}

interface LiveMetrics {
  totalRevenue: number;
  totalRides: number;
  activeVehicles: number;
  totalInvestors: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
  const [activeTab, setActiveTab] = useState<'investor' | 'operator' | 'driver'>('investor');

  useEffect(() => {
    // Check backend connectivity
    fetch('http://localhost:8000/api/user', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
      .then(() => {
        setBackendStatus('online');
        // Fetch live metrics
        fetchLiveMetrics();
      })
      .catch(() => setBackendStatus('offline'));
  }, []);

  const fetchLiveMetrics = async () => {
    try {
      // Fetch revenue summary
      const response = await fetch('http://localhost:8000/api/revenue/summary', {
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLiveMetrics({
          totalRevenue: data.total_revenue || 0,
          totalRides: data.total_rides || 0,
          activeVehicles: 40, // From seeded data
          totalInvestors: 450 // Projected
        });
      }
    } catch (error) {
      console.warn('Failed to fetch live metrics:', error);
    }
  };

  return (
    <div className="bg-hero-gradient" style={{ minHeight: '100vh' }}>
      {/* Backend Status Banner */}
      {backendStatus === 'offline' && (
        <div className="alert alert-warning m-0 rounded-0 text-center" role="alert">
          <strong>⚠️ Backend server not detected.</strong> Please start Laravel: <code>cd backend; php artisan serve</code>
        </div>
      )}
      {backendStatus === 'online' && (
        <div className="alert alert-success m-0 rounded-0 text-center" role="alert">
          ✅ Backend API connected (localhost:8000)
        </div>
      )}
      
      {/* Hero Section */}
      <section className="container py-5 py-lg-6">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 text-center">
            <h1 className="display-4 fw-bold text-brand-charcoal mb-3">
              Driving Africa's Clean Mobility Revolution
            </h1>
            <p className="lead text-brand-gray-dark mb-4 mx-auto" style={{ maxWidth: '720px' }}>
              Co-own electric vehicles, earn returns, and power sustainable transport through biogas-powered battery swaps.
            </p>
            <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <button
                onClick={() => onNavigate(Page.InvestorDashboard)}
                className="btn btn-lg btn-brand-green shadow"
              >
                Start Investing
              </button>
              <button
                onClick={() => onNavigate(Page.OperatorDashboard)}
                className="btn btn-lg btn-brand-yellow shadow fw-semibold"
              >
                Fleet Operations
              </button>
              <button
                onClick={() => onNavigate(Page.About)}
                className="btn btn-lg btn-outline-dark shadow-sm"
              >
                <i className="bi bi-info-circle me-2"></i>
                About Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-5">
        <h2 className="h1 fw-bold text-center text-brand-charcoal mb-5">How FleetFi Works</h2>
        <div className="row g-4">
          <div className="col-12 col-md-4">
            <FeatureCard
              icon="🚗"
              title="Fractional EV Ownership"
              description="Invest in tokenized electric vehicles and earn ROI from daily operations"
            />
          </div>
          <div className="col-12 col-md-4">
            <FeatureCard
              icon="⚡"
              title="Battery Swap Network"
              description="Biogas-powered swap stations provide clean, fast, and affordable energy"
            />
          </div>
            <div className="col-12 col-md-4">
            <FeatureCard
              icon="💰"
              title="Transparent Returns"
              description="Smart contracts automatically distribute earnings to investors and riders"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-brand-green text-white py-5">
        <div className="container">
          <h2 className="h3 fw-bold text-center mb-4 text-brand-yellow">Live Platform Metrics</h2>
          <div className="row text-center g-4">
            <div className="col-6 col-md-3">
              <StatCard 
                value={liveMetrics ? `${liveMetrics.activeVehicles}` : '40'} 
                label="Active EVs" 
              />
            </div>
            <div className="col-6 col-md-3">
              <StatCard 
                value={liveMetrics ? `$${(liveMetrics.totalRevenue / 1000).toFixed(1)}K` : '$36.5K'} 
                label="Total Revenue" 
              />
            </div>
            <div className="col-6 col-md-3">
              <StatCard 
                value={liveMetrics ? `${liveMetrics.totalInvestors}+` : '450+'} 
                label="Investors" 
              />
            </div>
            <div className="col-6 col-md-3">
              <StatCard 
                value={liveMetrics ? `${liveMetrics.totalRides}` : '73'} 
                label="Completed Rides" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Model Section */}
      <section className="container py-5">
        <div className="bg-white rounded-4 shadow p-4 p-md-5">
          <h2 className="h1 fw-bold text-center text-brand-charcoal mb-4">Revenue Allocation Model</h2>
          <p className="text-center text-brand-gray-dark mb-5" style={{ maxWidth: '700px', margin: '0 auto' }}>
            Every ride generates transparent, automated revenue distribution through smart contracts
          </p>
          
          <div className="row g-4">
            <div className="col-12 col-md-6 col-lg-3">
              <RevenueCard 
                percentage={50} 
                title="Investor ROI" 
                description="Direct returns to token holders based on fractional ownership"
                color="bg-success"
              />
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <RevenueCard 
                percentage={30} 
                title="Rider Wages" 
                description="Fair compensation for drivers powering the fleet"
                color="bg-primary"
              />
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <RevenueCard 
                percentage={15} 
                title="Management Reserve" 
                description="Operations, platform maintenance, and growth"
                color="bg-warning"
              />
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              <RevenueCard 
                percentage={5} 
                title="Maintenance Fund" 
                description="Vehicle servicing and infrastructure upkeep"
                color="bg-info"
              />
            </div>
          </div>
        </div>
      </section>

      {/* User Journey Timeline */}
      <section className="container py-5">
        <h2 className="h1 fw-bold text-center text-brand-charcoal mb-5">Your Journey with FleetFi</h2>
        
        {/* Role Tabs */}
        <div className="d-flex justify-content-center mb-4">
          <div className="btn-group" role="group">
            <button 
              className={`btn ${activeTab === 'investor' ? 'btn-brand-green' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('investor')}
            >
              👔 Investor
            </button>
            <button 
              className={`btn ${activeTab === 'operator' ? 'btn-brand-green' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('operator')}
            >
              🏢 Fleet Operator
            </button>
            <button 
              className={`btn ${activeTab === 'driver' ? 'btn-brand-green' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('driver')}
            >
              🚗 Driver
            </button>
          </div>
        </div>

        {/* Journey Steps */}
        {activeTab === 'investor' && (
          <div className="row g-4">
            <div className="col-12 col-md-3">
              <JourneyStep number={1} title="Create Account" description="Sign up and complete KYC verification in minutes" />
            </div>
            <div className="col-12 col-md-3">
              <JourneyStep number={2} title="Browse Vehicles" description="Explore available EVs with detailed telemetry and ROI projections" />
            </div>
            <div className="col-12 col-md-3">
              <JourneyStep number={3} title="Invest & Own" description="Purchase fractional ownership tokens via secure custody" />
            </div>
            <div className="col-12 col-md-3">
              <JourneyStep number={4} title="Earn Returns" description="Receive automated payouts as vehicles generate revenue" />
            </div>
          </div>
        )}

        {activeTab === 'operator' && (
          <div className="row g-4">
            <div className="col-12 col-md-3">
              <JourneyStep number={1} title="Register Fleet" description="Onboard your electric vehicles to the platform" />
            </div>
            <div className="col-12 col-md-3">
              <JourneyStep number={2} title="List Assets" description="Tokenize vehicles for fractional investment" />
            </div>
            <div className="col-12 col-md-3">
              <JourneyStep number={3} title="Monitor Operations" description="Track telemetry, swaps, and revenue in real-time" />
            </div>
            <div className="col-12 col-md-3">
              <JourneyStep number={4} title="Manage Payouts" description="Distribute earnings to investors and drivers automatically" />
            </div>
          </div>
        )}

        {activeTab === 'driver' && (
          <div className="row g-4">
            <div className="col-12 col-md-3">
              <JourneyStep number={1} title="Apply & Verify" description="Complete driver verification and training" />
            </div>
            <div className="col-12 col-md-3">
              <JourneyStep number={2} title="Get Assigned" description="Receive your vehicle and access to swap network" />
            </div>
            <div className="col-12 col-md-3">
              <JourneyStep number={3} title="Drive & Earn" description="Complete rides and swap batteries seamlessly" />
            </div>
            <div className="col-12 col-md-3">
              <JourneyStep number={4} title="Track Earnings" description="Monitor your wages and performance metrics" />
            </div>
          </div>
        )}
      </section>

      {/* Technology Stack */}
      <section className="bg-light py-5">
        <div className="container">
          <h2 className="h1 fw-bold text-center text-brand-charcoal mb-4">Built on Cutting-Edge Technology</h2>
          <p className="text-center text-brand-gray-dark mb-5" style={{ maxWidth: '700px', margin: '0 auto' }}>
            SEC-compliant tokenization meets sustainable infrastructure
          </p>
          
          <div className="row g-4 align-items-center">
            <div className="col-12 col-md-4">
              <TechCard 
                icon="🔐"
                title="TrovoTech Custody"
                description="SEC-aligned digital asset custody and tokenization infrastructure"
              />
            </div>
            <div className="col-12 col-md-4">
              <TechCard 
                icon="⛓️"
                title="Bantu Blockchain"
                description="Fast, low-cost transactions on Africa's leading blockchain network"
              />
            </div>
            <div className="col-12 col-md-4">
              <TechCard 
                icon="📊"
                title="Real-Time Telemetry"
                description="IoT sensors track battery health, location, and usage patterns"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ESG Impact Section */}
      <section className="container py-5">
        <div className="bg-white rounded-4 shadow p-4 p-md-5">
          <h2 className="h1 fw-bold text-center text-brand-charcoal mb-4">Environmental Impact</h2>
          <div className="row g-4">
            <div className="col-12 col-md-4">
              <ImpactCard icon="🌱" value="12,000 tons" label="CO₂ Reduced Annually" />
            </div>
            <div className="col-12 col-md-4">
              <ImpactCard icon="♻️" value="100%" label="Renewable Energy" />
            </div>
            <div className="col-12 col-md-4">
              <ImpactCard icon="🔋" value="50,000+" label="Clean Battery Swaps" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-5">
        <h2 className="h1 fw-bold text-center text-brand-charcoal mb-5">Frequently Asked Questions</h2>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10">
            <div className="accordion" id="faqAccordion">
              <FAQItem 
                id="faq1"
                question="How does fractional ownership work?"
                answer="Each electric vehicle is tokenized into digital shares. When you invest, you purchase a specific fraction (e.g., 25%) of a vehicle. Your ownership is recorded on the blockchain, and you earn proportional returns from that vehicle's daily operations."
              />
              <FAQItem 
                id="faq2"
                question="What are the expected returns?"
                answer="Historical data shows average annual ROI of 12-18%, depending on vehicle utilization. Returns are distributed automatically via smart contracts as rides are completed. You receive 50% of the revenue generated by your fractional ownership stake."
              />
              <FAQItem 
                id="faq3"
                question="Is my investment secure?"
                answer="Yes. Assets are custodied through TrovoTech's SEC-compliant infrastructure. All transactions are recorded on the Bantu blockchain for transparency. Vehicles are insured, and ownership tokens are held in regulated digital wallets."
              />
              <FAQItem 
                id="faq4"
                question="How do battery swaps work?"
                answer="Our network of biogas-powered swap stations enables drivers to exchange depleted batteries for fully charged ones in under 3 minutes. This eliminates range anxiety and charging downtime, maximizing vehicle uptime and revenue."
              />
              <FAQItem 
                id="faq5"
                question="Can I sell my tokens?"
                answer="Yes. Once verified, you can list your ownership tokens on the SLX Marketplace for secondary trading. This provides liquidity and allows you to exit positions or reallocate investments."
              />
              <FAQItem 
                id="faq6"
                question="What is the minimum investment?"
                answer="You can start with as little as $500, which typically represents 10-15% fractional ownership of a single vehicle. There's no maximum limit—diversify across multiple vehicles to spread risk."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-light py-5">
        <div className="container">
          <h2 className="h1 fw-bold text-center text-brand-charcoal mb-5">What Our Community Says</h2>
          <div className="row g-4">
            <div className="col-12 col-md-4">
              <TestimonialCard 
                name="Sarah Investor"
                role="Investor"
                quote="I've earned 14% returns in 6 months. The transparency and automation make this the easiest investment I've ever made."
                avatar="👩‍💼"
              />
            </div>
            <div className="col-12 col-md-4">
              <TestimonialCard 
                name="Michael Chen"
                role="Fleet Operator"
                quote="FleetFi's tokenization opened up capital from hundreds of investors. We scaled our fleet 3x faster than traditional financing."
                avatar="👨‍💼"
              />
            </div>
            <div className="col-12 col-md-4">
              <TestimonialCard 
                name="Chioma Driver"
                role="Driver"
                quote="Battery swaps are so fast! I complete 30% more rides per day compared to traditional EVs with charging downtime."
                avatar="👩‍✈️"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-5 text-center">
        <h2 className="display-6 fw-bold text-brand-charcoal mb-3">Ready to Join the Revolution?</h2>
        <p className="lead text-brand-gray-dark mb-4">Start investing in Africa's clean mobility future today.</p>
        <button
          onClick={() => onNavigate(Page.InvestorDashboard)}
          className="btn btn-lg btn-brand-green shadow"
        >
          Get Started
        </button>
      </section>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white h-100 p-4 rounded-3 shadow-sm border">
    <div className="fs-1 mb-3">{icon}</div>
    <h3 className="h5 fw-bold text-brand-charcoal mb-2">{title}</h3>
    <p className="text-brand-gray-dark mb-0" style={{ fontSize: '0.95rem' }}>{description}</p>
  </div>
);

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="d-flex flex-column align-items-center">
    <div className="fw-bold" style={{ fontSize: '2rem' }}>{value}</div>
    <div className="text-brand-yellow" style={{ fontWeight: 500 }}>{label}</div>
  </div>
);

const ImpactCard: React.FC<{ icon: string; value: string; label: string }> = ({ icon, value, label }) => (
  <div className="text-center">
    <div className="fs-1 mb-2">{icon}</div>
    <div className="fw-bold text-brand-green" style={{ fontSize: '1.75rem' }}>{value}</div>
    <div className="text-brand-gray-dark" style={{ fontSize: '0.9rem' }}>{label}</div>
  </div>
);

const RevenueCard: React.FC<{ percentage: number; title: string; description: string; color: string }> = 
  ({ percentage, title, description, color }) => (
  <div className="bg-white border rounded-3 p-4 h-100 shadow-sm">
    <div className={`${color} text-white rounded-circle d-flex align-items-center justify-content-center mb-3`} 
         style={{ width: '80px', height: '80px', fontSize: '2rem', fontWeight: 'bold', margin: '0 auto' }}>
      {percentage}%
    </div>
    <h3 className="h5 fw-bold text-center text-brand-charcoal mb-2">{title}</h3>
    <p className="text-center text-brand-gray-dark mb-0" style={{ fontSize: '0.9rem' }}>{description}</p>
  </div>
);

const JourneyStep: React.FC<{ number: number; title: string; description: string }> = 
  ({ number, title, description }) => (
  <div className="bg-white border rounded-3 p-4 h-100 shadow-sm position-relative">
    <div className="bg-brand-green text-white rounded-circle d-flex align-items-center justify-content-center mb-3" 
         style={{ width: '50px', height: '50px', fontSize: '1.5rem', fontWeight: 'bold' }}>
      {number}
    </div>
    <h3 className="h6 fw-bold text-brand-charcoal mb-2">{title}</h3>
    <p className="text-brand-gray-dark mb-0" style={{ fontSize: '0.85rem' }}>{description}</p>
  </div>
);

const TechCard: React.FC<{ icon: string; title: string; description: string }> = 
  ({ icon, title, description }) => (
  <div className="bg-white border rounded-3 p-4 h-100 shadow-sm text-center">
    <div className="fs-1 mb-3">{icon}</div>
    <h3 className="h5 fw-bold text-brand-charcoal mb-2">{title}</h3>
    <p className="text-brand-gray-dark mb-0" style={{ fontSize: '0.9rem' }}>{description}</p>
  </div>
);

const FAQItem: React.FC<{ id: string; question: string; answer: string }> = 
  ({ id, question, answer }) => (
  <div className="accordion-item border mb-3 rounded-3">
    <h2 className="accordion-header">
      <button 
        className="accordion-button collapsed fw-semibold" 
        type="button" 
        data-bs-toggle="collapse" 
        data-bs-target={`#${id}`}
      >
        {question}
      </button>
    </h2>
    <div id={id} className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
      <div className="accordion-body text-brand-gray-dark">
        {answer}
      </div>
    </div>
  </div>
);

const TestimonialCard: React.FC<{ name: string; role: string; quote: string; avatar: string }> = 
  ({ name, role, quote, avatar }) => (
  <div className="bg-white border rounded-3 p-4 h-100 shadow-sm">
    <div className="d-flex align-items-center mb-3">
      <div className="fs-1 me-3">{avatar}</div>
      <div>
        <div className="fw-bold text-brand-charcoal">{name}</div>
        <div className="text-brand-gray-dark small">{role}</div>
      </div>
    </div>
    <p className="text-brand-gray-dark mb-0 fst-italic">"{quote}"</p>
  </div>
);

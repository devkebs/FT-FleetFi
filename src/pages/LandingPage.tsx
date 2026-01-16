import React, { useState, useEffect } from 'react';
import './LandingPage.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  interest: string;
  message: string;
}

interface StatCardProps {
  value: string;
  label: string;
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

interface StepCardProps {
  number: string;
  title: string;
  description: string;
}

// ============================================================================
// CHILD COMPONENTS
// ============================================================================

const StatCard: React.FC<StatCardProps> = ({ value, label }) => (
  <div className="stat-box">
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="card-icon">{icon}</div>
    <h3 className="card-title">{title}</h3>
    <p className="card-text">{description}</p>
  </div>
);

const StepCard: React.FC<StepCardProps> = ({ number, title, description }) => (
  <div className="step-card">
    <div className="step-number">{number}</div>
    <h3 className="step-title">{title}</h3>
    <p className="step-text">{description}</p>
  </div>
);

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================

interface LandingPageProps {
  onLogin?: () => void;
  onRegister?: () => void;
  onAdminLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onRegister, onAdminLogin }) => {
  // ========== STATE MANAGEMENT ==========
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('fleetfi-theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    interest: 'partnership',
    message: ''
  });
  const [formStatus, setFormStatus] = useState<{ type: string; message: string }>({ 
    type: '', 
    message: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ========== CONFIGURATION ==========
  const config = {
    whatsappNumber: '2347049195225',
    whatsappMessage: 'Hello FleetFi! I would like to learn more about your electric mobility solutions.',
    web3FormsKey: '59d41e61-ef15-49ac-9eef-0a42288ee17d'
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fleetfi-theme', theme);
  }, [theme]);

  // ========== HANDLERS ==========
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: '', message: '' });

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: config.web3FormsKey,
          subject: `FleetFi Contact: ${formData.name}`,
          from_name: 'FleetFi Website',
          ...formData
        })
      });

      const result = await response.json();

      if (result.success) {
        setFormStatus({
          type: 'success',
          message: '✅ Thank you! Your message has been sent. We\'ll get back to you within 24 hours.'
        });
        
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          interest: 'partnership',
          message: ''
        });

        setTimeout(() => {
          setFormStatus({ type: '', message: '' });
        }, 8000);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      setFormStatus({
        type: 'error',
        message: '❌ Oops! Something went wrong. Please email us at partnerships@freenergy.tech'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    const url = `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(config.whatsappMessage)}`;
    window.open(url, '_blank');
  };

  const goToLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      // Fallback: dispatch custom event for App to catch
      window.dispatchEvent(new CustomEvent('app:showLogin'));
    }
  };

  const goToAdminLogin = () => {
    if (onAdminLogin) {
      onAdminLogin();
    }
  };

  // ========== RENDER ==========
  return (
    <div className="fleetfi-landing">
      {/* ============================================================
          HERO SECTION WITH NAVIGATION
      ============================================================ */}
      <section className="hero-section" id="home">
        {/* Navigation Bar */}
        <nav className="main-navbar">
          <div className="navbar-container">
            {/* Logo */}
            <div className="brand-logo" onClick={() => scrollTo('home')}>
              <span className="logo-icon">⚡</span>
              <div className="brand-text">
                <span className="brand-name">FleetFi</span>
                <span className="brand-subtitle">by Freenergy Tech</span>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="nav-menu">
              <button onClick={() => scrollTo('problem')} className="nav-link">Challenge</button>
              <button onClick={() => scrollTo('solution')} className="nav-link">Solution</button>
              <button onClick={() => scrollTo('how-it-works')} className="nav-link">How It Works</button>
              <button onClick={() => scrollTo('impact')} className="nav-link">Impact</button>
              <button onClick={() => scrollTo('contact')} className="nav-link">Contact</button>
              <button onClick={goToLogin} className="nav-btn-login">Login</button>
              <button onClick={goToAdminLogin} className="nav-link" style={{ opacity: 0.7 }}>Admin</button>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme} 
              className="theme-toggle-btn"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>⚡</span>
              <span>Clean Mobility for Africa</span>
            </div>
            
            <h1 className="hero-title">
              Electric mobility that helps transport microenterprises{' '}
              <span className="highlight">earn more</span> — every day
            </h1>
            
            <p className="hero-description">
              FleetFi helps commercial transport operators access electric vehicles, cut fuel costs, 
              and increase daily income through pay-as-you-earn clean mobility.
            </p>
            
            <div className="hero-buttons">
              <button onClick={() => scrollTo('contact')} className="btn-hero-primary">
                Partner with us →
              </button>
              <button onClick={() => scrollTo('how-it-works')} className="btn-hero-secondary">
                See how it works
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="stats-card">
            <div className="stats-grid">
              <StatCard value="50%" label="Lower Energy Costs" />
              <StatCard value="100%" label="Electric Fleet" />
              <StatCard value="24/7" label="Battery Swap Access" />
              <StatCard value="0%" label="Upfront Cost" />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PROBLEM SECTION
      ============================================================ */}
      <section className="page-section" id="problem">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">The Challenge</span>
            <h2 className="section-heading">Fuel costs are crushing transport microenterprises</h2>
            <p className="section-description">
              Over 80% of commercial transport operators in Sub-Saharan Africa spend up to 60% 
              of their daily revenue on fuel. High fuel costs and vehicle maintenance leave little room for growth.
            </p>
          </div>
          
          <div className="features-grid">
            <FeatureCard
              icon="💸"
              title="60% of revenue on fuel"
              description="Operators spend the majority of earnings on expensive petrol, leaving minimal profit."
            />
            <FeatureCard
              icon="🔧"
              title="High maintenance costs"
              description="ICE vehicles require frequent servicing, eating into already thin margins."
            />
            <FeatureCard
              icon="🚫"
              title="No access to clean vehicles"
              description="Upfront costs of EVs are prohibitively high for microenterprises."
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          SOLUTION SECTION
      ============================================================ */}
      <section className="page-section section-alt" id="solution">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Our Solution</span>
            <h2 className="section-heading">Pay-as-you-earn electric mobility</h2>
            <p className="section-description">
              FleetFi makes electric vehicles accessible through a tokenized ownership model. 
              Operators pay per ride, investors earn returns, and everyone benefits from clean energy.
            </p>
          </div>
          
          <div className="features-grid four-columns">
            <FeatureCard
              icon="⚡"
              title="Zero upfront cost"
              description="No large capital investment required. Start earning from day one with pay-per-trip pricing."
            />
            <FeatureCard
              icon="🔋"
              title="Battery swap network"
              description="Instant battery swaps mean zero downtime. Keep vehicles moving and maximize earnings."
            />
            <FeatureCard
              icon="💰"
              title="Fractional ownership"
              description="Investors can own tokens representing shares in the fleet, earning returns from operations."
            />
            <FeatureCard
              icon="📊"
              title="Real-time tracking"
              description="Monitor vehicle performance, battery health, and earnings through our platform."
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS SECTION
      ============================================================ */}
      <section className="page-section" id="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">How It Works</span>
            <h2 className="section-heading">Three simple steps to clean mobility</h2>
          </div>
          
          <div className="steps-grid">
            <StepCard
              number="01"
              title="Sign up & get verified"
              description="Register as an operator, complete KYC, and get approved to access the fleet."
            />
            <StepCard
              number="02"
              title="Start operating"
              description="Get assigned an EV, swap batteries at our stations, and start earning immediately."
            />
            <StepCard
              number="03"
              title="Pay as you earn"
              description="Revenue is automatically distributed: operator earnings, investor returns, and platform fees."
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          IMPACT SECTION
      ============================================================ */}
      <section className="page-section section-alt" id="impact">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Our Impact</span>
            <h2 className="section-heading">Creating sustainable livelihoods</h2>
            <p className="section-description">
              FleetFi isn't just about electric vehicles—it's about empowering communities, 
              reducing emissions, and building a sustainable future for African transport.
            </p>
          </div>
          
          <div className="impact-grid">
            <div className="impact-card">
              <div className="impact-number">+40%</div>
              <h3 className="impact-label">Increase in daily income</h3>
              <p className="impact-description">
                Operators earn more by spending less on energy and maintenance.
              </p>
            </div>
            <div className="impact-card">
              <div className="impact-number">-70%</div>
              <h3 className="impact-label">CO₂ emissions reduction</h3>
              <p className="impact-description">
                Every EV on the road cuts carbon emissions dramatically.
              </p>
            </div>
            <div className="impact-card">
              <div className="impact-number">100%</div>
              <h3 className="impact-label">Renewable energy powered</h3>
              <p className="impact-description">
                Our battery swap stations run on clean, biogas-generated electricity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CONTACT SECTION
      ============================================================ */}
      <section className="page-section" id="contact">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Get In Touch</span>
            <h2 className="section-heading">Let's build the future of mobility together</h2>
            <p className="section-description">
              Whether you're an operator, investor, or partner, we'd love to hear from you.
            </p>
          </div>
          
          <div className="contact-container">
            {/* Contact Form */}
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-row">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                />
                <input
                  type="text"
                  name="company"
                  placeholder="Company (Optional)"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
              
              <select
                name="interest"
                value={formData.interest}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="partnership">Partnership Inquiry</option>
                <option value="operator">Become an Operator</option>
                <option value="investor">Investment Opportunity</option>
                <option value="other">General Inquiry</option>
              </select>
              
              <textarea
                name="message"
                placeholder="Tell us more about your interest... *"
                value={formData.message}
                onChange={handleInputChange}
                required
                rows={6}
                className="form-textarea"
              />
              
              {formStatus.message && (
                <div className={`form-alert alert-${formStatus.type}`}>
                  {formStatus.message}
                </div>
              )}
              
              <button
                type="submit"
                className="form-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message →'}
              </button>
            </form>

            {/* Contact Info */}
            <div className="contact-info">
              <div className="info-box">
                <h3>📧 Email Us</h3>
                <p>partnerships@freenergy.tech</p>
              </div>
              <div className="info-box">
                <h3>📍 Location</h3>
                <p>Lagos, Nigeria</p>
              </div>
              <div className="info-box">
                <h3>💬 WhatsApp</h3>
                <button onClick={openWhatsApp} className="btn-whatsapp">
                  Chat with us →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOOTER
      ============================================================ */}
      <footer className="page-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-column">
              <h3 className="footer-brand">FleetFi</h3>
              <p className="footer-tagline">
                Clean mobility solutions for African transport microenterprises.
              </p>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-heading">Product</h4>
              <ul className="footer-menu">
                <li><button onClick={() => scrollTo('problem')}>The Challenge</button></li>
                <li><button onClick={() => scrollTo('solution')}>Our Solution</button></li>
                <li><button onClick={() => scrollTo('how-it-works')}>How It Works</button></li>
                <li><button onClick={() => scrollTo('impact')}>Impact</button></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-menu">
                <li><button onClick={() => scrollTo('contact')}>Contact</button></li>
                <li><button onClick={goToLogin}>Login</button></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4 className="footer-heading">Connect</h4>
              <ul className="footer-menu">
                <li><a href="mailto:partnerships@freenergy.tech">Email</a></li>
                <li><button onClick={openWhatsApp}>WhatsApp</button></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2025 Freenergy Tech. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ============================================================
          FLOATING ACTION BUTTONS
      ============================================================ */}
      <button 
        onClick={openWhatsApp} 
        className="fab whatsapp-fab"
        aria-label="Chat on WhatsApp"
      >
        💬
      </button>

      {showScrollTop && (
        <button 
          onClick={scrollToTop} 
          className="fab scroll-fab"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
};

export default LandingPage;

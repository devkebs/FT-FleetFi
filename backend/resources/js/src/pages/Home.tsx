import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '80px 0', color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '56px', fontWeight: '800', marginBottom: '24px', lineHeight: '1.2' }}>
            FleetFi
          </h1>
          <p style={{ fontSize: '24px', marginBottom: '16px', opacity: '0.95' }}>
            Tokenized EV Fleet Management Platform
          </p>
          <p style={{ fontSize: '18px', marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px', opacity: '0.9' }}>
            Revolutionizing electric vehicle fleet management through blockchain technology.
            Invest in EV assets, operate vehicles, and earn revenue seamlessly.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                style={{
                  background: 'white',
                  color: '#667eea',
                  padding: '16px 40px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  style={{
                    background: 'white',
                    color: '#667eea',
                    padding: '16px 40px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  style={{
                    background: 'transparent',
                    color: 'white',
                    border: '2px solid white',
                    padding: '16px 40px',
                    borderRadius: '12px',
                    fontSize: '18px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ maxWidth: '1200px', margin: '80px auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚗</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#1a202c' }}>
              Manage Fleet
            </h3>
            <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
              Track and manage your electric vehicle fleet in real-time with comprehensive analytics and insights.
            </p>
          </div>

          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#1a202c' }}>
              Invest & Earn
            </h3>
            <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
              Tokenize EV assets and earn revenue from fleet operations with complete transparency.
            </p>
          </div>

          <div style={{ background: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔗</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#1a202c' }}>
              Blockchain Powered
            </h3>
            <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
              Secure, transparent transactions powered by cutting-edge blockchain technology.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div style={{ background: '#f7fafc', padding: '60px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#667eea', marginBottom: '8px' }}>100+</div>
              <div style={{ color: '#4a5568', fontSize: '18px' }}>Active Vehicles</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#667eea', marginBottom: '8px' }}>$2M+</div>
              <div style={{ color: '#4a5568', fontSize: '18px' }}>Revenue Generated</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#667eea', marginBottom: '8px' }}>500+</div>
              <div style={{ color: '#4a5568', fontSize: '18px' }}>Investors</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '800', color: '#667eea', marginBottom: '8px' }}>24/7</div>
              <div style={{ color: '#4a5568', fontSize: '18px' }}>Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

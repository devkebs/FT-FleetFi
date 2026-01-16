import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, walletRes] = await Promise.all([
          apiService.getAnalytics(),
          apiService.getWallet().catch(() => null),
        ]);

        setStats({
          analytics: analyticsRes.data,
          wallet: walletRes?.data,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '256px' }}>
        <div style={{ fontSize: '20px', color: '#6b7280' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: '700', color: '#1a202c' }}>Dashboard</h1>
        <p style={{ color: '#6b7280', marginTop: '8px' }}>Welcome back, {user?.name}!</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Role</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>KYC Status</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', textTransform: 'capitalize' }}>
            {user?.kyc_status || 'Not Started'}
          </div>
        </div>

        {stats?.wallet && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Wallet Balance</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
              {stats.wallet.currency} {(stats.wallet.balance / 100).toFixed(2)}
            </div>
          </div>
        )}

        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Email</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', wordBreak: 'break-all' }}>{user?.email}</div>
        </div>
      </div>

      {user?.role === 'operator' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Operator Overview</h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            Manage your vehicle operations, track revenue, and view your operational statistics.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              to="/vehicles"
              style={{
                background: '#667eea',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              View Vehicles
            </Link>
            <Link
              to="/operations"
              style={{
                background: '#e5e7eb',
                color: '#1f2937',
                padding: '10px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              My Operations
            </Link>
          </div>
        </div>
      )}

      {user?.role === 'investor' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Investor Overview</h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            Track your investments, view your portfolio performance, and explore new investment opportunities.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link
              to="/investments"
              style={{
                background: '#667eea',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              View Investments
            </Link>
            <Link
              to="/portfolio"
              style={{
                background: '#e5e7eb',
                color: '#1f2937',
                padding: '10px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              Portfolio
            </Link>
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Admin Panel</h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>
            Manage users, vehicles, operations, and view system-wide analytics.
          </p>
          <div>
            <Link
              to="/admin"
              style={{
                background: '#667eea',
                color: 'white',
                padding: '10px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '600',
                display: 'inline-block',
              }}
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link
              to="/wallet"
              style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}
            >
              → View Wallet
            </Link>
            {user?.role === 'operator' && (
              <>
                <Link
                  to="/vehicles"
                  style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}
                >
                  → Manage Vehicles
                </Link>
                <Link
                  to="/operations"
                  style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}
                >
                  → Fleet Operations
                </Link>
              </>
            )}
            {user?.role === 'investor' && (
              <>
                <Link
                  to="/investments"
                  style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}
                >
                  → My Investments
                </Link>
                <Link
                  to="/portfolio"
                  style={{ color: '#667eea', textDecoration: 'none', fontWeight: '500' }}
                >
                  → Portfolio Performance
                </Link>
              </>
            )}
          </div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Recent Activity</h3>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No recent activity to display</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

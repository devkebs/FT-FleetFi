import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  subtext?: string;
}

interface QuickStatsWidgetProps {
  role: 'investor' | 'operator' | 'driver' | 'admin';
  refreshInterval?: number; // in milliseconds, default 30000 (30s)
  compact?: boolean;
}

// API response interfaces
interface PortfolioResponse {
  data?: {
    total_value?: number;
    investments?: unknown[];
    active_assets?: number;
  };
  total_value?: number;
  investments?: unknown[];
  active_assets?: number;
}

interface PayoutsResponse {
  total_earnings?: number;
  payouts?: Array<{ status?: string }>;
}

interface FleetResponse {
  data?: unknown[];
}

interface TelemetryResponse {
  telemetry?: Array<{
    status?: string;
    battery_level?: number;
  }>;
}

interface DriverMetricsResponse {
  today_earnings?: number;
  trips_today?: number;
  total_trips?: number;
  rating?: number;
}

interface SwapStatsResponse {
  today?: {
    count?: number;
    avg_duration?: number;
  };
}

interface AdminOverviewResponse {
  total_users?: number;
  user_growth?: number;
  active_assets?: number;
  revenue_today?: number;
  pending_kyc?: number;
}

export const QuickStatsWidget: React.FC<QuickStatsWidgetProps> = ({
  role,
  refreshInterval = 30000,
  compact = false
}) => {
  const [stats, setStats] = useState<StatCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Default stats when API fails
  const getDefaultInvestorStats = (): StatCard[] => [
    { label: 'Portfolio Value', value: '-', icon: 'bi-wallet2', color: 'primary' },
    { label: 'Total Earnings', value: '-', icon: 'bi-graph-up-arrow', color: 'success' },
    { label: 'Active Assets', value: '-', icon: 'bi-ev-station', color: 'info' },
    { label: 'Pending Payouts', value: '-', icon: 'bi-hourglass-split', color: 'warning' }
  ];

  const getDefaultOperatorStats = (): StatCard[] => [
    { label: 'Total Fleet', value: '-', icon: 'bi-truck', color: 'primary' },
    { label: 'In Use', value: '-', icon: 'bi-play-circle', color: 'success' },
    { label: 'Charging', value: '-', icon: 'bi-lightning-charge', color: 'warning' },
    { label: 'Avg Battery', value: '-', icon: 'bi-battery-half', color: 'info' }
  ];

  const getDefaultDriverStats = (): StatCard[] => [
    { label: "Today's Earnings", value: '-', icon: 'bi-cash-stack', color: 'success' },
    { label: 'Total Trips', value: '-', icon: 'bi-bicycle', color: 'primary' },
    { label: 'Swaps Today', value: '-', icon: 'bi-arrow-repeat', color: 'info' },
    { label: 'Rating', value: '-', icon: 'bi-star-fill', color: 'warning' }
  ];

  const getDefaultAdminStats = (): StatCard[] => [
    { label: 'Total Users', value: '-', icon: 'bi-people', color: 'primary' },
    { label: 'Active Assets', value: '-', icon: 'bi-truck', color: 'success' },
    { label: 'Revenue Today', value: '-', icon: 'bi-currency-dollar', color: 'info' },
    { label: 'Pending KYC', value: '-', icon: 'bi-person-badge', color: 'warning' }
  ];

  const fetchInvestorStats = async (): Promise<StatCard[]> => {
    try {
      const [portfolioRes, payoutsRes] = await Promise.all([
        apiClient.get('/investments/portfolio').catch(() => ({} as PortfolioResponse)),
        apiClient.get('/payouts/my').catch(() => ({} as PayoutsResponse))
      ]) as [PortfolioResponse, PayoutsResponse];

      const portfolio = portfolioRes?.data || portfolioRes || {};
      const payouts = payoutsRes || {};

      return [
        {
          label: 'Portfolio Value',
          value: formatCurrency(portfolio?.total_value || 0),
          icon: 'bi-wallet2',
          color: 'primary',
          subtext: `${portfolio?.investments?.length || 0} investments`
        },
        {
          label: 'Total Earnings',
          value: formatCurrency(payouts?.total_earnings || 0),
          icon: 'bi-graph-up-arrow',
          color: 'success',
          trend: {
            value: 12.5,
            direction: 'up'
          }
        },
        {
          label: 'Active Assets',
          value: portfolio?.active_assets || 0,
          icon: 'bi-ev-station',
          color: 'info',
          subtext: 'Generating revenue'
        },
        {
          label: 'Pending Payouts',
          value: payouts?.payouts?.filter((p) => p.status === 'pending')?.length || 0,
          icon: 'bi-hourglass-split',
          color: 'warning'
        }
      ];
    } catch {
      return getDefaultInvestorStats();
    }
  };

  const fetchOperatorStats = async (): Promise<StatCard[]> => {
    try {
      const [fleetRes, telemetryRes] = await Promise.all([
        apiClient.get('/assets').catch(() => ({} as FleetResponse)),
        apiClient.get('/telemetry/live').catch(() => ({} as TelemetryResponse))
      ]) as [FleetResponse, TelemetryResponse];

      const assets = fleetRes?.data || [];
      const telemetry = telemetryRes?.telemetry || [];

      const activeVehicles = telemetry.filter((t) => t.status === 'in_use' || t.status === 'active').length;
      const chargingVehicles = telemetry.filter((t) => t.status === 'charging').length;
      const avgBattery = telemetry.length > 0
        ? telemetry.reduce((sum: number, t) => sum + (t.battery_level || 0), 0) / telemetry.length
        : 0;

      return [
        {
          label: 'Total Fleet',
          value: Array.isArray(assets) ? assets.length : 0,
          icon: 'bi-truck',
          color: 'primary',
          subtext: `${activeVehicles} active now`
        },
        {
          label: 'In Use',
          value: activeVehicles,
          icon: 'bi-play-circle',
          color: 'success',
          trend: {
            value: 5,
            direction: 'up'
          }
        },
        {
          label: 'Charging',
          value: chargingVehicles,
          icon: 'bi-lightning-charge',
          color: 'warning'
        },
        {
          label: 'Avg Battery',
          value: `${avgBattery.toFixed(0)}%`,
          icon: 'bi-battery-half',
          color: avgBattery > 50 ? 'success' : avgBattery > 20 ? 'warning' : 'danger'
        }
      ];
    } catch {
      return getDefaultOperatorStats();
    }
  };

  const fetchDriverStats = async (): Promise<StatCard[]> => {
    try {
      const [metricsRes, swapStatsRes] = await Promise.all([
        apiClient.get('/drivers/metrics').catch(() => ({} as DriverMetricsResponse)),
        apiClient.get('/fleet/drivers/me/swap-stats').catch(() => ({} as SwapStatsResponse))
      ]) as [DriverMetricsResponse, SwapStatsResponse];

      const metrics = metricsRes || {};
      const swapStats = swapStatsRes || {};

      return [
        {
          label: "Today's Earnings",
          value: formatCurrency(metrics?.today_earnings || 0),
          icon: 'bi-cash-stack',
          color: 'success',
          subtext: `${metrics?.trips_today || 0} trips`
        },
        {
          label: 'Total Trips',
          value: metrics?.total_trips || 0,
          icon: 'bi-bicycle',
          color: 'primary'
        },
        {
          label: 'Swaps Today',
          value: swapStats?.today?.count || 0,
          icon: 'bi-arrow-repeat',
          color: 'info',
          subtext: `Avg ${swapStats?.today?.avg_duration || 0} min`
        },
        {
          label: 'Rating',
          value: `${(metrics?.rating || 0).toFixed(1)}/5`,
          icon: 'bi-star-fill',
          color: 'warning'
        }
      ];
    } catch {
      return getDefaultDriverStats();
    }
  };

  const fetchAdminStats = async (): Promise<StatCard[]> => {
    try {
      const overviewRes = await apiClient.get('/admin/dashboard/overview').catch(() => ({} as AdminOverviewResponse)) as AdminOverviewResponse;
      const overview = overviewRes || {};

      return [
        {
          label: 'Total Users',
          value: overview?.total_users || 0,
          icon: 'bi-people',
          color: 'primary',
          trend: {
            value: overview?.user_growth || 0,
            direction: (overview?.user_growth || 0) >= 0 ? 'up' : 'down'
          }
        },
        {
          label: 'Active Assets',
          value: overview?.active_assets || 0,
          icon: 'bi-truck',
          color: 'success'
        },
        {
          label: 'Revenue Today',
          value: formatCurrency(overview?.revenue_today || 0),
          icon: 'bi-currency-dollar',
          color: 'info'
        },
        {
          label: 'Pending KYC',
          value: overview?.pending_kyc || 0,
          icon: 'bi-person-badge',
          color: 'warning'
        }
      ];
    } catch {
      return getDefaultAdminStats();
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      let data: StatCard[] = [];

      switch (role) {
        case 'investor':
          data = await fetchInvestorStats();
          break;
        case 'operator':
          data = await fetchOperatorStats();
          break;
        case 'driver':
          data = await fetchDriverStats();
          break;
        case 'admin':
          data = await fetchAdminStats();
          break;
      }

      setStats(data);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      console.error('Failed to fetch stats:', err);
      setError('Unable to load stats');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    fetchStats();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, refreshInterval]);

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral'): string => {
    switch (direction) {
      case 'up': return 'bi-arrow-up-short';
      case 'down': return 'bi-arrow-down-short';
      default: return 'bi-dash';
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'neutral'): string => {
    switch (direction) {
      case 'up': return 'text-success';
      case 'down': return 'text-danger';
      default: return 'text-muted';
    }
  };

  if (compact) {
    return (
      <div className="d-flex flex-wrap gap-3">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="placeholder-glow" style={{ width: '120px' }}>
              <span className="placeholder col-12 bg-secondary" style={{ height: '40px' }}></span>
            </div>
          ))
        ) : (
          stats.map((stat, index) => (
            <div
              key={index}
              className={`d-flex align-items-center p-2 rounded bg-${stat.color} bg-opacity-10`}
              style={{ minWidth: '120px' }}
            >
              <i className={`bi ${stat.icon} text-${stat.color} fs-5 me-2`}></i>
              <div>
                <div className="fw-bold small">{stat.value}</div>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>{stat.label}</div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
        <h6 className="mb-0">
          <i className="bi bi-speedometer2 me-2 text-primary"></i>
          Quick Stats
        </h6>
        <div className="d-flex align-items-center">
          {lastUpdated && (
            <small className="text-muted me-2">
              Updated {lastUpdated.toLocaleTimeString()}
            </small>
          )}
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={fetchStats}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
          </button>
        </div>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-warning py-2 mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        <div className="row g-3">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="col-6 col-md-3">
                <div className="card h-100 border-0 bg-light">
                  <div className="card-body text-center placeholder-glow">
                    <span className="placeholder col-4 mb-2"></span>
                    <span className="placeholder col-8 mb-1"></span>
                    <span className="placeholder col-6"></span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            stats.map((stat, index) => (
              <div key={index} className="col-6 col-md-3">
                <div className={`card h-100 border-0 border-start border-4 border-${stat.color} bg-light`}>
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                      <div className={`rounded-circle bg-${stat.color} bg-opacity-10 p-2 me-2`}>
                        <i className={`bi ${stat.icon} text-${stat.color} fs-5`}></i>
                      </div>
                      {stat.trend && (
                        <span className={`badge ${getTrendColor(stat.trend.direction)} bg-transparent ms-auto`}>
                          <i className={`bi ${getTrendIcon(stat.trend.direction)}`}></i>
                          {Math.abs(stat.trend.value)}%
                        </span>
                      )}
                    </div>
                    <h4 className="mb-0">{stat.value}</h4>
                    <small className="text-muted">{stat.label}</small>
                    {stat.subtext && (
                      <div className="mt-1">
                        <small className="text-muted">{stat.subtext}</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default QuickStatsWidget;

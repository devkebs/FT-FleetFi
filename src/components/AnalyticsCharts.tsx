import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface AnalyticsChartsProps {
  analyticsData: any;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ analyticsData }) => {
  if (!analyticsData) {
    return (
      <div className="alert alert-info">
        <i className="bi bi-info-circle me-2"></i>
        No analytics data available for visualization.
      </div>
    );
  }

  // Prepare data for charts
  const eventCategoryData = analyticsData.events_by_category || [];
  const topEventsData = (analyticsData.top_events || []).slice(0, 10);
  const dailyActiveUsers = analyticsData.daily_active_users || [];
  const conversionFunnel = analyticsData.conversion_funnel || {};

  // Colors for charts
  const COLORS = ['#00ff41', '#00cc33', '#00aa28', '#008822', '#006619'];
  const CHART_COLORS = {
    primary: '#00ff41',
    secondary: '#00cc33',
    accent: '#00aa28',
    grid: '#333',
    text: '#fff'
  };

  // Prepare conversion funnel data
  const funnelData = [
    { name: 'Registered', value: conversionFunnel.registered || 0 },
    { name: 'KYC Started', value: conversionFunnel.kyc_started || 0 },
    { name: 'KYC Completed', value: conversionFunnel.kyc_completed || 0 },
    { name: 'First Investment', value: conversionFunnel.first_investment || 0 }
  ];

  // Prepare daily active users for last 7 days
  const last7Days = dailyActiveUsers.slice(-7);

  return (
    <div className="row g-4">
      {/* Event Categories Pie Chart */}
      <div className="col-md-6">
        <div className="card" style={{
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid #00ff41',
          boxShadow: '0 4px 20px rgba(0, 255, 65, 0.2)'
        }}>
          <div className="card-header" style={{
            background: 'rgba(0, 255, 65, 0.1)',
            borderBottom: '1px solid #00ff41'
          }}>
            <h5 className="mb-0" style={{ color: '#00ff41' }}>
              <i className="bi bi-pie-chart me-2"></i>Events by Category
            </h5>
          </div>
          <div className="card-body">
            {eventCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventCategoryData}
                    dataKey="count"
                    nameKey="event_category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry: any) => `${entry.event_category}: ${entry.count}`}
                  >
                    {eventCategoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1a1a1a', 
                      border: '1px solid #00ff41',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center" style={{ color: '#666' }}>No category data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Events Bar Chart */}
      <div className="col-md-6">
        <div className="card" style={{
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid #00ff41',
          boxShadow: '0 4px 20px rgba(0, 255, 65, 0.2)'
        }}>
          <div className="card-header" style={{
            background: 'rgba(0, 255, 65, 0.1)',
            borderBottom: '1px solid #00ff41'
          }}>
            <h5 className="mb-0" style={{ color: '#00ff41' }}>
              <i className="bi bi-bar-chart me-2"></i>Top Events
            </h5>
          </div>
          <div className="card-body">
            {topEventsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topEventsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis 
                    dataKey="event_name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: CHART_COLORS.text }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1a1a1a', 
                      border: '1px solid #00ff41',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.primary}>
                    {topEventsData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center" style={{ color: '#666' }}>No event data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Daily Active Users Line Chart */}
      <div className="col-md-6">
        <div className="card" style={{
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid #00ff41',
          boxShadow: '0 4px 20px rgba(0, 255, 65, 0.2)'
        }}>
          <div className="card-header" style={{
            background: 'rgba(0, 255, 65, 0.1)',
            borderBottom: '1px solid #00ff41'
          }}>
            <h5 className="mb-0" style={{ color: '#00ff41' }}>
              <i className="bi bi-graph-up me-2"></i>Daily Active Users (Last 7 Days)
            </h5>
          </div>
          <div className="card-body">
            {last7Days.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fill: CHART_COLORS.text }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#1a1a1a', 
                      border: '1px solid #00ff41',
                      borderRadius: '4px',
                      color: '#fff'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString();
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke={CHART_COLORS.primary} 
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center" style={{ color: '#666' }}>No user activity data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Conversion Funnel Chart */}
      <div className="col-md-6">
        <div className="card" style={{
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid #00ff41',
          boxShadow: '0 4px 20px rgba(0, 255, 65, 0.2)'
        }}>
          <div className="card-header" style={{
            background: 'rgba(0, 255, 65, 0.1)',
            borderBottom: '1px solid #00ff41'
          }}>
            <h5 className="mb-0" style={{ color: '#00ff41' }}>
              <i className="bi bi-funnel me-2"></i>Conversion Funnel
            </h5>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis type="number" tick={{ fill: CHART_COLORS.text }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                  width={120}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#1a1a1a', 
                    border: '1px solid #00ff41',
                    borderRadius: '4px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="value" fill={CHART_COLORS.primary}>
                  {funnelData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Conversion rates */}
            <div className="mt-3" style={{ color: '#00ff41' }}>
              <small>
                {funnelData[0]?.value > 0 && (
                  <>
                    <div>Registration → KYC: {((funnelData[1]?.value / funnelData[0]?.value) * 100).toFixed(1)}%</div>
                    <div>KYC Start → Complete: {funnelData[1]?.value > 0 ? ((funnelData[2]?.value / funnelData[1]?.value) * 100).toFixed(1) : 0}%</div>
                    <div>KYC → Investment: {funnelData[2]?.value > 0 ? ((funnelData[3]?.value / funnelData[2]?.value) * 100).toFixed(1) : 0}%</div>
                  </>
                )}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

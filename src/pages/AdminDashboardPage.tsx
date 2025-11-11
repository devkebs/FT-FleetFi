import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Nav, Navbar, Dropdown, Form, InputGroup, Alert, Modal, ProgressBar } from 'react-bootstrap';
import {
  Users,
  Car,
  TrendingUp,
  Battery,
  DollarSign,
  AlertCircle,
  Settings,
  Bell,
  LogOut,
  BarChart3,
  Activity,
  UserCheck,
  Wallet,
  Key,
  Shield,
  Radio,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  FileText,
  CreditCard,
  Server,
  Database,
  Cpu,
  HardDrive,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';

// API client
const apiClient = {
  get: async (url: string) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
  post: async (url: string, body?: any) => {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
};

interface DashboardData {
  totalUsers: number;
  totalInvestors: number;
  totalOperators: number;
  totalDrivers: number;
  totalRevenue: number;
  totalAssets: number;
  activeAssets: number;
  pendingKyc: number;
}

interface KycUser {
  id: number;
  name: string;
  email: string;
  role: string;
  kyc_status: string;
  document_type?: string;
  submitted_at?: string;
}

interface Transaction {
  id: number;
  transaction_id: string;
  user?: any;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface SystemHealth {
  server: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    api_response_time: string;
  };
  services: any;
  system_info: any;
  logs: any[];
}

const AdminDashboardPage: React.FC = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    totalInvestors: 0,
    totalOperators: 0,
    totalDrivers: 0,
    totalRevenue: 0,
    totalAssets: 0,
    activeAssets: 0,
    pendingKyc: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Data states
  const [kycUsers, setKycUsers] = useState<KycUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionStats, setTransactionStats] = useState<any>({});
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Modal states
  const [showKycModal, setShowKycModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Search and filter states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [kycFilter, setKycFilter] = useState('all');
  const [transactionFilter, setTransactionFilter] = useState('all');

  // API Configuration States
  const [showTrovotechKey, setShowTrovotechKey] = useState(false);
  const [showKycKey, setShowKycKey] = useState(false);
  const [showOemKey, setShowOemKey] = useState(false);

  const [apiConfig, setApiConfig] = useState({
    trovotech_api_key: '••••••••••••••••',
    trovotech_base_url: 'https://api.trovotech.com/v1',
    kyc_provider: 'identitypass',
    kyc_api_key: '••••••••••••••••',
    kyc_base_url: 'https://api.myidentitypass.com/api/v2',
    oem_telemetry_provider: 'trovotech',
    oem_api_key: '••••••••••••••••',
    oem_base_url: 'https://telemetry.trovotech.com/api',
  });

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    window.location.href = '/';
  };

  const handleApproveKyc = async (userId: number) => {
    try {
      const response = await apiClient.post(`/admin/kyc/approve/${userId}`);
      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        // Refresh KYC data
        fetchKycData();
      }
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      alert('Failed to approve KYC. Please try again.');
    }
  };

  const handleRejectKyc = async (userId: number) => {
    try {
      const reason = prompt('Please provide a reason for rejection:');
      if (!reason) return;

      const response = await apiClient.post(`/admin/kyc/reject/${userId}`, { reason });
      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        // Refresh KYC data
        fetchKycData();
      }
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      alert('Failed to reject KYC. Please try again.');
    }
  };

  const fetchKycData = async () => {
    try {
      console.log('=== Fetching KYC Data ===');
      console.log('Auth token exists:', !!localStorage.getItem('auth_token'));
      
      const response = await apiClient.get('/admin/dashboard/kyc-management');
      console.log('KYC Response received:', response);
      console.log('Response keys:', Object.keys(response));
      
      if (response.success) {
        const kycData = response.submissions || response.kyc_submissions || [];
        console.log('✓ KYC data found:', kycData.length, 'submissions');
        setKycUsers(kycData);
      } else {
        console.error('✗ KYC Response success=false:', response);
      }
    } catch (error) {
      console.error('✗ Failed to fetch KYC data:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      console.log('=== Fetching Transactions ===');
      const params = transactionFilter !== 'all' ? `?type=${transactionFilter}` : '';
      const response = await apiClient.get(`/admin/transactions${params}`);
      console.log('Transactions Response:', response);
      
      if (response.success) {
        const txnData = response.transactions || [];
        console.log('✓ Transactions found:', txnData.length);
        setTransactions(txnData);
        setTransactionStats(response.statistics || {});
      } else {
        console.error('✗ Transactions fetch failed:', response);
      }
    } catch (error) {
      console.error('✗ Failed to fetch transactions:', error);
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await apiClient.get('/admin/system-health');
      if (response.success) {
        setSystemHealth(response.system_health);
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('=== Fetching Users ===');
      console.log('Auth token exists:', !!localStorage.getItem('auth_token'));
      console.log('Making request to: /admin/users');
      
      const response = await apiClient.get('/admin/users');
      console.log('Users Response received:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response));
      
      if (response.success) {
        const usersData = response.users || [];
        console.log('✓ Users data found:', usersData.length, 'users');
        setUsers(usersData);
      } else {
        console.error('✗ Response success=false:', response);
      }
    } catch (error) {
      console.error('✗ Failed to fetch users:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
  };

  const handleConfigChange = (field: string, value: string) => {
    setApiConfig(prev => ({ ...prev, [field]: value }));
  };

  const fetchFleetData = async () => {
    try {
      const response = await apiClient.get('/admin/dashboard/fleet-analytics');
      if (response.success && response.analytics) {
        // Store fleet analytics data
        console.log('Fleet analytics:', response.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch fleet data:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const response = await apiClient.get('/admin/dashboard/revenue-analytics');
      if (response.success) {
        // Store revenue analytics data
        console.log('Analytics data:', response);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const response = await apiClient.post('/admin/api-config', {
        trovotech_api_key: apiConfig.trovotech_api_key !== '••••••••••••••••' ? apiConfig.trovotech_api_key : null,
        trovotech_api_url: apiConfig.trovotech_base_url,
        kyc_api_key: apiConfig.kyc_api_key !== '••••••••••••••••' ? apiConfig.kyc_api_key : null,
        kyc_api_url: apiConfig.kyc_base_url,
        oem_api_key: apiConfig.oem_api_key !== '••••••••••••••••' ? apiConfig.oem_api_key : null,
        oem_api_url: apiConfig.oem_base_url,
      });

      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching dashboard overview...');
        const data = await apiClient.get('/admin/dashboard/overview');
        console.log('✓ Dashboard overview loaded:', data);
        setDashboardData({
          totalUsers: data.overview?.users?.total || 35,
          totalInvestors: data.overview?.users?.by_role?.investor || 12,
          totalOperators: data.overview?.users?.by_role?.operator || 5,
          totalDrivers: data.overview?.users?.by_role?.driver || 15,
          totalRevenue: data.overview?.revenue?.total || 0,
          totalAssets: data.overview?.assets?.total || 50,
          activeAssets: data.overview?.assets?.active || 45,
          pendingKyc: data.overview?.users?.pending_kyc || 5,
        });
      } catch (err) {
        console.error('✗ Failed to fetch dashboard data:', err);
        // Use demo data on error
        setDashboardData({
          totalUsers: 35,
          totalInvestors: 12,
          totalOperators: 5,
          totalDrivers: 15,
          totalRevenue: 567890,
          totalAssets: 50,
          activeAssets: 45,
          pendingKyc: 5,
        });
      } finally {
        console.log('✓ Setting loading to false');
        setLoading(false);
      }
    };

    // Force loading to stop after 10 seconds
    const timeoutId = setTimeout(() => {
      console.warn('⚠️ Loading timeout - forcing loading to false');
      setLoading(false);
    }, 10000);

    fetchDashboardData();
    fetchUsers();

    return () => clearTimeout(timeoutId);
  }, []);

  // Fetch data when switching tabs
  useEffect(() => {
    if (activeTab === 'kyc') {
      fetchKycData();
    } else if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'system') {
      fetchSystemHealth();
    } else if (activeTab === 'fleet') {
      fetchFleetData();
    } else if (activeTab === 'analytics') {
      fetchAnalyticsData();
    }
  }, [activeTab, transactionFilter]);

  // Sample chart data
  const revenueData = [
    { month: 'Jan', revenue: 45000, users: 25 },
    { month: 'Feb', revenue: 52000, users: 28 },
    { month: 'Mar', revenue: 48000, users: 30 },
    { month: 'Apr', revenue: 61000, users: 32 },
    { month: 'May', revenue: 55000, users: 33 },
    { month: 'Jun', revenue: 67000, users: 35 },
  ];

  const userDistribution = [
    { name: 'Investors', value: dashboardData.totalInvestors, color: '#0d6efd' },
    { name: 'Drivers', value: dashboardData.totalDrivers, color: '#198754' },
    { name: 'Operators', value: dashboardData.totalOperators, color: '#ffc107' },
    { name: 'Admins', value: 3, color: '#dc3545' },
  ];

  const recentActivities = [
    { id: 1, user: 'John Investor', action: 'New investment of $50,000', time: '5 min ago', type: 'success' },
    { id: 2, user: 'Sarah Operator', action: 'Added new vehicle to fleet', time: '15 min ago', type: 'info' },
    { id: 3, user: 'Mike Driver', action: 'Completed 10 rides today', time: '1 hour ago', type: 'primary' },
    { id: 4, user: 'Emily Davis', action: 'KYC verification pending', time: '2 hours ago', type: 'warning' },
    { id: 5, user: 'System', action: 'Monthly payout processed', time: '3 hours ago', type: 'success' },
  ];

  const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <p className="text-muted mb-1 small">{title}</p>
            <h3 className="mb-0">{value}</h3>
            {subtitle && <small className="text-muted">{subtitle}</small>}
          </div>
          <div className={`rounded-circle p-3 bg-${color} bg-opacity-10`}>
            <Icon className={`text-${color}`} size={24} />
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  // Check both localStorage and sessionStorage since login may use either
  const hasToken = !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
  if (!hasToken) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card shadow-lg" style={{ maxWidth: '500px' }}>
          <div className="card-body text-center p-5">
            <div className="text-danger mb-3">
              <AlertCircle size={64} />
            </div>
            <h3 className="mb-3">Authentication Required</h3>
            <p className="text-muted mb-4">
              You must be logged in to access the admin dashboard.
              Please click the "Admin" link in the navigation menu to login.
            </p>
            <div className="alert alert-info">
              <strong>Default Credentials:</strong><br />
              Email: <code>admin@fleetfi.com</code><br />
              Password: <code>admin123</code>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/'}
            >
              Go to Home Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Top Navigation */}
      <Navbar bg="white" className="border-bottom shadow-sm">
        <Container fluid>
          <Navbar.Brand className="fw-bold text-primary">
            <Activity className="me-2" size={24} />
            FleetFi Admin
          </Navbar.Brand>

          <div className="d-flex align-items-center gap-3">
            <Button variant="outline-secondary" size="sm">
              <Bell size={18} />
            </Button>
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <UserCheck size={18} className="me-2" />
                {user?.name || 'Admin'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item>
                  <Settings size={16} className="me-2" />
                  Settings
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <LogOut size={16} className="me-2" />
                  Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container fluid className="py-4">
        {/* Navigation Tabs */}
        <Nav variant="pills" className="mb-4 flex-wrap">
          <Nav.Item>
            <Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              <BarChart3 size={16} className="me-2" />
              Overview
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
              <Users size={16} className="me-2" />
              Users
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'kyc'} onClick={() => setActiveTab('kyc')}>
              <Shield size={16} className="me-2" />
              KYC Management
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'fleet'} onClick={() => setActiveTab('fleet')}>
              <Car size={16} className="me-2" />
              Fleet
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')}>
              <CreditCard size={16} className="me-2" />
              Transactions
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')}>
              <TrendingUp size={16} className="me-2" />
              Analytics
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'system'} onClick={() => setActiveTab('system')}>
              <Server size={16} className="me-2" />
              System Health
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
              <Settings size={16} className="me-2" />
              API Settings
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {saveSuccess && (
          <Alert variant="success" dismissible onClose={() => setSaveSuccess(false)}>
            <strong>Success!</strong> API configuration saved successfully.
          </Alert>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Cards */}
            <Row className="g-3 mb-4">
              <Col md={3}>
                <StatCard
                  title="Total Users"
                  value={dashboardData.totalUsers}
                  icon={Users}
                  color="primary"
                  subtitle={`${dashboardData.pendingKyc} pending KYC`}
                />
              </Col>
              <Col md={3}>
                <StatCard
                  title="Total Revenue"
                  value={`$${(dashboardData.totalRevenue / 1000).toFixed(1)}K`}
                  icon={DollarSign}
                  color="success"
                  subtitle="This month"
                />
              </Col>
              <Col md={3}>
                <StatCard
                  title="Active Assets"
                  value={`${dashboardData.activeAssets}/${dashboardData.totalAssets}`}
                  icon={Car}
                  color="info"
                  subtitle="Fleet utilization 90%"
                />
              </Col>
              <Col md={3}>
                <StatCard
                  title="Avg Battery Health"
                  value="94%"
                  icon={Battery}
                  color="warning"
                  subtitle="Across all vehicles"
                />
              </Col>
            </Row>

            {/* Charts Row */}
            <Row className="g-3 mb-4">
              <Col lg={8}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">Revenue & User Growth</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#0d6efd" strokeWidth={2} name="Revenue ($)" />
                        <Line yAxisId="right" type="monotone" dataKey="users" stroke="#198754" strokeWidth={2} name="Total Users" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={4}>
                <Card className="shadow-sm">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">User Distribution</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={userDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {userDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Recent Activity */}
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h6 className="mb-0">Recent Activity</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover className="mb-0">
                  <tbody>
                    {recentActivities.map((activity) => (
                      <tr key={activity.id}>
                        <td className="align-middle" style={{ width: '50px' }}>
                          <div className={`rounded-circle bg-${activity.type} bg-opacity-10 p-2 d-inline-block`}>
                            <Activity className={`text-${activity.type}`} size={16} />
                          </div>
                        </td>
                        <td className="align-middle">
                          <strong>{activity.user}</strong>
                          <div className="small text-muted">{activity.action}</div>
                        </td>
                        <td className="align-middle text-end text-muted small">{activity.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Row>
            <Col lg={12}>
              <Card className="shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">User Management</h6>
                  <div className="d-flex gap-2">
                    <InputGroup style={{ width: '300px' }}>
                      <InputGroup.Text>
                        <Search size={16} />
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Search users..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                    <Button variant="outline-secondary" size="sm" title="Advanced Filters">
                      <Filter size={16} />
                    </Button>
                    <Button variant="primary" size="sm">Add User</Button>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive>
                    <thead className="table-light">
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>KYC Status</th>
                        <th>Wallet Balance</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(u => {
                          if (!userSearchTerm) return true;
                          const searchLower = userSearchTerm.toLowerCase();
                          return u.name?.toLowerCase().includes(searchLower) ||
                                 u.email?.toLowerCase().includes(searchLower) ||
                                 u.role?.toLowerCase().includes(searchLower);
                        })
                        .map((userData: any) => {
                          const roleColors: any = {
                            admin: 'danger',
                            operator: 'warning',
                            investor: 'primary',
                            driver: 'success',
                          };
                          const kycColors: any = {
                            verified: 'success',
                            pending: 'warning',
                            submitted: 'info',
                            rejected: 'danger',
                          };

                          return (
                            <tr key={userData.id}>
                              <td>{userData.name}</td>
                              <td>{userData.email}</td>
                              <td><Badge bg={roleColors[userData.role] || 'secondary'}>{userData.role}</Badge></td>
                              <td><Badge bg={kycColors[userData.kyc_status] || 'secondary'}>{userData.kyc_status}</Badge></td>
                              <td>${(userData.wallet?.balance || userData.wallet_balance || 0).toLocaleString()}</td>
                              <td>
                                <Button variant="sm" size="sm" className="me-1" onClick={() => { setSelectedUser(userData); setShowKycModal(true); }}>View</Button>
                                <Button variant="outline-secondary" size="sm">Edit</Button>
                              </td>
                            </tr>
                          );
                        })}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-muted">
                            No users found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Fleet Tab */}
        {activeTab === 'fleet' && (
          <Row>
            <Col lg={12}>
              <Card className="shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Fleet Management</h6>
                  <Button variant="primary" size="sm">Add Vehicle</Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive>
                    <thead className="table-light">
                      <tr>
                        <th>Asset ID</th>
                        <th>Model</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Battery Health</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>ASSET-00001</td>
                        <td>E-Bike Pro 2024</td>
                        <td>Electric Bike</td>
                        <td><Badge bg="success">Active</Badge></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Battery size={16} className="text-success me-2" />
                            95%
                          </div>
                        </td>
                        <td>Lagos, Nigeria</td>
                        <td>
                          <Button variant="sm" size="sm" className="me-1">View</Button>
                          <Button variant="outline-secondary" size="sm">Edit</Button>
                        </td>
                      </tr>
                      <tr>
                        <td>ASSET-00002</td>
                        <td>Tesla Model 3</td>
                        <td>Electric Car</td>
                        <td><Badge bg="success">Active</Badge></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Battery size={16} className="text-success me-2" />
                            92%
                          </div>
                        </td>
                        <td>Nairobi, Kenya</td>
                        <td>
                          <Button variant="sm" size="sm" className="me-1">View</Button>
                          <Button variant="outline-secondary" size="sm">Edit</Button>
                        </td>
                      </tr>
                      <tr>
                        <td>ASSET-00003</td>
                        <td>E-Scooter Pro</td>
                        <td>Electric Scooter</td>
                        <td><Badge bg="warning">Maintenance</Badge></td>
                        <td>
                          <div className="d-flex align-items-center">
                            <Battery size={16} className="text-warning me-2" />
                            78%
                          </div>
                        </td>
                        <td>Accra, Ghana</td>
                        <td>
                          <Button variant="sm" size="sm" className="me-1">View</Button>
                          <Button variant="outline-secondary" size="sm">Edit</Button>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <Row className="g-3">
            <Col lg={6}>
              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Monthly Revenue Trend</h6>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#0d6efd" name="Revenue ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">Platform Statistics</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <div>
                      <strong>Total Investments</strong>
                      <div className="text-muted small">Last 30 days</div>
                    </div>
                    <h4 className="text-success mb-0">$1.2M</h4>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <div>
                      <strong>Total Rides</strong>
                      <div className="text-muted small">Last 30 days</div>
                    </div>
                    <h4 className="text-primary mb-0">10,234</h4>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <div>
                      <strong>Energy Saved</strong>
                      <div className="text-muted small">CO2 reduction</div>
                    </div>
                    <h4 className="text-info mb-0">5.2 tons</h4>
                  </div>
                  <div className="d-flex justify-content-between align-items-center p-3">
                    <div>
                      <strong>Customer Satisfaction</strong>
                      <div className="text-muted small">Average rating</div>
                    </div>
                    <h4 className="text-warning mb-0">4.8/5</h4>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* KYC Management Tab */}
        {activeTab === 'kyc' && (
          <Row>
            <Col lg={12}>
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">KYC Verification Management</h6>
                  <div>
                    <Form.Select size="sm" style={{ width: '200px' }} value={kycFilter} onChange={(e) => setKycFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </Form.Select>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive>
                    <thead className="table-light">
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>KYC Status</th>
                        <th>Document Type</th>
                        <th>Submitted Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kycUsers
                        .filter(u => kycFilter === 'all' || u.kyc_status === kycFilter)
                        .map((kycUser) => {
                          const roleColors: any = {
                            admin: 'danger',
                            operator: 'warning',
                            investor: 'primary',
                            driver: 'success',
                          };
                          const kycColors: any = {
                            verified: 'success',
                            pending: 'secondary',
                            submitted: 'warning',
                            rejected: 'danger',
                          };
                          const kycIcons: any = {
                            verified: CheckCircle,
                            pending: Clock,
                            submitted: Clock,
                            rejected: XCircle,
                          };

                          const KycIcon = kycIcons[kycUser.kyc_status] || Clock;
                          const isVerified = kycUser.kyc_status === 'verified';

                          return (
                            <tr key={kycUser.id}>
                              <td>{kycUser.name}</td>
                              <td>{kycUser.email}</td>
                              <td><Badge bg={roleColors[kycUser.role] || 'secondary'}>{kycUser.role}</Badge></td>
                              <td>
                                <Badge bg={kycColors[kycUser.kyc_status] || 'secondary'}>
                                  <KycIcon size={14} className="me-1" />
                                  {kycUser.kyc_status}
                                </Badge>
                              </td>
                              <td>{kycUser.document_type || 'Not specified'}</td>
                              <td>{kycUser.submitted_at || 'N/A'}</td>
                              <td>
                                {!isVerified ? (
                                  <>
                                    <Button variant="success" size="sm" className="me-1" onClick={() => handleApproveKyc(kycUser.id)}>
                                      <CheckCircle size={14} className="me-1" />
                                      Approve
                                    </Button>
                                    <Button variant="danger" size="sm" className="me-1" onClick={() => handleRejectKyc(kycUser.id)}>
                                      <XCircle size={14} className="me-1" />
                                      Reject
                                    </Button>
                                    <Button variant="outline-primary" size="sm" onClick={() => { setSelectedUser(kycUser); setShowKycModal(true); }}>
                                      <Eye size={14} className="me-1" />
                                      View Docs
                                    </Button>
                                  </>
                                ) : (
                                  <Button variant="outline-secondary" size="sm" disabled>
                                    Already Verified
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      {kycUsers.filter(u => kycFilter === 'all' || u.kyc_status === kycFilter).length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-muted">
                            No KYC submissions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* KYC Statistics */}
              <Row className="g-3">
                <Col md={3}>
                  <Card className="shadow-sm text-center">
                    <Card.Body>
                      <div className="text-warning mb-2">
                        <Clock size={32} />
                      </div>
                      <h4>{kycUsers.filter(u => u.kyc_status === 'pending' || u.kyc_status === 'submitted').length}</h4>
                      <small className="text-muted">Pending Review</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm text-center">
                    <Card.Body>
                      <div className="text-success mb-2">
                        <CheckCircle size={32} />
                      </div>
                      <h4>{kycUsers.filter(u => u.kyc_status === 'verified').length}</h4>
                      <small className="text-muted">Verified</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm text-center">
                    <Card.Body>
                      <div className="text-danger mb-2">
                        <XCircle size={32} />
                      </div>
                      <h4>{kycUsers.filter(u => u.kyc_status === 'rejected').length}</h4>
                      <small className="text-muted">Rejected</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm text-center">
                    <Card.Body>
                      <div className="text-primary mb-2">
                        <Users size={32} />
                      </div>
                      <h4>{kycUsers.length}</h4>
                      <small className="text-muted">Total Users</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <Row>
            <Col lg={12}>
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Transaction Monitoring</h6>
                  <div className="d-flex gap-2">
                    <Form.Select size="sm" style={{ width: '150px' }} value={transactionFilter} onChange={(e) => setTransactionFilter(e.target.value)}>
                      <option value="all">All Types</option>
                        <option value="investment">Investments</option>
                        <option value="payout">Payouts</option>
                        <option value="ride">Ride Payments</option>
                        <option value="deposit">Deposits</option>
                        <option value="withdrawal">Withdrawals</option>
                        <option value="transfer">Transfers</option>
                    </Form.Select>
                    <Button variant="outline-primary" size="sm" className="me-1">
                      <Download size={14} className="me-1" />
                      Export
                    </Button>
                    <Button variant="outline-secondary" size="sm">
                      <Upload size={14} className="me-1" />
                      Import
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover responsive>
                    <thead className="table-light">
                      <tr>
                        <th>Transaction ID</th>
                        <th>User</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                        {transactions.map((txn) => {
                          const typeColors: any = {
                            investment: 'primary',
                            payout: 'info',
                            ride: 'warning',
                            deposit: 'success',
                            withdrawal: 'danger',
                            transfer: 'secondary',
                          };
                          const statusColors: any = {
                            completed: 'success',
                            pending: 'warning',
                            failed: 'danger',
                          };

                          return (
                            <tr key={txn.id}>
                              <td><code>{txn.transaction_id || `TXN-${txn.id}`}</code></td>
                              <td>{txn.user?.name || 'N/A'}</td>
                              <td><Badge bg={typeColors[txn.type] || 'secondary'}>{txn.type}</Badge></td>
                              <td className={txn.amount >= 0 ? 'text-success fw-bold' : 'text-danger'}>
                                {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount).toLocaleString()}
                              </td>
                              <td><Badge bg={statusColors[txn.status] || 'secondary'}>{txn.status}</Badge></td>
                              <td>{new Date(txn.created_at).toLocaleString()}</td>
                              <td>
                                <Button variant="outline-primary" size="sm" onClick={() => { setSelectedTransaction(txn); setShowTransactionModal(true); }}>View</Button>
                              </td>
                            </tr>
                          );
                        })}
                        {transactions.length === 0 && (
                          <tr>
                            <td colSpan={7} className="text-center py-4 text-muted">
                              No transactions found
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>

              {/* Transaction Statistics */}
              <Row className="g-3">
                <Col md={3}>
                  <Card className="shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">Total Volume (24h)</small>
                            <h4 className="mb-0">${(transactionStats.total_volume_24h || 0).toLocaleString()}</h4>
                        </div>
                        <TrendingUp className="text-success" size={32} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">Transactions (24h)</small>
                            <h4 className="mb-0">{(transactionStats.total_count_24h || 0).toLocaleString()}</h4>
                        </div>
                        <Activity className="text-primary" size={32} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">Pending Review</small>
                            <h4 className="mb-0">{transactionStats.pending_count || 0}</h4>
                        </div>
                        <Clock className="text-warning" size={32} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">Success Rate</small>
                            <h4 className="mb-0">{transactionStats.success_rate || 0}%</h4>
                        </div>
                        <CheckCircle className="text-success" size={32} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        )}

        {/* System Health Tab */}
        {activeTab === 'system' && (
          <Row className="g-3">
            <Col lg={12}>
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <Server size={18} className="me-2" />
                    System Health Monitor
                  </h6>
                  <Button size="sm" variant="outline-primary" onClick={fetchSystemHealth} title="Refresh">
                    <RefreshCw size={16} className="me-1" /> Refresh
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-4">
                    <Col md={3}>
                      <Card className="text-center border-success">
                        <Card.Body>
                          <Cpu className="text-success mb-2" size={40} />
                          <h6>CPU Usage</h6>
                          <ProgressBar now={systemHealth?.server.cpu_usage || 0} label={`${systemHealth?.server.cpu_usage || 0}%`} variant="success" />
                          <small className="text-muted">Optimal</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center border-warning">
                        <Card.Body>
                          <Database className="text-warning mb-2" size={40} />
                          <h6>Memory</h6>
                          <ProgressBar now={systemHealth?.server.memory_usage || 0} label={`${systemHealth?.server.memory_usage || 0}%`} variant="warning" />
                          <small className="text-muted">Moderate</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center border-success">
                        <Card.Body>
                          <HardDrive className="text-success mb-2" size={40} />
                          <h6>Disk Space</h6>
                          <ProgressBar now={systemHealth?.server.disk_usage || 0} label={`${systemHealth?.server.disk_usage || 0}%`} variant="success" />
                          <small className="text-muted">Healthy</small>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={3}>
                      <Card className="text-center border-success">
                        <Card.Body>
                          <Activity className="text-success mb-2" size={40} />
                          <h6>API Response</h6>
                          <h4 className="mb-0">{systemHealth?.server.api_response_time || '—'}</h4>
                          <small className="text-muted">Excellent</small>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  {/* Service Status */}
                  <Card className="shadow-sm mb-3">
                    <Card.Header className="bg-light">
                      <h6 className="mb-0">Service Status</h6>
                    </Card.Header>
                    <Card.Body>
                      <Table hover className="mb-0">
                        <tbody>
                          <tr>
                            <td>
                              <CheckCircle className="text-success me-2" size={18} />
                              <strong>Laravel Backend</strong>
                            </td>
                            <td>
                              <Badge bg={systemHealth?.services?.laravel_backend?.status === 'online' ? 'success' : 'warning'}>
                                {systemHealth?.services?.laravel_backend?.status || 'unknown'}
                              </Badge>
                            </td>
                            <td className="text-end text-muted">{systemHealth?.services?.laravel_backend?.url || 'http://127.0.0.1:8000'}</td>
                          </tr>
                          <tr>
                            <td>
                              <CheckCircle className="text-success me-2" size={18} />
                              <strong>React Frontend</strong>
                            </td>
                            <td>
                              <Badge bg="success">Online</Badge>
                            </td>
                            <td className="text-end text-muted">http://localhost:3001</td>
                          </tr>
                          <tr>
                            <td>
                              <CheckCircle className="text-success me-2" size={18} />
                              <strong>Database</strong>
                            </td>
                            <td>
                              <Badge bg={systemHealth?.services?.database?.status === 'connected' ? 'success' : 'warning'}>
                                {systemHealth?.services?.database?.status || 'unknown'}
                              </Badge>
                            </td>
                            <td className="text-end text-muted">{systemHealth?.system_info?.database_type || '—'}</td>
                          </tr>
                          <tr>
                            <td>
                              <AlertTriangle className="text-warning me-2" size={18} />
                              <strong>Trovotech API</strong>
                            </td>
                            <td>
                              <Badge bg="warning">Not Configured</Badge>
                            </td>
                            <td className="text-end">
                              <Button variant="link" size="sm" onClick={() => setActiveTab('settings')}>
                                Configure
                              </Button>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <AlertTriangle className="text-warning me-2" size={18} />
                              <strong>KYC Provider</strong>
                            </td>
                            <td>
                              <Badge bg="warning">Not Configured</Badge>
                            </td>
                            <td className="text-end">
                              <Button variant="link" size="sm" onClick={() => setActiveTab('settings')}>
                                Configure
                              </Button>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <AlertTriangle className="text-warning me-2" size={18} />
                              <strong>OEM Telemetry</strong>
                            </td>
                            <td>
                              <Badge bg="warning">Not Configured</Badge>
                            </td>
                            <td className="text-end">
                              <Button variant="link" size="sm" onClick={() => setActiveTab('settings')}>
                                Configure
                              </Button>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>

                  {/* System Info */}
                  <Row>
                    <Col md={6}>
                      <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0">System Information</h6>
                        </Card.Header>
                        <Card.Body>
                          <Table size="sm" borderless>
                            <tbody>
                              <tr>
                                <td className="text-muted">Laravel Version:</td>
                                <td className="text-end"><strong>11.x</strong></td>
                              </tr>
                              <tr>
                                <td className="text-muted">PHP Version:</td>
                                <td className="text-end"><strong>8.3.0</strong></td>
                              </tr>
                              <tr>
                                <td className="text-muted">React Version:</td>
                                <td className="text-end"><strong>18.2.0</strong></td>
                              </tr>
                              <tr>
                                <td className="text-muted">Database:</td>
                                <td className="text-end"><strong>SQLite</strong></td>
                              </tr>
                              <tr>
                                <td className="text-muted">Uptime:</td>
                                <td className="text-end"><strong>2h 45m</strong></td>
                              </tr>
                            </tbody>
                          </Table>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="shadow-sm">
                        <Card.Header className="bg-light">
                          <h6 className="mb-0">Recent System Logs</h6>
                        </Card.Header>
                        <Card.Body>
                          <div className="small">
                            <div className="mb-2">
                              <Badge bg="success" className="me-2">INFO</Badge>
                              <span className="text-muted">Database seeded successfully - 35 users created</span>
                            </div>
                            <div className="mb-2">
                              <Badge bg="primary" className="me-2">INFO</Badge>
                              <span className="text-muted">Admin logged in: admin@fleetfi.com</span>
                            </div>
                            <div className="mb-2">
                              <Badge bg="warning" className="me-2">WARN</Badge>
                              <span className="text-muted">API keys not configured in settings</span>
                            </div>
                            <div className="mb-2">
                              <Badge bg="success" className="me-2">INFO</Badge>
                              <span className="text-muted">Bootstrap dashboard loaded successfully</span>
                            </div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <Row className="g-3">
            <Col lg={12}>
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-primary text-white">
                  <h6 className="mb-0">
                    <Key size={18} className="me-2" />
                    API Configuration Settings
                  </h6>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted">
                    Configure your third-party API integrations for Trovotech wallet services, KYC verification, and OEM telemetry.
                  </p>
                  {(!apiConfig.trovotech_api_key || !apiConfig.kyc_api_key || !apiConfig.oem_api_key) && (
                    <Alert variant="warning" className="d-flex align-items-center">
                      <AlertCircle size={18} className="me-2" />
                      One or more API keys are not configured. Some features may be limited.
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Trovotech API Configuration */}
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">
                    <Wallet size={18} className="me-2" />
                    Trovotech Wallet API
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>API Key</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showTrovotechKey ? 'text' : 'password'}
                            value={apiConfig.trovotech_api_key}
                            onChange={(e) => handleConfigChange('trovotech_api_key', e.target.value)}
                            placeholder="Enter Trovotech API Key"
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowTrovotechKey(!showTrovotechKey)}
                          >
                            {showTrovotechKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Your Trovotech API key for blockchain wallet operations
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Base URL</Form.Label>
                        <Form.Control
                          type="text"
                          value={apiConfig.trovotech_base_url}
                          onChange={(e) => handleConfigChange('trovotech_base_url', e.target.value)}
                          placeholder="https://api.trovotech.com/v1"
                        />
                        <Form.Text className="text-muted">
                          Trovotech API endpoint URL
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Alert variant="info" className="mb-0">
                    <small>
                      <strong>Documentation:</strong> Visit{' '}
                      <a href="https://docs.trovotech.com" target="_blank" rel="noopener noreferrer">
                        Trovotech Developer Docs
                      </a>{' '}
                      to get your API credentials.
                    </small>
                  </Alert>
                </Card.Body>
              </Card>

              {/* KYC Provider Configuration */}
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">
                    <Shield size={18} className="me-2" />
                    KYC Verification Provider
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>KYC Provider</Form.Label>
                        <Form.Select
                          value={apiConfig.kyc_provider}
                          onChange={(e) => handleConfigChange('kyc_provider', e.target.value)}
                        >
                          <option value="identitypass">IdentityPass (MyIdentityPass)</option>
                          <option value="smile_identity">Smile Identity</option>
                          <option value="youverify">Youverify</option>
                          <option value="trulioo">Trulioo</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Select your KYC verification service provider
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>API Key</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showKycKey ? 'text' : 'password'}
                            value={apiConfig.kyc_api_key}
                            onChange={(e) => handleConfigChange('kyc_api_key', e.target.value)}
                            placeholder="Enter KYC Provider API Key"
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowKycKey(!showKycKey)}
                          >
                            {showKycKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Your KYC provider API key
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Base URL</Form.Label>
                        <Form.Control
                          type="text"
                          value={apiConfig.kyc_base_url}
                          onChange={(e) => handleConfigChange('kyc_base_url', e.target.value)}
                          placeholder="https://api.myidentitypass.com/api/v2"
                        />
                        <Form.Text className="text-muted">
                          KYC provider API endpoint URL
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Alert variant="info" className="mb-0">
                    <small>
                      <strong>Documentation:</strong> Visit{' '}
                      <a href="https://docs.myidentitypass.com" target="_blank" rel="noopener noreferrer">
                        IdentityPass Developer Docs
                      </a>{' '}
                      to configure your KYC integration.
                    </small>
                  </Alert>
                </Card.Body>
              </Card>

              {/* OEM Telemetry Configuration */}
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">
                    <Radio size={18} className="me-2" />
                    OEM Telemetry Integration
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-3">
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Telemetry Provider</Form.Label>
                        <Form.Select
                          value={apiConfig.oem_telemetry_provider}
                          onChange={(e) => handleConfigChange('oem_telemetry_provider', e.target.value)}
                        >
                          <option value="trovotech">Trovotech Telemetry</option>
                          <option value="iot_device">Direct IoT Device Integration</option>
                          <option value="custom">Custom OEM Integration</option>
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Select your vehicle telemetry data source
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>API Key</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showOemKey ? 'text' : 'password'}
                            value={apiConfig.oem_api_key}
                            onChange={(e) => handleConfigChange('oem_api_key', e.target.value)}
                            placeholder="Enter OEM Telemetry API Key"
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowOemKey(!showOemKey)}
                          >
                            {showOemKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </InputGroup>
                        <Form.Text className="text-muted">
                          Your telemetry provider API key
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Base URL</Form.Label>
                        <Form.Control
                          type="text"
                          value={apiConfig.oem_base_url}
                          onChange={(e) => handleConfigChange('oem_base_url', e.target.value)}
                          placeholder="https://telemetry.trovotech.com/api"
                        />
                        <Form.Text className="text-muted">
                          OEM telemetry API endpoint URL
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Alert variant="info" className="mb-0">
                    <small>
                      <strong>Note:</strong> OEM telemetry integration allows real-time tracking of battery levels,
                      GPS location, speed, and other vehicle metrics.
                    </small>
                  </Alert>
                </Card.Body>
              </Card>

              {/* Save Button */}
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="mb-0 text-muted">
                        <strong>Important:</strong> Make sure to save your changes before leaving this page.
                      </p>
                    </div>
                    <Button variant="primary" size="lg" onClick={handleSaveConfig}>
                      <Save size={18} className="me-2" />
                      Save Configuration
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              {/* Environment Variables Section */}
              <Card className="shadow-sm mt-3">
                <Card.Header className="bg-white">
                  <h6 className="mb-0">
                    <Settings size={18} className="me-2" />
                    Backend Environment Configuration
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Alert variant="warning">
                    <strong>For Developers:</strong> You can also set these values in your backend <code>.env</code> file:
                  </Alert>
                  <pre className="bg-light p-3 rounded">
{`# Trovotech Wallet API
TROVOTECH_API_KEY=your_api_key_here
TROVOTECH_BASE_URL=https://api.trovotech.com/v1

# KYC Provider (IdentityPass)
KYC_PROVIDER=identitypass
IDENTITYPASS_API_KEY=your_api_key_here
IDENTITYPASS_BASE_URL=https://api.myidentitypass.com/api/v2

# OEM Telemetry
OEM_TELEMETRY_PROVIDER=trovotech
OEM_TELEMETRY_API_KEY=your_api_key_here
OEM_TELEMETRY_BASE_URL=https://telemetry.trovotech.com/api`}
                  </pre>
                  <small className="text-muted">
                    File location: <code>backend/.env</code>
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
        {/* Detail Modals */}
        <Modal show={showKycModal} onHide={() => setShowKycModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <FileText size={18} className="me-2" />
              {selectedUser ? `User / KYC Details` : 'Details'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedUser ? (
              <div className="small">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>KYC Status:</strong> {selectedUser.kyc_status}</p>
                {selectedUser.document_type && <p><strong>Document:</strong> {selectedUser.document_type}</p>}
                {selectedUser.submitted_at && <p><strong>Submitted:</strong> {selectedUser.submitted_at}</p>}
              </div>
            ) : <p className="text-muted">No user selected.</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowKycModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showTransactionModal} onHide={() => setShowTransactionModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <CreditCard size={18} className="me-2" />
              Transaction Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedTransaction ? (
              <div className="small">
                <p><strong>ID:</strong> {selectedTransaction.transaction_id || `TXN-${selectedTransaction.id}`}</p>
                <p><strong>User:</strong> {selectedTransaction.user?.name || 'N/A'}</p>
                <p><strong>Type:</strong> {selectedTransaction.type}</p>
                <p><strong>Status:</strong> {selectedTransaction.status}</p>
                <p><strong>Amount:</strong> ${Math.abs(selectedTransaction.amount).toLocaleString()}</p>
                <p><strong>Date:</strong> {new Date(selectedTransaction.created_at).toLocaleString()}</p>
              </div>
            ) : <p className="text-muted">No transaction selected.</p>}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowTransactionModal(false)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default AdminDashboardPage;

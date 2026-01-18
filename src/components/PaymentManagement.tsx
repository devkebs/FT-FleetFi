import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Badge, Button, Form, Row, Col, Modal, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Eye,
  Ban,
  Search,
  Filter,
  Building,
  Wallet,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PaymentRecord {
  id: number;
  reference: string;
  gateway_reference?: string;
  type: 'funding' | 'withdrawal';
  gateway: 'paystack' | 'flutterwave';
  amount: number;
  fee: number;
  net_amount: number;
  status: 'pending' | 'completed' | 'failed';
  user?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  completed_at?: string;
  failure_reason?: string;
}

interface PaymentMethod {
  id: number;
  user_id: number;
  type: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_verified: boolean;
  is_default: boolean;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

interface PaymentOverview {
  stats: {
    total_funded: number;
    total_withdrawn: number;
    total_fees_collected: number;
    period_funded: number;
    period_withdrawn: number;
    period_fees: number;
  };
  by_status: Record<string, { count: number; total: number }>;
  by_gateway: Record<string, { count: number; total: number }>;
  daily_volume: Array<{ date: string; funded: number; withdrawn: number; fees: number }>;
  large_transactions: PaymentRecord[];
  failed_payments: PaymentRecord[];
  pending_withdrawals: PaymentRecord[];
}

interface GatewayStatus {
  gateways: {
    paystack: { configured: boolean; mode: string; features: string[] };
    flutterwave: { configured: boolean; mode: string; features: string[] };
  };
  webhook_urls: { paystack: string; flutterwave: string };
}

// API client
const apiClient = {
  get: async (url: string) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
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
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
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
  delete: async (url: string) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
};

export const PaymentManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<PaymentOverview | null>(null);
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState(30);

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<PaymentRecord | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOverview = useCallback(async () => {
    try {
      const response = await apiClient.get(`/admin/payments/overview?period=${period}`);
      if (response.success) {
        setOverview(response.overview);
      }
    } catch (err) {
      console.error('Failed to fetch payment overview:', err);
    }
  }, [period]);

  const fetchRecords = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (gatewayFilter) params.append('gateway', gatewayFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage.toString());

      const response = await apiClient.get(`/admin/payments/records?${params.toString()}`);
      if (response.success) {
        setRecords(response.records);
        setTotalPages(response.pagination?.last_page || 1);
      }
    } catch (err) {
      console.error('Failed to fetch payment records:', err);
    }
  }, [typeFilter, statusFilter, gatewayFilter, searchQuery, currentPage]);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/payments/methods');
      if (response.success) {
        setPaymentMethods(response.payment_methods);
      }
    } catch (err) {
      console.error('Failed to fetch payment methods:', err);
    }
  }, []);

  const fetchGatewayStatus = useCallback(async () => {
    try {
      const response = await apiClient.get('/admin/payments/gateway-status');
      if (response.success) {
        setGatewayStatus(response);
      }
    } catch (err) {
      console.error('Failed to fetch gateway status:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchOverview(),
        fetchGatewayStatus(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchOverview, fetchGatewayStatus]);

  useEffect(() => {
    if (activeSubTab === 'records') {
      fetchRecords();
    } else if (activeSubTab === 'methods') {
      fetchPaymentMethods();
    }
  }, [activeSubTab, fetchRecords, fetchPaymentMethods]);

  const handleApproveWithdrawal = async (record: PaymentRecord) => {
    setActionLoading(true);
    try {
      const response = await apiClient.post(`/admin/payments/withdrawals/${record.id}/approve`);
      if (response.success) {
        setSuccess('Withdrawal approved successfully');
        fetchOverview();
        fetchRecords();
      }
    } catch (err) {
      setError('Failed to approve withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectWithdrawal = async () => {
    if (!selectedRecord || !rejectReason) return;

    setActionLoading(true);
    try {
      const response = await apiClient.post(`/admin/payments/withdrawals/${selectedRecord.id}/reject`, {
        reason: rejectReason,
      });
      if (response.success) {
        setSuccess('Withdrawal rejected and amount refunded');
        setShowRejectModal(false);
        setRejectReason('');
        fetchOverview();
        fetchRecords();
      }
    } catch (err) {
      setError('Failed to reject withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryPayment = async (record: PaymentRecord) => {
    setActionLoading(true);
    try {
      const response = await apiClient.post(`/admin/payments/records/${record.id}/retry`);
      if (response.success) {
        setSuccess('Payment marked for retry');
        fetchRecords();
      }
    } catch (err) {
      setError('Failed to retry payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      window.open(`http://127.0.0.1:8000/api/admin/payments/export?${params.toString()}`, '_blank');
    } catch (err) {
      setError('Failed to export payments');
    }
  };

  const formatCurrency = (amount: number) => {
    return `N${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
    };
    return <Badge bg={colors[status] || 'secondary'}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      funding: 'success',
      withdrawal: 'primary',
    };
    return <Badge bg={colors[type] || 'secondary'}>{type}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading payment data...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <AlertCircle size={16} className="me-2" />
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <CheckCircle size={16} className="me-2" />
          {success}
        </Alert>
      )}

      {/* Sub Tabs */}
      <Tabs activeKey={activeSubTab} onSelect={(k) => setActiveSubTab(k || 'overview')} className="mb-4">
        <Tab eventKey="overview" title={<><Activity size={16} className="me-2" />Overview</>}>
          {/* Overview Content */}
          {overview && (
            <>
              {/* Gateway Status */}
              <Row className="g-3 mb-4">
                <Col md={6}>
                  <Card className={`shadow-sm ${gatewayStatus?.gateways.paystack.configured ? 'border-success' : 'border-warning'}`}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Paystack</h6>
                          <small className="text-muted">
                            {gatewayStatus?.gateways.paystack.configured ? (
                              <><CheckCircle size={14} className="text-success me-1" />Configured ({gatewayStatus?.gateways.paystack.mode} mode)</>
                            ) : (
                              <><AlertCircle size={14} className="text-warning me-1" />Not Configured</>
                            )}
                          </small>
                        </div>
                        <img src="https://website-v3-assets.s3.amazonaws.com/assets/img/hero/Paystack-mark-white-twitter.png" alt="Paystack" height="30" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className={`shadow-sm ${gatewayStatus?.gateways.flutterwave.configured ? 'border-success' : 'border-warning'}`}>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Flutterwave</h6>
                          <small className="text-muted">
                            {gatewayStatus?.gateways.flutterwave.configured ? (
                              <><CheckCircle size={14} className="text-success me-1" />Configured ({gatewayStatus?.gateways.flutterwave.mode} mode)</>
                            ) : (
                              <><AlertCircle size={14} className="text-warning me-1" />Not Configured</>
                            )}
                          </small>
                        </div>
                        <img src="https://flutterwave.com/images/logo/full.svg" alt="Flutterwave" height="30" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Stats Cards */}
              <Row className="g-3 mb-4">
                <Col md={3}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between">
                        <div>
                          <small className="text-muted">Total Funded</small>
                          <h4 className="text-success mb-0">{formatCurrency(overview.stats.total_funded)}</h4>
                        </div>
                        <div className="rounded-circle bg-success bg-opacity-10 p-3">
                          <TrendingUp className="text-success" size={24} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between">
                        <div>
                          <small className="text-muted">Total Withdrawn</small>
                          <h4 className="text-primary mb-0">{formatCurrency(overview.stats.total_withdrawn)}</h4>
                        </div>
                        <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                          <TrendingDown className="text-primary" size={24} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between">
                        <div>
                          <small className="text-muted">Fees Collected</small>
                          <h4 className="text-info mb-0">{formatCurrency(overview.stats.total_fees_collected)}</h4>
                        </div>
                        <div className="rounded-circle bg-info bg-opacity-10 p-3">
                          <DollarSign className="text-info" size={24} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between">
                        <div>
                          <small className="text-muted">Pending Withdrawals</small>
                          <h4 className="text-warning mb-0">{overview.pending_withdrawals.length}</h4>
                        </div>
                        <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                          <Clock className="text-warning" size={24} />
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Period Stats */}
              <Row className="g-3 mb-4">
                <Col md={4}>
                  <Card className="shadow-sm bg-success bg-opacity-10 border-0">
                    <Card.Body>
                      <small className="text-muted">Last {period} Days - Funded</small>
                      <h5 className="text-success">{formatCurrency(overview.stats.period_funded)}</h5>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="shadow-sm bg-primary bg-opacity-10 border-0">
                    <Card.Body>
                      <small className="text-muted">Last {period} Days - Withdrawn</small>
                      <h5 className="text-primary">{formatCurrency(overview.stats.period_withdrawn)}</h5>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="shadow-sm bg-info bg-opacity-10 border-0">
                    <Card.Body>
                      <small className="text-muted">Last {period} Days - Fees</small>
                      <h5 className="text-info">{formatCurrency(overview.stats.period_fees)}</h5>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Chart */}
              {overview.daily_volume.length > 0 && (
                <Card className="shadow-sm mb-4">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">Payment Volume (Last {period} Days)</h6>
                  </Card.Header>
                  <Card.Body>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={overview.daily_volume}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis
                          tickFormatter={(value: number) => {
                            if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `₦${(value / 1000).toFixed(0)}K`;
                            return `₦${value}`;
                          }}
                          domain={['dataMin', 'dataMax']}
                        />
                        <Tooltip formatter={(value) => formatCurrency(Number(value) || 0)} />
                        <Legend />
                        <Bar dataKey="funded" fill="#198754" name="Funded" />
                        <Bar dataKey="withdrawn" fill="#0d6efd" name="Withdrawn" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              )}

              {/* Pending Withdrawals */}
              {overview.pending_withdrawals.length > 0 && (
                <Card className="shadow-sm mb-4 border-warning">
                  <Card.Header className="bg-warning bg-opacity-10">
                    <h6 className="mb-0 text-warning">
                      <Clock size={16} className="me-2" />
                      Pending Withdrawals ({overview.pending_withdrawals.length})
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table hover responsive className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Reference</th>
                          <th>User</th>
                          <th>Amount</th>
                          <th>Gateway</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.pending_withdrawals.map((record) => (
                          <tr key={record.id}>
                            <td><code>{record.reference}</code></td>
                            <td>
                              {record.user?.name || 'N/A'}
                              <div className="small text-muted">{record.user?.email}</div>
                            </td>
                            <td className="fw-bold">{formatCurrency(record.amount)}</td>
                            <td><Badge bg="secondary">{record.gateway}</Badge></td>
                            <td>{new Date(record.created_at).toLocaleString()}</td>
                            <td>
                              <Button
                                variant="success"
                                size="sm"
                                className="me-1"
                                onClick={() => handleApproveWithdrawal(record)}
                                disabled={actionLoading}
                              >
                                <CheckCircle size={14} className="me-1" />
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedRecord(record);
                                  setShowRejectModal(true);
                                }}
                                disabled={actionLoading}
                              >
                                <XCircle size={14} className="me-1" />
                                Reject
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}

              {/* Failed Payments */}
              {overview.failed_payments.length > 0 && (
                <Card className="shadow-sm mb-4 border-danger">
                  <Card.Header className="bg-danger bg-opacity-10">
                    <h6 className="mb-0 text-danger">
                      <AlertCircle size={16} className="me-2" />
                      Recent Failed Payments ({overview.failed_payments.length})
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table hover responsive className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Reference</th>
                          <th>User</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Reason</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.failed_payments.slice(0, 5).map((record) => (
                          <tr key={record.id}>
                            <td><code>{record.reference}</code></td>
                            <td>{record.user?.name || 'N/A'}</td>
                            <td>{getTypeBadge(record.type)}</td>
                            <td>{formatCurrency(record.amount)}</td>
                            <td className="text-muted small">{record.failure_reason || 'Unknown'}</td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleRetryPayment(record)}
                                disabled={actionLoading}
                              >
                                <RefreshCw size={14} className="me-1" />
                                Retry
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}

              {/* Large Transactions */}
              {overview.large_transactions.length > 0 && (
                <Card className="shadow-sm">
                  <Card.Header className="bg-white">
                    <h6 className="mb-0">
                      <DollarSign size={16} className="me-2" />
                      Large Transactions (N100,000+)
                    </h6>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <Table hover responsive className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Reference</th>
                          <th>User</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.large_transactions.map((record) => (
                          <tr key={record.id}>
                            <td><code>{record.reference}</code></td>
                            <td>{record.user?.name || 'N/A'}</td>
                            <td>{getTypeBadge(record.type)}</td>
                            <td className="fw-bold">{formatCurrency(record.amount)}</td>
                            <td>{getStatusBadge(record.status)}</td>
                            <td>{new Date(record.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Tab>

        <Tab eventKey="records" title={<><CreditCard size={16} className="me-2" />All Payments</>}>
          {/* Filters */}
          <Card className="shadow-sm mb-3">
            <Card.Body>
              <Row className="g-3 align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small">Search</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text"><Search size={16} /></span>
                      <Form.Control
                        type="text"
                        placeholder="Reference, name, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small">Type</Form.Label>
                    <Form.Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                      <option value="">All Types</option>
                      <option value="funding">Funding</option>
                      <option value="withdrawal">Withdrawal</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small">Status</Form.Label>
                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small">Gateway</Form.Label>
                    <Form.Select value={gatewayFilter} onChange={(e) => setGatewayFilter(e.target.value)}>
                      <option value="">All Gateways</option>
                      <option value="paystack">Paystack</option>
                      <option value="flutterwave">Flutterwave</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3} className="text-end">
                  <Button variant="outline-primary" onClick={handleExport}>
                    <Download size={16} className="me-2" />
                    Export CSV
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Records Table */}
          <Card className="shadow-sm">
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Reference</th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Gateway</th>
                    <th>Amount</th>
                    <th>Fee</th>
                    <th>Net</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td><code className="small">{record.reference}</code></td>
                      <td>
                        {record.user?.name || 'N/A'}
                        <div className="small text-muted">{record.user?.email}</div>
                      </td>
                      <td>{getTypeBadge(record.type)}</td>
                      <td><Badge bg="secondary">{record.gateway}</Badge></td>
                      <td>{formatCurrency(record.amount)}</td>
                      <td className="text-muted">{formatCurrency(record.fee)}</td>
                      <td className="fw-bold">{formatCurrency(record.net_amount)}</td>
                      <td>{getStatusBadge(record.status)}</td>
                      <td className="small">{new Date(record.created_at).toLocaleString()}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowRecordModal(true);
                          }}
                        >
                          <Eye size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={10} className="text-center py-4 text-muted">
                        No payment records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
            {totalPages > 1 && (
              <Card.Footer className="bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-muted">Page {currentPage} of {totalPages}</span>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </Card.Footer>
            )}
          </Card>
        </Tab>

        <Tab eventKey="methods" title={<><Building size={16} className="me-2" />Bank Accounts</>}>
          <Card className="shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Registered Bank Accounts</h6>
              <Badge bg="primary">{paymentMethods.length} accounts</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <Table hover responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Bank</th>
                    <th>Account Number</th>
                    <th>Account Name</th>
                    <th>Status</th>
                    <th>Default</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.map((method) => (
                    <tr key={method.id}>
                      <td>
                        {method.user?.name || 'N/A'}
                        <div className="small text-muted">{method.user?.email}</div>
                      </td>
                      <td>{method.bank_name}</td>
                      <td><code>{method.account_number}</code></td>
                      <td>{method.account_name}</td>
                      <td>
                        {method.is_verified ? (
                          <Badge bg="success"><CheckCircle size={12} className="me-1" />Verified</Badge>
                        ) : (
                          <Badge bg="warning">Unverified</Badge>
                        )}
                      </td>
                      <td>
                        {method.is_default && <Badge bg="info">Default</Badge>}
                      </td>
                      <td className="small">{new Date(method.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {paymentMethods.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        No bank accounts registered
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="settings" title={<><Wallet size={16} className="me-2" />Gateway Settings</>}>
          <Row className="g-4">
            <Col md={6}>
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Paystack Configuration</h6>
                    {gatewayStatus?.gateways.paystack.configured ? (
                      <Badge bg="success">Active</Badge>
                    ) : (
                      <Badge bg="warning">Not Configured</Badge>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <small className="text-muted">Mode</small>
                    <p className="mb-0 fw-semibold">{gatewayStatus?.gateways.paystack.mode || 'N/A'}</p>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Supported Features</small>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {gatewayStatus?.gateways.paystack.features.map((feature) => (
                        <Badge key={feature} bg="light" text="dark">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Webhook URL</small>
                    <code className="d-block small bg-light p-2 rounded mt-1">
                      {gatewayStatus?.webhook_urls.paystack}
                    </code>
                  </div>
                  <Alert variant="info" className="mb-0">
                    <small>
                      Configure Paystack API keys in <code>.env</code> file:
                      <br />
                      <code>PAYSTACK_SECRET_KEY=sk_xxx</code>
                      <br />
                      <code>PAYSTACK_PUBLIC_KEY=pk_xxx</code>
                    </small>
                  </Alert>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="shadow-sm h-100">
                <Card.Header className="bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Flutterwave Configuration</h6>
                    {gatewayStatus?.gateways.flutterwave.configured ? (
                      <Badge bg="success">Active</Badge>
                    ) : (
                      <Badge bg="warning">Not Configured</Badge>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <small className="text-muted">Mode</small>
                    <p className="mb-0 fw-semibold">{gatewayStatus?.gateways.flutterwave.mode || 'N/A'}</p>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Supported Features</small>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {gatewayStatus?.gateways.flutterwave.features.map((feature) => (
                        <Badge key={feature} bg="light" text="dark">{feature}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">Webhook URL</small>
                    <code className="d-block small bg-light p-2 rounded mt-1">
                      {gatewayStatus?.webhook_urls.flutterwave}
                    </code>
                  </div>
                  <Alert variant="info" className="mb-0">
                    <small>
                      Configure Flutterwave API keys in <code>.env</code> file:
                      <br />
                      <code>FLUTTERWAVE_SECRET_KEY=FLWSECK_xxx</code>
                      <br />
                      <code>FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_xxx</code>
                    </small>
                  </Alert>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>

      {/* Record Details Modal */}
      <Modal show={showRecordModal} onHide={() => setShowRecordModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Payment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <Row className="g-3">
              <Col md={6}>
                <small className="text-muted">Reference</small>
                <p className="fw-semibold"><code>{selectedRecord.reference}</code></p>
              </Col>
              <Col md={6}>
                <small className="text-muted">Gateway Reference</small>
                <p className="fw-semibold"><code>{selectedRecord.gateway_reference || 'N/A'}</code></p>
              </Col>
              <Col md={6}>
                <small className="text-muted">User</small>
                <p className="fw-semibold">{selectedRecord.user?.name || 'N/A'}</p>
                <p className="text-muted small">{selectedRecord.user?.email}</p>
              </Col>
              <Col md={6}>
                <small className="text-muted">Type</small>
                <p>{getTypeBadge(selectedRecord.type)}</p>
              </Col>
              <Col md={4}>
                <small className="text-muted">Amount</small>
                <p className="fw-bold fs-5">{formatCurrency(selectedRecord.amount)}</p>
              </Col>
              <Col md={4}>
                <small className="text-muted">Fee</small>
                <p className="text-muted">{formatCurrency(selectedRecord.fee)}</p>
              </Col>
              <Col md={4}>
                <small className="text-muted">Net Amount</small>
                <p className="fw-bold text-success">{formatCurrency(selectedRecord.net_amount)}</p>
              </Col>
              <Col md={6}>
                <small className="text-muted">Gateway</small>
                <p><Badge bg="secondary">{selectedRecord.gateway}</Badge></p>
              </Col>
              <Col md={6}>
                <small className="text-muted">Status</small>
                <p>{getStatusBadge(selectedRecord.status)}</p>
              </Col>
              <Col md={6}>
                <small className="text-muted">Created</small>
                <p>{new Date(selectedRecord.created_at).toLocaleString()}</p>
              </Col>
              {selectedRecord.completed_at && (
                <Col md={6}>
                  <small className="text-muted">Completed</small>
                  <p>{new Date(selectedRecord.completed_at).toLocaleString()}</p>
                </Col>
              )}
              {selectedRecord.failure_reason && (
                <Col md={12}>
                  <Alert variant="danger">
                    <small className="text-muted">Failure Reason</small>
                    <p className="mb-0">{selectedRecord.failure_reason}</p>
                  </Alert>
                </Col>
              )}
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedRecord?.status === 'pending' && selectedRecord?.type === 'withdrawal' && (
            <>
              <Button variant="success" onClick={() => handleApproveWithdrawal(selectedRecord)} disabled={actionLoading}>
                <CheckCircle size={16} className="me-2" />
                Approve
              </Button>
              <Button variant="danger" onClick={() => { setShowRejectModal(true); setShowRecordModal(false); }} disabled={actionLoading}>
                <XCircle size={16} className="me-2" />
                Reject
              </Button>
            </>
          )}
          {selectedRecord?.status === 'failed' && (
            <Button variant="primary" onClick={() => handleRetryPayment(selectedRecord)} disabled={actionLoading}>
              <RefreshCw size={16} className="me-2" />
              Retry
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowRecordModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Reject Withdrawal Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Reject Withdrawal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <AlertCircle size={16} className="me-2" />
            The withdrawal amount will be refunded to the user's wallet.
          </Alert>
          <Form.Group>
            <Form.Label>Rejection Reason <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Please provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRejectWithdrawal} disabled={actionLoading || !rejectReason}>
            {actionLoading ? <Spinner animation="border" size="sm" /> : 'Reject & Refund'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PaymentManagement;

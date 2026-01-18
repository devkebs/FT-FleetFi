import React, { useState, useEffect, useCallback } from 'react';
import { ContactAPI, ContactMessage } from '../services/api';

interface ContactManagementProps {}

export const ContactManagement: React.FC<ContactManagementProps> = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, new: 0, read: 0, responded: 0 });
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [filters, setFilters] = useState({
    status: 'all',
    subject: 'all',
    search: '',
  });
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [responseNotes, setResponseNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const subjectLabels: Record<string, string> = {
    investment: 'Investment Inquiry',
    operator: 'Operator Partnership',
    driver: 'Driver Opportunity',
    support: 'Technical Support',
    other: 'Other',
  };

  const statusBadgeClass: Record<string, string> = {
    new: 'bg-primary',
    read: 'bg-info',
    responded: 'bg-success',
    archived: 'bg-secondary',
  };

  const fetchMessages = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await ContactAPI.list({
        status: filters.status !== 'all' ? filters.status : undefined,
        subject: filters.subject !== 'all' ? filters.subject : undefined,
        search: filters.search || undefined,
        page,
        per_page: 15,
      });

      setMessages(response.data.data);
      setPagination({
        currentPage: response.data.current_page,
        lastPage: response.data.last_page,
        total: response.data.total,
      });
      setStats(response.stats);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleViewMessage = async (message: ContactMessage) => {
    try {
      const response = await ContactAPI.get(message.id);
      setSelectedMessage(response.data);
      setResponseNotes(response.data.response_notes || '');
      setShowModal(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load message');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    setActionLoading(true);
    try {
      const response = await ContactAPI.updateStatus(id, status, status === 'responded' ? responseNotes : undefined);
      setSelectedMessage(response.data);
      fetchMessages(pagination.currentPage);
      if (status !== 'responded') {
        setShowModal(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    setActionLoading(true);
    try {
      await ContactAPI.delete(id);
      setShowModal(false);
      fetchMessages(pagination.currentPage);
    } catch (err: any) {
      alert(err.message || 'Failed to delete message');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (status: string) => {
    if (selectedIds.length === 0) {
      alert('Please select messages first');
      return;
    }
    if (!confirm(`Mark ${selectedIds.length} message(s) as ${status}?`)) return;
    setActionLoading(true);
    try {
      await ContactAPI.bulkUpdateStatus(selectedIds, status);
      setSelectedIds([]);
      fetchMessages(pagination.currentPage);
    } catch (err: any) {
      alert(err.message || 'Failed to update messages');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === messages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(messages.map(m => m.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container-fluid py-4">
      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Total Messages</p>
                  <h4 className="mb-0">{stats.total}</h4>
                </div>
                <div className="bg-light rounded-circle p-3">
                  <i className="bi bi-envelope text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">New</p>
                  <h4 className="mb-0 text-primary">{stats.new}</h4>
                </div>
                <div className="bg-primary bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-envelope-fill text-primary fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Read</p>
                  <h4 className="mb-0 text-info">{stats.read}</h4>
                </div>
                <div className="bg-info bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-envelope-open text-info fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <p className="text-muted mb-1 small">Responded</p>
                  <h4 className="mb-0 text-success">{stats.responded}</h4>
                </div>
                <div className="bg-success bg-opacity-10 rounded-circle p-3">
                  <i className="bi bi-reply text-success fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="responded">Responded</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small">Subject</label>
              <select
                className="form-select"
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              >
                <option value="all">All Subjects</option>
                <option value="investment">Investment Inquiry</option>
                <option value="operator">Operator Partnership</option>
                <option value="driver">Driver Opportunity</option>
                <option value="support">Technical Support</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => setFilters({ status: 'all', subject: 'all', search: '' })}
              >
                <i className="bi bi-x-circle me-1"></i> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center mb-4">
          <span>{selectedIds.length} message(s) selected</span>
          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-info"
              onClick={() => handleBulkAction('read')}
              disabled={actionLoading}
            >
              Mark Read
            </button>
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() => handleBulkAction('responded')}
              disabled={actionLoading}
            >
              Mark Responded
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => handleBulkAction('archived')}
              disabled={actionLoading}
            >
              Archive
            </button>
          </div>
        </div>
      )}

      {/* Messages Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-3"></i>
              <p>No contact messages found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedIds.length === messages.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Sender</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((message) => (
                    <tr
                      key={message.id}
                      className={message.status === 'new' ? 'fw-bold' : ''}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleViewMessage(message)}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedIds.includes(message.id)}
                          onChange={() => toggleSelect(message.id)}
                        />
                      </td>
                      <td>
                        <div>{message.name}</div>
                        <small className="text-muted">{message.email}</small>
                      </td>
                      <td>{subjectLabels[message.subject] || message.subject}</td>
                      <td>
                        <span className={`badge ${statusBadgeClass[message.status]}`}>
                          {message.status}
                        </span>
                      </td>
                      <td>
                        <small>{formatDate(message.created_at)}</small>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleViewMessage(message)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.lastPage > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <small className="text-muted">
                Showing {messages.length} of {pagination.total} messages
              </small>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => fetchMessages(pagination.currentPage - 1)}
                    >
                      Previous
                    </button>
                  </li>
                  {[...Array(pagination.lastPage)].map((_, i) => (
                    <li
                      key={i + 1}
                      className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}
                    >
                      <button className="page-link" onClick={() => fetchMessages(i + 1)}>
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.currentPage === pagination.lastPage ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => fetchMessages(pagination.currentPage + 1)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Message Detail Modal */}
      {showModal && selectedMessage && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-envelope-open me-2"></i>
                  Message from {selectedMessage.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
                  </div>
                  <div className="col-md-6">
                    <strong>Phone:</strong> {selectedMessage.phone || 'Not provided'}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Subject:</strong>{' '}
                    <span className="badge bg-secondary">
                      {subjectLabels[selectedMessage.subject] || selectedMessage.subject}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <strong>Status:</strong>{' '}
                    <span className={`badge ${statusBadgeClass[selectedMessage.status]}`}>
                      {selectedMessage.status}
                    </span>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-12">
                    <strong>Received:</strong> {formatDate(selectedMessage.created_at)}
                  </div>
                </div>

                <hr />

                <div className="mb-3">
                  <strong>Message:</strong>
                  <div className="card bg-light mt-2">
                    <div className="card-body">
                      <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedMessage.message}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedMessage.status === 'responded' && selectedMessage.responded_at && (
                  <div className="alert alert-success">
                    <strong>Responded:</strong> {formatDate(selectedMessage.responded_at)}
                    {selectedMessage.responder && (
                      <span> by {selectedMessage.responder.name}</span>
                    )}
                    {selectedMessage.response_notes && (
                      <div className="mt-2">
                        <strong>Notes:</strong>
                        <p className="mb-0">{selectedMessage.response_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedMessage.status !== 'responded' && (
                  <div className="mb-3">
                    <label className="form-label"><strong>Response Notes:</strong></label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Add notes about your response (optional)..."
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <div className="d-flex justify-content-between w-100">
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => handleDelete(selectedMessage.id)}
                    disabled={actionLoading}
                  >
                    <i className="bi bi-trash me-1"></i> Delete
                  </button>
                  <div className="btn-group">
                    {selectedMessage.status !== 'archived' && (
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => handleUpdateStatus(selectedMessage.id, 'archived')}
                        disabled={actionLoading}
                      >
                        Archive
                      </button>
                    )}
                    {selectedMessage.status !== 'responded' && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleUpdateStatus(selectedMessage.id, 'responded')}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <span className="spinner-border spinner-border-sm me-1"></span>
                        ) : (
                          <i className="bi bi-check-circle me-1"></i>
                        )}
                        Mark as Responded
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;

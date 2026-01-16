import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface MaintenanceRequest {
  id: number;
  asset_id: number;
  asset_name: string;
  registration_number: string;
  driver_name: string;
  issue_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimated_cost?: number;
  reported_at: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  operator_notes?: string;
}

const MaintenanceApproval: React.FC = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [estimatedCost, setEstimatedCost] = useState<string>('');
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchMaintenanceRequests();
  }, [filter]);

  const fetchMaintenanceRequests = async () => {
    try {
      const response = await apiService.get(`/operator/maintenance-requests?status=${filter}`);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    }
  };

  const handleApproveReject = async () => {
    if (!selectedRequest) return;

    if (action === 'approve' && !estimatedCost) {
      alert('Please enter estimated cost');
      return;
    }

    setIsProcessing(true);
    try {
      await apiService.post(`/operator/maintenance-requests/${selectedRequest.id}/${action}`, {
        estimated_cost: action === 'approve' ? parseFloat(estimatedCost) : null,
        operator_notes: operatorNotes,
      });

      alert(`Maintenance request ${action}d successfully!`);
      setShowModal(false);
      setSelectedRequest(null);
      setEstimatedCost('');
      setOperatorNotes('');
      fetchMaintenanceRequests();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (request: MaintenanceRequest, actionType: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setAction(actionType);
    setEstimatedCost(request.estimated_cost?.toString() || '');
    setOperatorNotes(request.operator_notes || '');
    setShowModal(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Maintenance Requests</h2>
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === status
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No maintenance requests found</p>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.id}
              className={`border rounded-lg p-4 ${getSeverityColor(request.severity)} border`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">{request.asset_name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(request.severity)}`}>
                      {request.severity.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(request.status)}`}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{request.registration_number}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Driver:</span> {request.driver_name}
                  </p>
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700">Issue: {request.issue_type}</p>
                    <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                  </div>
                  {request.estimated_cost && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Estimated Cost:</span> ₦{request.estimated_cost.toLocaleString()}
                    </p>
                  )}
                  {request.operator_notes && (
                    <div className="mt-2 p-2 bg-white bg-opacity-50 rounded">
                      <p className="text-xs font-medium text-gray-700">Operator Notes:</p>
                      <p className="text-sm text-gray-600">{request.operator_notes}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Reported: {new Date(request.reported_at).toLocaleString()}
                  </p>
                </div>

                {request.status === 'pending' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => openModal(request, 'approve')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openModal(request, 'reject')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approval/Rejection Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {action === 'approve' ? 'Approve' : 'Reject'} Maintenance Request
            </h3>

            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="font-medium text-gray-800">{selectedRequest.asset_name}</p>
              <p className="text-sm text-gray-600">{selectedRequest.registration_number}</p>
              <p className="text-sm text-gray-700 mt-2">
                <span className="font-medium">Issue:</span> {selectedRequest.issue_type}
              </p>
              <p className="text-sm text-gray-600">{selectedRequest.description}</p>
            </div>

            <div className="space-y-4">
              {action === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Cost (₦) *
                  </label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter estimated repair cost"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operator Notes {action === 'reject' && '*'}
                </label>
                <textarea
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={
                    action === 'approve'
                      ? 'Add any notes for the driver (optional)'
                      : 'Explain why this request is being rejected'
                  }
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                  setEstimatedCost('');
                  setOperatorNotes('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleApproveReject}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed ${
                  action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessing ? 'Processing...' : action === 'approve' ? 'Approve Request' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceApproval;

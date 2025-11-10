import React, { useState } from 'react';

interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleAssigned: string;
  status: 'active' | 'inactive' | 'on-trip';
  totalTrips: number;
  totalEarnings: number;
  rating: number;
  joinedDate: string;
}

const mockRiders: Rider[] = [
  {
    id: 'RD-001',
    name: 'Adewale Johnson',
    phone: '+234 801 234 5678',
    email: 'adewale.j@fleetfi.com',
    vehicleAssigned: 'EV-001',
    status: 'on-trip',
    totalTrips: 342,
    totalEarnings: 145000,
    rating: 4.8,
    joinedDate: '2024-06-15'
  },
  {
    id: 'RD-002',
    name: 'Fatima Abdullahi',
    phone: '+234 802 345 6789',
    email: 'fatima.a@fleetfi.com',
    vehicleAssigned: 'EV-002',
    status: 'active',
    totalTrips: 289,
    totalEarnings: 128500,
    rating: 4.9,
    joinedDate: '2024-07-20'
  },
  {
    id: 'RD-003',
    name: 'Chukwudi Okafor',
    phone: '+234 803 456 7890',
    email: 'chukwudi.o@fleetfi.com',
    vehicleAssigned: 'EV-003',
    status: 'active',
    totalTrips: 198,
    totalEarnings: 89200,
    rating: 4.7,
    joinedDate: '2024-08-10'
  },
  {
    id: 'RD-004',
    name: 'Amina Bello',
    phone: '+234 804 567 8901',
    email: 'amina.b@fleetfi.com',
    vehicleAssigned: 'EV-001',
    status: 'inactive',
    totalTrips: 156,
    totalEarnings: 67800,
    rating: 4.6,
    joinedDate: '2024-09-05'
  }
];

export const RidersPage: React.FC = () => {
  const [riders] = useState<Rider[]>(mockRiders);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRiders = riders.filter(rider =>
    rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.vehicleAssigned.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeRiders = riders.filter(r => r.status === 'active' || r.status === 'on-trip').length;
  const totalEarnings = riders.reduce((sum, r) => sum + r.totalEarnings, 0);
  const avgRating = (riders.reduce((sum, r) => sum + r.rating, 0) / riders.length).toFixed(1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'on-trip':
        return 'bg-primary';
      case 'inactive':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="row mb-4">
        <div className="col">
          <h1 className="display-5 fw-bold">
            <i className="bi bi-people-fill text-primary me-2"></i>
            Riders Management
          </h1>
          <p className="lead text-muted">Manage your fleet riders and monitor performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-4 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-2">Total Riders</h6>
                  <h2 className="mb-0">{riders.length}</h2>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <i className="bi bi-people fs-3 text-primary"></i>
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
                  <h6 className="text-muted mb-2">Active Riders</h6>
                  <h2 className="mb-0">{activeRiders}</h2>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <i className="bi bi-person-check fs-3 text-success"></i>
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
                  <h6 className="text-muted mb-2">Total Earnings</h6>
                  <h2 className="mb-0">₦{totalEarnings.toLocaleString()}</h2>
                </div>
                <div className="bg-warning bg-opacity-10 p-3 rounded">
                  <i className="bi bi-currency-exchange fs-3 text-warning"></i>
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
                  <h6 className="text-muted mb-2">Average Rating</h6>
                  <h2 className="mb-0">
                    <i className="bi bi-star-fill text-warning"></i> {avgRating}
                  </h2>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <i className="bi bi-graph-up fs-3 text-info"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, ID, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6 text-end">
          <button className="btn btn-primary">
            <i className="bi bi-person-plus me-2"></i>
            Add New Rider
          </button>
        </div>
      </div>

      {/* Riders Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="px-4 py-3">Rider ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total Trips</th>
                  <th className="px-4 py-3">Earnings</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRiders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                      No riders found matching your search
                    </td>
                  </tr>
                ) : (
                  filteredRiders.map((rider) => (
                    <tr key={rider.id}>
                      <td className="px-4 py-3">
                        <span className="badge bg-secondary">{rider.id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="fw-semibold">{rider.name}</div>
                          <small className="text-muted">
                            Joined {new Date(rider.joinedDate).toLocaleDateString()}
                          </small>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="small">
                          <div><i className="bi bi-telephone me-1"></i>{rider.phone}</div>
                          <div className="text-muted"><i className="bi bi-envelope me-1"></i>{rider.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="badge bg-primary bg-opacity-10 text-primary">
                          {rider.vehicleAssigned}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatusBadge(rider.status)}`}>
                          {rider.status === 'on-trip' ? 'On Trip' : rider.status.charAt(0).toUpperCase() + rider.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{rider.totalTrips}</td>
                      <td className="px-4 py-3 fw-semibold">₦{rider.totalEarnings.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="text-warning">
                          <i className="bi bi-star-fill"></i> {rider.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="btn-group btn-group-sm">
                          <button className="btn btn-outline-primary" title="View Details">
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-outline-secondary" title="Edit">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-outline-danger" title="Deactivate">
                            <i className="bi bi-person-x"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="row mt-4">
        <div className="col-md-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3">
                <i className="bi bi-graph-up me-2"></i>
                Rider Performance Overview
              </h5>
              <div className="text-center py-5 text-muted">
                <i className="bi bi-bar-chart-line fs-1 d-block mb-3"></i>
                <p>Performance analytics and charts coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

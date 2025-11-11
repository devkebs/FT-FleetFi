import React from 'react';
import { Page } from '../src/types';

interface HeaderProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  userRole?: 'investor' | 'operator';
  onRoleSwitch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentPage, 
  onPageChange, 
  userRole,
  onRoleSwitch 
}) => {
  const navItems = [
    { page: Page.Landing, label: 'Home', icon: 'bi-house' },
    { page: Page.InvestorDashboard, label: 'Investor', icon: 'bi-graph-up' },
    { page: Page.OperatorDashboard, label: 'Operator', icon: 'bi-speedometer2' },
    { page: Page.Riders, label: 'Riders', icon: 'bi-people' },
    { page: Page.ESGImpact, label: 'ESG Impact', icon: 'bi-tree' },
    { page: Page.SLXMarketplace, label: 'SLX Market', icon: 'bi-shop' },
  ];

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success shadow-sm sticky-top">
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="#">
          <i className="bi bi-lightning-charge-fill text-warning me-2"></i>
          FleetFi
          <span className="badge bg-warning text-dark ms-2 small">MVP</span>
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {navItems.map(({ page, label, icon }) => (
              <li className="nav-item" key={page}>
                <button
                  onClick={() => onPageChange(page)}
                  className={`nav-link ${currentPage === page ? 'active' : ''}`}
                  style={{ border: 'none', background: 'transparent' }}
                >
                  <i className={`bi ${icon} me-1`}></i>
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {onRoleSwitch && (
            <div className="d-flex align-items-center">
              <span className="text-white me-2 small">Role:</span>
              <button
                onClick={onRoleSwitch}
                className="btn btn-sm btn-warning text-dark fw-semibold"
              >
                <i className="bi bi-arrow-repeat me-1"></i>
                {userRole === 'investor' ? 'Investor' : 'Operator'}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

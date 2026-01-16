import React from 'react';
import { Page } from '../types';
import { NotificationCenter } from './NotificationCenter';
import { Notification } from '../services/notifications';

interface HeaderProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  userRole?: 'investor' | 'operator' | 'driver' | 'admin';
  onRoleSwitch?: () => void; // deprecated once auth is live
  onLogin?: () => void;
  onRegister?: () => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  kycStatus?: 'pending' | 'submitted' | 'verified' | 'rejected';
  demoMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentPage, 
  onPageChange, 
  userRole,
  onRoleSwitch,
  onLogin,
  onRegister,
  onLogout,
  isAuthenticated,
  userName,
  kycStatus,
  demoMode
}) => {
  const allNavItems = [
    { page: Page.Landing, label: 'Home', icon: 'bi-house', roles: ['investor','operator','driver','admin'] },
    { page: Page.About, label: 'About', icon: 'bi-info-circle', roles: ['investor','operator','driver','admin'] },
    { page: Page.Contact, label: 'Contact', icon: 'bi-envelope', roles: ['investor','operator','driver','admin'] },
    { page: Page.InvestorDashboard, label: 'Investor', icon: 'bi-graph-up', roles: ['investor'] },
    { page: Page.OperatorDashboard, label: 'Operator', icon: 'bi-speedometer2', roles: ['operator'] },
    { page: Page.DriverDashboard, label: 'Driver', icon: 'bi-car-front', roles: ['driver'] },
    { page: Page.AdminDashboard, label: 'Admin', icon: 'bi-shield-lock-fill', roles: ['admin'] },
    { page: Page.Riders, label: 'Riders', icon: 'bi-people', roles: ['operator'] },
    { page: Page.ESGImpact, label: 'ESG Impact', icon: 'bi-tree', roles: ['investor','operator','driver','admin'] },
    { page: Page.SLXMarketplace, label: 'SLX Market', icon: 'bi-shop', roles: ['investor'] },
  ];
  const withAdminLogin = !isAuthenticated
    ? [
        ...allNavItems.filter(i => i.page !== Page.AdminDashboard),
        { page: Page.AdminLogin, label: 'Admin', icon: 'bi-shield-lock-fill', roles: [] as any }
      ]
    : allNavItems;
  const navItems = withAdminLogin.filter(item => !userRole || (item.roles.length === 0 || item.roles.includes(userRole)));

  const kycBadgeConfig = {
    pending: { text: 'KYC Pending', bg: 'warning', icon: 'bi-clock-history' },
    submitted: { text: 'KYC Submitted', bg: 'info', icon: 'bi-hourglass-split' },
    verified: { text: 'KYC Verified', bg: 'success', icon: 'bi-patch-check-fill' },
    rejected: { text: 'KYC Rejected', bg: 'danger', icon: 'bi-x-circle-fill' },
  };

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

          <div className="d-flex align-items-center gap-2">
            {demoMode && (
              <span 
                className="badge bg-warning text-dark"
                title="Demo Mode active: sample assets, tokens and payouts are loaded"
              >
                <i className="bi bi-flag-fill me-1"/>DEMO
              </span>
            )}
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <NotificationCenter
                  onNotificationClick={(notification: Notification) => {
                    // Navigate to action URL if provided
                    if (notification.action_url) {
                      // Simple URL routing based on action_url
                      if (notification.action_url.includes('/investor')) {
                        onPageChange(Page.InvestorDashboard);
                      } else if (notification.action_url.includes('/operator')) {
                        onPageChange(Page.OperatorDashboard);
                      }
                    }
                  }}
                />
                
                <span className="badge bg-light text-dark border"><i className="bi bi-person-circle me-1"/>{userName || 'User'} · {userRole}</span>
                {kycStatus && (userRole === 'investor' || userRole === 'operator') && (
                  <span className={`badge bg-${kycBadgeConfig[kycStatus].bg} text-white`}>
                    <i className={`bi ${kycBadgeConfig[kycStatus].icon} me-1`}/>
                    {kycBadgeConfig[kycStatus].text}
                  </span>
                )}
                {onLogout && (
                  <button className="btn btn-sm btn-outline-light" onClick={onLogout}>
                    <i className="bi bi-box-arrow-right me-1"/>Logout
                  </button>
                )}
              </>
            ) : (
              <div className="d-flex gap-2">
                {onRegister && <button className="btn btn-sm btn-outline-light" onClick={onRegister}><i className="bi bi-person-plus me-1"/>Register</button>}
                {onLogin && <button className="btn btn-sm btn-light text-success" onClick={onLogin}><i className="bi bi-box-arrow-in-right me-1"/>Login</button>}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

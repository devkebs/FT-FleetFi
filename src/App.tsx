import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Page, Asset, Token, Payout, SLXListing, Pagination } from './types';
import { initialTokens, initialPayouts, initialSLXListings, initialAssets } from './services/mockData';
import { Header } from './components/Header';
import LandingPage from './pages/LandingPage';
import { fetchAssets, getCurrentUser, logout } from './services/api';
import { ToastProvider } from './components/ToastProvider';
import { AuthModal } from './components/AuthModal';
import { RegistrationModal } from './components/RegistrationModal';
import { KycModal } from './components/KycModal';
import { FeedbackModal } from './components/FeedbackModal';
import { SentimentWidget } from './components/SentimentWidget';
import { getKycStatus } from './services/kyc';
import { trackEvent, trackMilestone, trackConversion } from './services/analytics';
import { ConnectivityBanner } from './components/ConnectivityBanner';

// Lazy load heavy dashboard components for better initial load
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const InvestorDashboard = lazy(() => import('./pages/InvestorDashboard').then(m => ({ default: m.InvestorDashboard })));
const OperatorDashboard = lazy(() => import('./pages/OperatorDashboard').then(m => ({ default: m.OperatorDashboard })));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard').then(m => ({ default: m.DriverDashboard })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const ESGImpactPage = lazy(() => import('./pages/ESGImpactPage').then(m => ({ default: m.ESGImpactPage })));
const SLXMarketplace = lazy(() => import('./pages/SLXMarketplace').then(m => ({ default: m.SLXMarketplace })));
const RidersPage = lazy(() => import('./pages/RidersPage'));
// const TrovotechOnboardingPage = lazy(() => import('../pages/TrovotechOnboardingPage').then(m => ({ default: m.TrovotechOnboardingPage })));

// Loading component for Suspense fallback
const PageLoader: React.FC = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px', padding: '3rem' }}>
    <div className="text-center">
      <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted mt-3">Loading page...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Landing);
  const [userRole, setUserRole] = useState<'investor' | 'operator' | 'driver' | 'admin'>('investor');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [demoMode, setDemoMode] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showKyc, setShowKyc] = useState(false);
  const [kycStatus, setKycStatus] = useState<'pending' | 'submitted' | 'verified' | 'rejected'>('pending');
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackTrigger, setFeedbackTrigger] = useState('general');
  const [suggestedRole, setSuggestedRole] = useState<'investor' | 'operator' | 'driver' | undefined>(undefined);
  const [accessMessage, setAccessMessage] = useState<string | undefined>(undefined);
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetPage, setAssetPage] = useState(1);
  const [assetPerPage] = useState(10);
  const [assetMeta, setAssetMeta] = useState<Omit<Pagination<Asset>, 'data'> | null>(null);
  const [tokens, setTokens] = useState<Token[]>(initialTokens);
  const [payouts, setPayouts] = useState<Payout[]>(initialPayouts);
  const [slxListings, setSlxListings] = useState<SLXListing[]>(initialSLXListings);
  // Initialize demo mode from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('demo_mode') === 'true';
      if (saved) {
        enableDemoMode();
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Role-based page permission
  const publicPages = [Page.Landing, Page.About, Page.Contact, Page.ESGImpact]; // Accessible to all without login
  const pageAllowed = (role: 'investor'|'operator'|'driver'|'admin', page: Page): boolean => {
    const investorPages = [Page.InvestorDashboard, Page.SLXMarketplace];
    const operatorPages = [Page.OperatorDashboard, Page.Riders];
    const driverPages: Page[] = [Page.DriverDashboard];
    const adminPages: Page[] = [Page.AdminDashboard];
    if (investorPages.includes(page)) return role === 'investor';
    if (operatorPages.includes(page)) return role === 'operator';
    if (driverPages.includes(page)) return role === 'driver';
    if (adminPages.includes(page)) return role === 'admin';
    return true; // Public pages return true
  };

  const emitToast = (type: string, title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { type, title, message } }));
  };

  const handleNavigate = (page: Page) => {
    // Check if page is public (accessible without authentication)
    if (publicPages.includes(page)) {
      trackEvent('page_view', { 
        from_page: Page[currentPage], 
        to_page: Page[page],
        role: userRole 
      });
      setCurrentPage(page);
      return;
    }
    
    // Check if user is trying to access protected pages
    const investorPages = [Page.InvestorDashboard, Page.SLXMarketplace];
    const operatorPages = [Page.OperatorDashboard, Page.Riders];
    const driverPages: Page[] = [Page.DriverDashboard];
    const adminPages: Page[] = [Page.AdminDashboard];
    const protectedPages = [...investorPages, ...operatorPages, ...driverPages, ...adminPages];
    
    // If not authenticated and trying to access protected page
    if (!isAuthenticated && protectedPages.includes(page)) {
      let roleNeeded = '';
      let actionMessage = '';
      let roleValue: 'investor' | 'operator' | 'driver' = 'investor';
      
      if (investorPages.includes(page)) {
        roleNeeded = 'Investor';
        roleValue = 'investor';
        actionMessage = 'to start investing in our tokenized EV fleet';
      } else if (operatorPages.includes(page)) {
        roleNeeded = 'Operator';
        roleValue = 'operator';
        actionMessage = 'to manage fleet operations';
      } else if (driverPages.includes(page)) {
        roleNeeded = 'Driver';
        roleValue = 'driver';
        actionMessage = 'to access driver dashboard';
      } else if (adminPages.includes(page)) {
        roleNeeded = 'Administrator';
        roleValue = 'investor'; // Default for admin
        actionMessage = 'to access admin panel';
      }
      
      emitToast('info', `${roleNeeded} Access Required`, `Please login or register as ${roleNeeded.toLowerCase()} ${actionMessage}.`);
      
      // Set suggested role and access message for auth modal
      setSuggestedRole(roleValue);
      setAccessMessage(`You need to sign in as ${roleNeeded} ${actionMessage}.`);
      
      // Automatically open login/register modal for better UX
      if (page !== Page.AdminDashboard) {
        setTimeout(() => {
          setShowAuth(true);
        }, 500);
      } else {
        // For admin, navigate to admin login page
        setCurrentPage(Page.AdminLogin);
      }
      return;
    }
    
    // If authenticated but role doesn't match
    if (isAuthenticated && !pageAllowed(userRole, page)) {
      let correctRole = '';
      
      if (investorPages.includes(page)) {
        correctRole = 'investor';
      } else if (operatorPages.includes(page)) {
        correctRole = 'operator';
      } else if (driverPages.includes(page)) {
        correctRole = 'driver';
      } else if (adminPages.includes(page)) {
        correctRole = 'admin';
      }
      
      emitToast('warning', 'Insufficient Permissions', 
        `This page requires ${correctRole} role. Your current role is ${userRole}.`);
      return;
    }
    
    // Track page navigation
    trackEvent('page_view', { 
      from_page: Page[currentPage], 
      to_page: Page[page],
      role: userRole 
    });
    
    setCurrentPage(page);
  };

  const updateTelemetry = useCallback(() => {
    // Simple UI-side daily swaps increment for demo only
    setAssets(prev => prev.map(a => ({ ...a, dailySwaps: a.status === 'In Use' ? a.dailySwaps + Math.floor(Math.random() * 2) : a.dailySwaps })));
  }, []);


  useEffect(() => {
    const interval = setInterval(updateTelemetry, 5000);
    return () => clearInterval(interval);
  }, [updateTelemetry]);

  const handleMintToken = (assetId: string, fraction: number, investAmount: number) => {
    const newToken: Token = {
        id: `TKN-${assetId}-${Date.now()}`,
        investorId: 'user-001',
        assetId,
        fraction,
        investAmount,
        roiProjection: investAmount * 0.45,
        mintedAt: new Date()
    };
    setTokens(prev => [...prev, newToken]);
  };

  const handleSimulateSwap = (assetId: string) => {
    setAssets(prev => prev.map(asset => asset.id === assetId ? { ...asset, swaps: asset.swaps + 1, dailySwaps: asset.dailySwaps + 1 } : asset));
  };
    
  const handleSimulateCharge = (_assetId: string) => { /* backend integration placeholder */ };

  const handleUpdateStatus = (_assetId: string, _status: string) => { /* backend integration placeholder */ };

  // Fetch assets when entering dashboards or changing pagination
  useEffect(() => {
    // Try to populate auth from existing token (only on initial load)
    const hasCheckedAuth = sessionStorage.getItem('auth_checked');
    if (hasCheckedAuth) return; // Don't re-check on every render
    
    (async () => {
      try {
        const user = await getCurrentUser();
        if (user && (user as any).id) {
          setIsAuthenticated(true);
          setUserName(user.name);
          // Resolve role including admin; default to investor if missing
          const resolvedRole = ((user.role as 'investor'|'operator'|'driver'|'admin') || 'investor');
          setUserRole(resolvedRole);
          sessionStorage.setItem('auth_checked', 'true');
          
          // Check KYC status silently (no modal on page refresh)
          if (resolvedRole === 'investor' || resolvedRole === 'operator') {
            try {
              const kycData = await getKycStatus();
              setKycStatus(kycData.kyc_status);
            } catch (err) {
              console.warn('Failed to fetch KYC status:', err);
            }
          }
        }
      } catch (err: any) {
        // Silently handle auth failures - don't log as errors
        setIsAuthenticated(false);
        sessionStorage.setItem('auth_checked', 'true');
        // If 401, redirect to landing page if on protected route
        if (err?.status === 401 || err?.message === 'Session expired') {
          const protectedPages = [
            Page.InvestorDashboard, 
            Page.OperatorDashboard, 
            Page.DriverDashboard, 
            Page.AdminDashboard,
            Page.SLXMarketplace,
            Page.Riders
          ];
          if (protectedPages.includes(currentPage)) {
            emitToast('info', 'Session Expired', 'Please login to continue.');
            setCurrentPage(Page.Landing);
            setTimeout(() => setShowAuth(true), 500);
          }
        }
      }
    })();
    if (demoMode) {
      // In demo mode we don't fetch from backend; assets already injected
      return;
    }
    if (!(currentPage === Page.OperatorDashboard || currentPage === Page.InvestorDashboard)) return;
    (async () => {
      try {
        const pg = await fetchAssets(assetPage, assetPerPage);
        setAssets(pg.data);
        const { data, ...meta } = pg;
        setAssetMeta(meta);
      } catch (e) {
        emitToast('danger', 'Asset load failed', (e as any).message || 'Unable to fetch assets');
      }
    })();
  }, [currentPage, assetPage, assetPerPage, demoMode]);

  const enableDemoMode = () => {
    setDemoMode(true);
    setAssets(initialAssets);
    setTokens(initialTokens);
    setPayouts(initialPayouts);
    try { localStorage.setItem('demo_mode', 'true'); } catch {}
    emitToast('success', 'Demo Mode Enabled', 'Sample assets, tokens and payouts loaded.');
  };

  const disableDemoMode = () => {
    setDemoMode(false);
    setAssets([]);
    // Keep tokens/payouts but could clear if desired
    try { localStorage.removeItem('demo_mode'); } catch {}
    emitToast('info', 'Demo Mode Disabled', 'Switched back to live data (fetch on dashboard entry).');
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Landing:
        return <LandingPage onLogin={() => setShowAuth(true)} onRegister={() => setShowRegister(true)} onAdminLogin={() => setCurrentPage(Page.AdminLogin)} />;
      case Page.About:
        return (
          <Suspense fallback={<PageLoader />}>
            <AboutPage onNavigate={handleNavigate} />
          </Suspense>
        );
      case Page.Contact:
        return (
          <Suspense fallback={<PageLoader />}>
            <ContactPage onNavigate={handleNavigate} />
          </Suspense>
        );
      case Page.InvestorDashboard:
        return (
          <Suspense fallback={<PageLoader />}>
            <InvestorDashboard demoMode={demoMode} assets={assets} tokens={tokens} payouts={payouts} kycStatus={kycStatus} onOpenKyc={() => setShowKyc(true)} />
          </Suspense>
        );
      case Page.OperatorDashboard:
        return (
          <Suspense fallback={<PageLoader />}>
            <OperatorDashboard 
              demoMode={demoMode}
              assets={assets}
              page={assetMeta?.page || 1}
              totalPages={assetMeta?.totalPages || 1}
              onChangePage={(p)=> setAssetPage(p)}
              kycStatus={kycStatus}
              onOpenKyc={() => setShowKyc(true)}
            />
          </Suspense>
        );
      case Page.DriverDashboard:
        return (
          <Suspense fallback={<PageLoader />}>
            <DriverDashboard demoMode={demoMode} />
          </Suspense>
        );
      case Page.AdminLogin:
        return (
          <Suspense fallback={<PageLoader />}>
            <AdminLoginPage onAuthenticated={(role,user)=>{ 
              setIsAuthenticated(true); 
              setUserRole(role); 
              setUserName(user.name); 
              
              // Track admin login
              trackEvent('admin_login_success', { user_name: user.name, role });
              trackMilestone('admin_access', { login_time: new Date().toISOString() });
              
              setCurrentPage(Page.AdminDashboard); 
            }} navigate={handleNavigate} />
          </Suspense>
        );
      case Page.AdminDashboard:
        return (
          <Suspense fallback={<PageLoader />}>
            <AdminDashboardPage />
          </Suspense>
        );
      case Page.Riders:
        return (
          <Suspense fallback={<PageLoader />}>
            <RidersPage />
          </Suspense>
        );
      // case Page.TrovotechOnboarding:
      //   return (
      //     <Suspense fallback={<PageLoader />}>
      //       <TrovotechOnboardingPage />
      //     </Suspense>
      //   );
      case Page.ESGImpact:
        return (
          <Suspense fallback={<PageLoader />}>
            <ESGImpactPage assets={assets} />
          </Suspense>
        );
      case Page.SLXMarketplace:
        return (
          <Suspense fallback={<PageLoader />}>
            <SLXMarketplace slxListings={slxListings} assets={assets} />
          </Suspense>
        );
      default:
        return <LandingPage onLogin={() => setShowAuth(true)} onRegister={() => setShowRegister(true)} onAdminLogin={() => setCurrentPage(Page.AdminLogin)} />;
    }
  };

  // Guard: if current page becomes invalid after role change, show landing
  if (!pageAllowed(userRole, currentPage)) {
    return <LandingPage onLogin={() => setShowAuth(true)} onRegister={() => setShowRegister(true)} onAdminLogin={() => setCurrentPage(Page.AdminLogin)} />;
  }

  // Hide App Header on Landing page (it has its own navigation)
  const showAppHeader = currentPage !== Page.Landing;

  return (
    <ToastProvider>
    <div style={{ minHeight: '100vh', backgroundColor: currentPage === Page.Landing ? 'transparent' : '#f8f9fa' }}>
      <ConnectivityBanner />
      {showAppHeader && (
        <Header
          currentPage={currentPage}
          onPageChange={handleNavigate}
          userRole={userRole}
          isAuthenticated={isAuthenticated}
          userName={userName}
          kycStatus={kycStatus}
          demoMode={demoMode}
          onLogin={() => { setShowAuth(true); setShowRegister(false); }}
          onRegister={() => { setShowRegister(true); setShowAuth(false); }}
          onLogout={async () => {
            try {
              // Track logout event
              trackEvent('logout', { role: userRole, user_name: userName });

              await logout();
              setIsAuthenticated(false);
              setUserName(undefined);
              sessionStorage.removeItem('auth_checked'); // Clear auth check flag
              emitToast('success', 'Signed out', 'You have been logged out.');
              setCurrentPage(Page.Landing);
            } catch(e){
              emitToast('danger', 'Logout failed', (e as any).message || 'Error');
            }
          }}
        />
      )}
      {currentPage === Page.Landing ? renderPage() : <main>{renderPage()}</main>}
      <AuthModal 
        show={showAuth} 
        onClose={() => {
          setShowAuth(false);
          setSuggestedRole(undefined);
          setAccessMessage(undefined);
        }} 
        onShowRegister={() => { 
          setShowAuth(false); 
          setShowRegister(true);
          // Keep suggestedRole for registration
        }}
        suggestedRole={suggestedRole}
        accessMessage={accessMessage}
        onSuccess={async (role, user) => { 
          setIsAuthenticated(true); 
          setUserRole(role); 
          setUserName(user.name); 
          
          // Show single welcome toast
          const roleLabels: Record<string, string> = { investor: 'Investor', operator: 'Operator', driver: 'Driver', admin: 'Admin' };
          emitToast('success', 'Welcome!', `Signed in as ${roleLabels[role]}`);
          
          // Track login milestone
          trackMilestone('user_login', { role, user_id: user.id });
          
          // Show feedback after 30 seconds of first login
          setTimeout(() => {
            setFeedbackTrigger('post_login');
            setShowFeedback(true);
          }, 30000);
          
          const target = role==='investor' 
            ? Page.InvestorDashboard 
            : role==='driver' 
              ? Page.DriverDashboard 
              : role==='admin'
                ? Page.AdminDashboard
                : Page.OperatorDashboard; 
          setCurrentPage(target);
          // Check KYC after login
          if (role === 'investor' || role === 'operator') {
            try {
              const kycData = await getKycStatus();
              setKycStatus(kycData.kyc_status);
              if (kycData.kyc_status === 'pending') {
                setTimeout(() => setShowKyc(true), 1000);
              }
            } catch {}
          }
        }}
      />
      <RegistrationModal 
        show={showRegister}
        onClose={() => {
          setShowRegister(false);
          setSuggestedRole(undefined);
          setAccessMessage(undefined);
        }}
        suggestedRole={suggestedRole}
        onSuccess={async (role: 'investor'|'operator'|'driver'|'admin', user: { id: number; name: string; email: string; role?: string }) => { 
          setIsAuthenticated(true); 
          setUserRole(role); 
          setUserName(user.name); 
          
          // Track registration milestone and conversion
          trackMilestone('registration_completed', { role, user_id: user.id });
          trackConversion('user_registration', undefined, { role });
          
          const target = role==='investor' 
            ? Page.InvestorDashboard 
            : role==='driver' 
              ? Page.DriverDashboard 
              : role==='admin'
                ? Page.AdminDashboard
                : Page.OperatorDashboard; 
          setCurrentPage(target);
          // Auto-show KYC modal after registration for investors/operators
          if (role === 'investor' || role === 'operator') {
            setKycStatus('pending');
            setTimeout(() => setShowKyc(true), 1500);
            // Track KYC started
            trackEvent('kyc_started', { role });
          }
        }}
      />
      <KycModal
        show={showKyc}
        onClose={() => setShowKyc(false)}
        onSuccess={async () => {
          setKycStatus('submitted');
          
          // Track KYC completion
          trackMilestone('kyc_verified', { role: userRole });
          trackEvent('kyc_completed', { role: userRole });
          
          // Show feedback modal after KYC
          setTimeout(() => {
            setFeedbackTrigger('kyc_completion');
            setShowFeedback(true);
          }, 1000);
          
          // Refresh KYC status from server
          try {
            const kycData = await getKycStatus();
            setKycStatus(kycData.kyc_status);
          } catch {}
        }}
      />
      
      <FeedbackModal
        show={showFeedback}
        onClose={() => setShowFeedback(false)}
        triggerPoint={feedbackTrigger}
      />
      
      <SentimentWidget
        context={`${Page[currentPage]}_${userRole}`}
        position="bottom-right"
      />
    </div>
    </ToastProvider>
  );
};

export default App;

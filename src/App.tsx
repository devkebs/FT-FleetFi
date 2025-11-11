import React, { useState, useEffect, useCallback } from 'react';
import { Page, Asset, Token, Payout, SLXListing, Pagination } from './types';
import { initialTokens, initialPayouts, initialSLXListings } from './services/mockData';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import { InvestorDashboard } from './pages/InvestorDashboard';
import { OperatorDashboard } from './pages/OperatorDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import AdminDashboardPage from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ESGImpactPage } from './pages/ESGImpactPage';
import { SLXMarketplace } from './pages/SLXMarketplace';
import { RidersPage } from './pages/RidersPage';
import { fetchAssets, getCurrentUser, logout } from './services/api';
import { ToastProvider } from './components/ToastProvider';
import { AuthModal } from './components/AuthModal';
import { RegistrationModal } from './components/RegistrationModal';
import { KycModal } from './components/KycModal';
import { FeedbackModal } from './components/FeedbackModal';
import { SentimentWidget } from './components/SentimentWidget';
import { getKycStatus } from './services/kyc';
import { trackEvent, trackMilestone, trackConversion } from './services/analytics';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Landing);
  const [userRole, setUserRole] = useState<'investor' | 'operator' | 'driver' | 'admin'>('investor');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | undefined>(undefined);
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

  // Role-based page permission
  const pageAllowed = (role: 'investor'|'operator'|'driver'|'admin', page: Page): boolean => {
    const investorPages = [Page.InvestorDashboard, Page.SLXMarketplace];
    const operatorPages = [Page.OperatorDashboard, Page.Riders];
    const driverPages: Page[] = [Page.DriverDashboard];
  const adminPages: Page[] = [Page.AdminDashboard];
    if (investorPages.includes(page)) return role === 'investor';
    if (operatorPages.includes(page)) return role === 'operator';
    if (driverPages.includes(page)) return role === 'driver';
    if (adminPages.includes(page)) return role === 'admin';
    return true; // Landing, ESGImpact
  };

  const emitToast = (type: string, title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { type, title, message } }));
  };

  const handleNavigate = (page: Page) => {
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
    // Try to populate auth from existing token
    (async () => {
      try {
        const user = await getCurrentUser();
        if (user && (user as any).id) {
          setIsAuthenticated(true);
          setUserName(user.name);
          // Resolve role including admin; default to investor if missing
          const resolvedRole = ((user.role as 'investor'|'operator'|'driver'|'admin') || 'investor');
          setUserRole(resolvedRole);
          
          // Check KYC status after login
          if (resolvedRole === 'investor' || resolvedRole === 'operator') {
            try {
              const kycData = await getKycStatus();
              setKycStatus(kycData.kyc_status);
              // Auto-show KYC modal if pending
              if (kycData.kyc_status === 'pending') {
                setTimeout(() => setShowKyc(true), 1000); // Small delay for UX
              }
            } catch (err) {
              console.warn('Failed to fetch KYC status:', err);
            }
          }
        }
      } catch {
        setIsAuthenticated(false);
      }
    })();
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
  }, [currentPage, assetPage, assetPerPage]);

  const renderPage = () => {
    switch (currentPage) {
      case Page.Landing:
        return <LandingPage onNavigate={handleNavigate} />;
      case Page.About:
        return <AboutPage onNavigate={handleNavigate} />;
      case Page.InvestorDashboard:
        return <InvestorDashboard assets={assets} tokens={tokens} payouts={payouts} kycStatus={kycStatus} onOpenKyc={() => setShowKyc(true)} />;
      case Page.OperatorDashboard:
        return (
          <OperatorDashboard 
            assets={assets}
            page={assetMeta?.page || 1}
            totalPages={assetMeta?.totalPages || 1}
            onChangePage={(p)=> setAssetPage(p)}
            kycStatus={kycStatus}
            onOpenKyc={() => setShowKyc(true)}
          />
        );
      case Page.DriverDashboard:
        return <DriverDashboard assets={assets} />;
      case Page.AdminLogin:
        return <AdminLoginPage onAuthenticated={(role,user)=>{ 
          setIsAuthenticated(true); 
          setUserRole(role); 
          setUserName(user.name); 
          
          // Track admin login
          trackEvent('admin_login_success', { user_name: user.name, role });
          trackMilestone('admin_access', { login_time: new Date().toISOString() });
          
          setCurrentPage(Page.AdminDashboard); 
        }} navigate={handleNavigate} />;
      case Page.AdminDashboard:
        return <AdminDashboardPage />;
      case Page.Riders:
        return <RidersPage />;
      case Page.ESGImpact:
        return <ESGImpactPage assets={assets} />;
      case Page.SLXMarketplace:
        return <SLXMarketplace slxListings={slxListings} assets={assets} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  // Guard: if current page becomes invalid after role change, show landing
  if (!pageAllowed(userRole, currentPage)) {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  return (
    <ToastProvider>
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Header 
        currentPage={currentPage} 
        onPageChange={handleNavigate}
        userRole={userRole}
        isAuthenticated={isAuthenticated}
        userName={userName}
        kycStatus={kycStatus}
        onLogin={() => { setShowAuth(true); setShowRegister(false); }}
        onRegister={() => { setShowRegister(true); setShowAuth(false); }}
        onLogout={async () => { 
          try { 
            // Track logout event
            trackEvent('logout', { role: userRole, user_name: userName });
            
            await logout(); 
            setIsAuthenticated(false); 
            setUserName(undefined); 
            emitToast('success', 'Signed out', 'You have been logged out.'); 
            setCurrentPage(Page.Landing);
          } catch(e){ 
            emitToast('danger', 'Logout failed', (e as any).message || 'Error'); 
          }
        }}
      />
      <main>
        {renderPage()}
      </main>
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

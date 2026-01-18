import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (don't show for 7 days after dismissal)
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay (let user explore first)
      setTimeout(() => setShowPrompt(true), 30000); // 30 seconds
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
        localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
      }
    } catch (err) {
      console.error('[PWA] Install prompt error:', err);
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div
      className="position-fixed bottom-0 start-50 translate-middle-x mb-3"
      style={{ zIndex: 9999, maxWidth: '400px', width: '90%' }}
    >
      <div className="card border-0 shadow-lg">
        <div className="card-body p-3">
          <div className="d-flex align-items-start gap-3">
            <div
              className="rounded-circle bg-success bg-opacity-10 p-2 flex-shrink-0"
              style={{ width: '48px', height: '48px' }}
            >
              <i className="bi bi-lightning-charge-fill text-success fs-4 d-flex align-items-center justify-content-center h-100"></i>
            </div>
            <div className="flex-grow-1">
              <h6 className="mb-1 fw-bold">Install FleetFi</h6>
              <p className="text-muted small mb-2">
                Add FleetFi to your home screen for quick access and offline support.
              </p>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleInstall}
                >
                  <i className="bi bi-download me-1"></i>
                  Install
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleDismiss}
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              className="btn-close flex-shrink-0"
              onClick={handleDismiss}
              aria-label="Close"
            ></button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to detect PWA installation status and provide install functionality
 */
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);
      return outcome === 'accepted';
    } catch (err) {
      console.error('[PWA] Install prompt error:', err);
      return false;
    }
  };

  return { canInstall, isInstalled, promptInstall };
};

export default PWAInstallPrompt;

import React, { useEffect, useState } from 'react';

/**
 * Displays a slim banner when the app is offline and disappears when back online.
 */
export const ConnectivityBanner: React.FC = () => {
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="w-100" style={{ position: 'sticky', top: 0, zIndex: 1100 }}>
      <div className="alert alert-warning border-0 rounded-0 mb-0 py-2 text-center">
        <i className="bi bi-wifi-off me-2" />You are offline. Some features may be unavailable.
      </div>
    </div>
  );
};

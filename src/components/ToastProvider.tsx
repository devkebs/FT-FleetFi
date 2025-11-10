import React, { useEffect, useState } from 'react';

type ToastType = 'success' | 'info' | 'warning' | 'danger';

interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  timeout?: number;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const id = Date.now() + Math.random();
      const item: ToastItem = {
        id,
        type: (detail.type || 'info') as ToastType,
        title: detail.title,
        message: detail.message || String(detail),
        timeout: detail.timeout ?? 4000,
      };
      setToasts(prev => [...prev, item]);
      const t = setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== id));
      }, item.timeout);
      return () => clearTimeout(t);
    };
    window.addEventListener('app:toast', handler as any);
    return () => window.removeEventListener('app:toast', handler as any);
  }, []);

  return (
    <>
      {children}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1080 }}>
        <div className="d-flex flex-column gap-2 align-items-end">
          {toasts.map(t => (
            <div key={t.id} className={`alert alert-${t.type} shadow`} role="alert" style={{ minWidth: 280, maxWidth: 420 }}>
              <div className="d-flex">
                <div className="flex-grow-1">
                  {t.title && <div className="fw-semibold mb-1">{t.title}</div>}
                  <div>{t.message}</div>
                </div>
                <button type="button" className="btn-close ms-2" aria-label="Close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
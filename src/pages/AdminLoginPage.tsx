import React, { useState } from 'react';
import { login, getCurrentUser } from '../services/api';
import { Page } from '../types';

interface AdminLoginPageProps {
  onAuthenticated: (role: 'admin', user: { id: number; name: string; email: string }) => void;
  navigate: (page: Page) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onAuthenticated, navigate }) => {
  const [email, setEmail] = useState('jane.admin@fleetfi.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const emitToast = (type: string, title: string, message: string) => {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: { type, title, message } }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login({ email, password, role: 'admin' as any });
      const user = await getCurrentUser();
      if (user.role !== 'admin') {
        emitToast('danger','Access denied','Account is not an admin');
        return;
      }
      emitToast('success','Welcome','Admin access granted');
      onAuthenticated('admin', { id: user.id, name: user.name, email: user.email });
      navigate(Page.AdminDashboard);
    } catch (err) {
      emitToast('danger','Login failed',(err as any).message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow-sm">
            <div className="card-header bg-danger text-white">
              <h5 className="mb-0"><i className="bi bi-shield-lock-fill me-2"/>Admin Login</h5>
            </div>
            <form onSubmit={submit}>
              <div className="card-body">
                <p className="text-muted small">Restricted access. Use the issued administrative credentials.</p>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required />
                </div>
                <div className="alert alert-info small">
                  <i className="bi bi-info-circle me-1"/>Default credentials: <code>jane.admin@fleetfi.com</code> / <code>admin123</code>
                </div>
              </div>
              <div className="card-footer d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary" onClick={()=>navigate(Page.Landing)}>Back</button>
                <button type="submit" className="btn btn-danger" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

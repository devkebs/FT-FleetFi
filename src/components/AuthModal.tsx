import React, { useState } from 'react';
import { login, getCurrentUser } from '../services/api';

interface AuthModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: (role: 'investor'|'operator'|'driver'|'admin', user: { id: number; name: string; email: string; role?: string }) => void;
  onShowRegister?: () => void;
  suggestedRole?: 'investor' | 'operator' | 'driver';
  accessMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  show, 
  onClose, 
  onSuccess, 
  onShowRegister,
  suggestedRole,
  accessMessage
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'investor'|'operator'|'driver'>(suggestedRole || 'investor');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Update role when suggestedRole changes
  React.useEffect(() => {
    if (suggestedRole) {
      setRole(suggestedRole);
    }
  }, [suggestedRole]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login({ email, password, rememberMe, role });
      const user = await getCurrentUser();
      const resolvedRole = (user.role === 'operator'
        ? 'operator'
        : user.role === 'driver'
          ? 'driver'
          : user.role === 'admin'
            ? 'admin'
            : 'investor') as 'investor'|'operator'|'driver'|'admin';
      // Don't show toast here - let App.tsx handle it to avoid duplicate
      onSuccess(resolvedRole, user);
      onClose();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'danger', title: 'Login failed', message: (err as any).message || 'Invalid credentials' } }));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex={-1}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title"><i className="bi bi-box-arrow-in-right me-2"/>Sign in</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              {accessMessage && (
                <div className="alert alert-info mb-3">
                  <i className="bi bi-info-circle me-2" />
                  {accessMessage}
                </div>
              )}
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Role</label>
                <select className="form-select" value={role} onChange={e=>setRole(e.target.value as any)}>
                  <option value="investor">Investor - Invest in assets and view portfolio</option>
                  <option value="operator">Operator - Manage fleet operations</option>
                  <option value="driver">Driver - View assignments and earnings</option>
                </select>
                {suggestedRole && (
                  <div className="form-text text-primary">
                    <i className="bi bi-lightbulb me-1" />
                    {suggestedRole === 'investor' && 'Pre-selected for investment features'}
                    {suggestedRole === 'operator' && 'Pre-selected for fleet management'}
                    {suggestedRole === 'driver' && 'Pre-selected for driver features'}
                  </div>
                )}
                {!suggestedRole && (
                  <div className="form-text">Select the role associated with your account.</div>
                )}
              </div>
              <div className="form-check">
                <input id="rememberMe" className="form-check-input" type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} />
                <label htmlFor="rememberMe" className="form-check-label">Remember me</label>
              </div>
            </div>
            <div className="modal-footer justify-content-between">
              <div className="text-start">
                {onShowRegister && (
                  <button type="button" className="btn btn-outline-success btn-sm" onClick={onShowRegister}>
                    <i className="bi bi-person-plus me-1" />
                    Need an account? Register
                  </button>
                )}
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

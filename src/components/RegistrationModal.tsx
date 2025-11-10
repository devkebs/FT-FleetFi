import React, { useState } from 'react';
import { register as apiRegister, getCurrentUser } from '../services/api';

interface RegistrationModalProps {
  show: boolean;
  onClose: () => void;
  onSuccess: (role: 'investor'|'operator'|'driver'|'admin', user: { id: number; name: string; email: string; role?: string }) => void;
  suggestedRole?: 'investor' | 'operator' | 'driver';
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ 
  show, 
  onClose, 
  onSuccess,
  suggestedRole
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'investor'|'operator'|'driver'>(suggestedRole || 'investor');
  const [loading, setLoading] = useState(false);

  // Update role when suggestedRole changes
  React.useEffect(() => {
    if (suggestedRole) {
      setRole(suggestedRole);
    }
  }, [suggestedRole]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'warning', title: 'Check password', message: 'Passwords do not match' } }));
      return;
    }
    try {
      setLoading(true);
      await apiRegister({ name, email, password, role });
      const user = await getCurrentUser();
      const resolvedRole = (user.role === 'operator'
        ? 'operator'
        : user.role === 'driver'
          ? 'driver'
          : user.role === 'admin'
            ? 'admin'
            : 'investor') as 'investor'|'operator'|'driver'|'admin';
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'success', title: 'Welcome', message: 'Account created and signed in' } }));
      onSuccess(resolvedRole, user);
      onClose();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'danger', title: 'Registration failed', message: (err as any).message || 'Unable to register' } }));
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
            <h5 className="modal-title"><i className="bi bi-person-plus me-2"/>Create account</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={submit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Full name</label>
                <input className="form-control" value={name} onChange={e=>setName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required />
              </div>
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required />
                </div>
                <div className="col-6">
                  <label className="form-label">Confirm password</label>
                  <input type="password" className="form-control" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
                </div>
              </div>
              <div className="mb-3 mt-2">
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
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-success" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

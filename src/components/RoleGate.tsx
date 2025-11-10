import React from 'react';

type Role = 'investor'|'operator'|'driver';

interface RoleGateProps {
  role: Role | undefined;
  allow: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ role, allow, children, fallback = null }) => {
  if (!role || !allow.includes(role)) {
    try {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { type: 'warning', title: 'Access denied', message: 'Your role cannot access this area.' } }));
    } catch {}
    return <>{fallback}</>;
  }
  return <>{children}</>;
};

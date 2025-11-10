import { getStoredToken } from './api';

const API_URL = 'http://localhost:8000/api';

export interface AdminOverview {
  users: {
    total: number;
    by_role: Record<string, number>;
    kyc_pending: number;
    kyc_verified: number;
  };
  assets: {
    total: number;
    by_status: Record<string, number>;
  };
  revenue: {
    total: number;
    monthly: number;
  };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  kyc_status: string;
  created_at: string;
  email_verified_at: string | null;
}

export interface RevenueStats {
  monthly: Array<{
    month: string;
    label: string;
    amount: number;
  }>;
  total: number;
}

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  } as Record<string, string>;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let body: any = null;
    try { body = await res.json(); } catch {}
    const message = body?.message || res.statusText || 'Request failed';
    if (body?.errors) {
      // Throw a richer error object so callers can surface field-level validation
      throw { name: 'ValidationError', message, errors: body.errors, status: res.status };
    }
    throw new Error(message);
  }
  return res;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await authFetch(`${API_URL}/admin/overview`);
  return res.json();
}

export async function getAdminUsers(page = 1, perPage = 20, search = ''): Promise<{ data: AdminUser[]; total: number; per_page: number; current_page: number }> {
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (search) params.append('search', search);
  const res = await authFetch(`${API_URL}/admin/users?${params}`);
  return res.json();
}

export async function updateUserRole(userId: number, role: 'investor' | 'operator' | 'driver' | 'admin'): Promise<{ message: string; user: any }> {
  const res = await authFetch(`${API_URL}/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role })
  });
  return res.json();
}

export async function toggleUserStatus(userId: number): Promise<{ message: string; user: any; status: string }> {
  const res = await authFetch(`${API_URL}/admin/users/${userId}/toggle-status`, {
    method: 'PATCH'
  });
  return res.json();
}

export async function getRevenueStats(months = 6): Promise<RevenueStats> {
  const res = await authFetch(`${API_URL}/admin/revenue-stats?months=${months}`);
  return res.json();
}

export interface AuditLogEntry {
  id: number;
  user_id: number;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  user?: { id: number; name: string; email: string };
}

export async function getAuditLogs(page=1, perPage=25, filters?: { action?: string; entity_type?: string }) : Promise<{ data: AuditLogEntry[]; total: number; current_page: number; per_page: number; }> {
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (filters?.action) params.append('action', filters.action);
  if (filters?.entity_type) params.append('entity_type', filters.entity_type);
  const res = await authFetch(`${API_URL}/admin/activity-logs?${params.toString()}`);
  return res.json();
}

export async function createUser(data: { name: string; email: string; password: string; role: 'investor'|'operator'|'driver'|'admin' }): Promise<{ message: string; user: any }> {
  const res = await authFetch(`${API_URL}/admin/users`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
}

import { getStoredToken } from './api';

// Use 127.0.0.1 to avoid local host-header quirks seen elsewhere
const API_URL = 'http://127.0.0.1:8000/api';

export interface KycStatus {
  kyc_status: 'pending' | 'submitted' | 'verified' | 'rejected';
  kyc_submitted_at: string | null;
  kyc_verified_at: string | null;
  kyc_document_type: string | null;
}

export interface KycSubmitData {
  document_type: 'nin' | 'bvn' | 'drivers_license' | 'passport';
  document_number: string;
  full_name?: string;
  address?: string;
}

export interface PendingKycUser {
  id: number;
  name: string;
  email: string;
  role: string;
  kyc_status: string;
  kyc_submitted_at: string;
  kyc_document_type: string;
  kyc_document_number: string;
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
    let msg = res.statusText;
    try { const j = await res.json(); msg = j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res;
}

export async function getKycStatus(): Promise<KycStatus> {
  const res = await authFetch(`${API_URL}/kyc/status`);
  return res.json();
}

export async function submitKyc(
  data: KycSubmitData
): Promise<{ message: string; provider_status?: string; provider_ref?: string; internal_status?: string; user?: any }> {
  const res = await authFetch(`${API_URL}/kyc/submit`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function pollKyc(): Promise<{ provider_status: string; internal_status: string; ref: string | null }>{
  const res = await authFetch(`${API_URL}/kyc/poll`, { method: 'POST' });
  return res.json();
}

export async function reviewKyc(userId: number, action: 'approve' | 'reject', note?: string): Promise<{ message: string; user: any }> {
  const res = await authFetch(`${API_URL}/kyc/review`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, action, note })
  });
  return res.json();
}

export async function getPendingKyc(): Promise<{ count: number; users: PendingKycUser[] }> {
  const res = await authFetch(`${API_URL}/kyc/pending`);
  return res.json();
}

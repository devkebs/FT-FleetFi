import { getStoredToken } from './api';
import { Pagination } from '../types';

export interface AdminAsset {
  id: number;
  asset_id: string;
  type: 'vehicle'|'battery'|'charging_cabinet';
  model?: string;
  status: 'active'|'maintenance'|'retired';
  soh: number;
  swaps: number;
  location?: string;
  original_value: number;
  current_value?: number;
  daily_swaps: number;
  is_tokenized?: boolean;
  token_id?: string|null;
  metadata_hash?: string|null;
  trustee_ref?: string|null;
  telemetry_uri?: string|null;
  created_at?: string;
  updated_at?: string;
}

const API_URL = 'http://localhost:8000/api/admin';

function authHeaders() {
  const token = getStoredToken();
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export async function getAdminAssets(page=1, perPage=10): Promise<Pagination<AdminAsset>> {
  const res = await fetch(`${API_URL}/assets?page=${page}&perPage=${perPage}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load assets');
  return res.json();
}

interface CreateAssetInput {
  asset_id: string;
  type: 'vehicle'|'battery'|'charging_cabinet';
  model?: string;
  status?: 'active'|'maintenance'|'retired';
  soh: number;
  original_value: number;
  location?: string;
}

export async function createAdminAsset(input: CreateAssetInput): Promise<AdminAsset> {
  const res = await fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      ...input,
      status: input.status || 'active',
      swaps: 0,
      daily_swaps: 0,
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.message || 'Failed to create asset');
  }
  return res.json();
}

export async function updateAdminAsset(id: number, data: Partial<CreateAssetInput & { status: 'active'|'maintenance'|'retired'; soh: number; }>): Promise<AdminAsset> {
  const res = await fetch(`${API_URL}/assets/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.message || 'Failed to update asset');
  }
  return res.json();
}

export async function deleteAdminAsset(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/assets/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.message || 'Failed to delete asset');
  }
}

export async function updateAdminAssetStatus(id: number, status: 'active'|'maintenance'|'retired') {
  return updateAdminAsset(id, { status });
}

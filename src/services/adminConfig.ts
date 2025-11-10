import { getStoredToken } from './api';

const API_URL = 'http://localhost:8000/api/admin';

function authHeaders() {
  const token = getStoredToken();
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export interface ConfigSetting {
  key: string;
  value: any;
  type: 'string'|'number'|'boolean'|'json';
  isSecret?: boolean;
}

export async function fetchConfigSettings(): Promise<ConfigSetting[]> {
  const res = await fetch(`${API_URL}/config`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load settings');
  const json = await res.json();
  return json.settings || [];
}

export async function updateConfigSetting(setting: ConfigSetting): Promise<ConfigSetting> {
  const res = await fetch(`${API_URL}/config`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(setting)
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({}));
    throw new Error(err.message || 'Failed to update setting');
  }
  const json = await res.json();
  return json.setting;
}

export interface TrovoTechStatus {
  configured: boolean;
  sandbox: boolean;
  timeout_ms: number;
  base_url_set: boolean;
  api_key_set: boolean;
}

export async function fetchTrovoTechStatus(): Promise<TrovoTechStatus> {
  const res = await fetch(`${API_URL}/trovotech/status`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load TrovoTech status');
  return res.json();
}

export interface ConnectionTestResult {
  success: boolean;
  status_code?: number;
  latency_ms?: number;
  error?: string;
}

export async function testTrovoTechConnection(): Promise<ConnectionTestResult> {
  const res = await fetch(`${API_URL}/trovotech/test-connection`, {
    method: 'POST',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Test connection request failed');
  return res.json();
}

// ============================================================================
// API Configuration & Constants
// ============================================================================

import { apiCache, staleWhileRevalidate } from '../utils/apiCache';

const API_VERSION = 'v1';
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE_URL}/api`;

const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REMEMBER_ME: 'remember_me',
  TOKEN_EXPIRY: 'token_expiry',
  USER_DATA: 'user_data',
} as const;

// ============================================================================
// Types & Interfaces
// ============================================================================

export type UserRole = 'investor' | 'operator' | 'driver' | 'admin';

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
  role?: UserRole;
}

export interface RegisterData extends Omit<LoginData, 'rememberMe'> {
  name: string;
  role: Exclude<UserRole, 'admin'>;
}

export interface AuthResponse {
  token: string;
  user: CurrentUser;
  expiresIn?: number;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role?: UserRole;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// ============================================================================
// Token Management
// ============================================================================

export const TokenManager = {
  get(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN) || sessionStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  set(token: string, rememberMe: boolean = false, expiresIn?: number): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, String(rememberMe));
    
    if (expiresIn) {
      const expiryTime = Date.now() + expiresIn * 1000;
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiryTime));
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
  },

  isExpired(): boolean {
    const expiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiry) return false;
    return Date.now() > parseInt(expiry, 10);
  },

  isValid(): boolean {
    return !!this.get() && !this.isExpired();
  }
};

// Backward compatibility exports
export const getStoredToken = () => TokenManager.get();
export const setStoredToken = (token: string, rememberMe?: boolean, expiresIn?: number) => 
  TokenManager.set(token, rememberMe, expiresIn);
export const clearStoredToken = () => TokenManager.clear();
export const isTokenExpired = () => TokenManager.isExpired();

// ============================================================================
// HTTP Client & Error Handling
// ============================================================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = TokenManager.get();
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType?.includes('application/json');

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errors: Record<string, string[]> | undefined;

        if (isJson) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errors = errorData.errors;
        }

        // Handle 401 Unauthorized - clear token
        if (response.status === 401) {
          TokenManager.clear();
        }

        const error: ApiError = {
          message: errorMessage,
          errors,
          status: response.status,
        };
        throw error;
      }

      // Return blob for file downloads
      if (contentType?.includes('application/octet-stream') || 
          contentType?.includes('text/csv')) {
        return response.blob() as unknown as T;
      }

      return isJson ? response.json() : response.text() as unknown as T;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw {
          message: `Cannot connect to backend server at ${url}. Please ensure the server is running.`,
          status: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create singleton instance
const client = new ApiClient(API_URL);

// Export for use in other services
export const apiClient = {
  get: <T>(endpoint: string) => client.get<T>(endpoint),
  post: <T>(endpoint: string, data?: any) => client.post<T>(endpoint, data),
  put: <T>(endpoint: string, data?: any) => client.put<T>(endpoint, data),
  patch: <T>(endpoint: string, data?: any) => client.patch<T>(endpoint, data),
  delete: <T>(endpoint: string) => client.delete<T>(endpoint),
};

// Backward compatibility
async function authFetch(url: string, options: RequestInit = {}) {
  const token = TokenManager.get();
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  } as Record<string,string>;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res;
}

// ============================================================================
// Authentication API
// ============================================================================

export const AuthAPI = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/login', data);
    TokenManager.set(response.token, data.rememberMe, response.expiresIn);
    return response;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/register', data);
    TokenManager.set(response.token, true, response.expiresIn);
    return response;
  },

  async logout(): Promise<void> {
    await client.post('/logout');
    TokenManager.clear();
    // Clear all caches on logout
    apiCache.clear();
  },

  async getCurrentUser(): Promise<CurrentUser> {
    if (!TokenManager.isValid()) {
      throw new Error('Session expired');
    }
    // Cache user data for 5 minutes with stale-while-revalidate
    return staleWhileRevalidate(
      'user:current',
      () => client.get<CurrentUser>('/user'),
      300000 // 5 minutes
    );
  },

  async forgotPassword(email: string): Promise<void> {
    await client.post('/forgot-password', { email });
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await client.post('/reset-password', { token, password });
  },
};

// Backward compatibility exports
export const login = (data: LoginData) => AuthAPI.login(data);
export const register = (data: RegisterData) => AuthAPI.register(data);
export const logout = () => AuthAPI.logout();
export const getCurrentUser = () => AuthAPI.getCurrentUser();
export const requestPasswordReset = (email: string) => AuthAPI.forgotPassword(email);
export const resetPassword = (token: string, password: string) => AuthAPI.resetPassword(token, password);

// ============================================================================
// Asset & Fleet Management API
// ============================================================================

import type { Pagination, OperationSchedule, Rider, Asset } from '../types';

// Map backend asset representation to frontend Asset type
function mapBackendAsset(raw: any): Asset {
  const statusMap: Record<string, Asset['status']> = {
    active: 'Available',
    maintenance: 'Maintenance',
    retired: 'Maintenance'
  };
  const typeMap: Record<string, Asset['type']> = {
    vehicle: 'EV',
    battery: 'Battery',
    charging_cabinet: 'Cabinet'
  };
  return {
    id: raw.asset_id || String(raw.id),
    type: typeMap[raw.type] || 'EV',
    model: raw.model || 'N/A',
    status: statusMap[raw.status] || 'Available',
    soh: raw.soh ?? 100,
    swaps: raw.swaps ?? 0,
    location: raw.location || 'Unknown',
    originalValue: raw.original_value ?? 0,
    dailySwaps: raw.daily_swaps ?? 0,
    // Extended ownership fields passed through, optional on Asset type extension
    // @ts-ignore - frontend can conditionally read these
    ownershipAllocated: raw.ownership_allocated ?? 0,
    // @ts-ignore
    ownershipRemaining: raw.ownership_remaining ?? 100,
  };
}

export const AssetAPI = {
  async list(page = 1, perPage = 10): Promise<Pagination<Asset>> {
    // Cache assets list for 1 minute, invalidate on page/perPage change
    const cacheKey = `assets:list:${page}:${perPage}`;
    return staleWhileRevalidate(
      cacheKey,
      async () => {
        const response = await client.get<any>(`/assets?page=${page}&perPage=${perPage}`);
        return {
          data: (response.data || []).map(mapBackendAsset),
          page: response.page,
          perPage: response.perPage,
          total: response.total,
          totalPages: response.totalPages,
        };
      },
      60000 // 1 minute
    );
  },

  async get(id: string): Promise<Asset> {
    // Cache individual asset for 2 minutes
    return staleWhileRevalidate(
      `asset:${id}`,
      async () => {
        const response = await client.get<any>(`/assets/${id}`);
        return mapBackendAsset(response);
      },
      120000 // 2 minutes
    );
  },

  async create(data: Partial<Asset>): Promise<Asset> {
    const response = await client.post<any>('/assets', data);
    // Invalidate asset list cache when creating new asset
    apiCache.invalidatePattern(/^assets:list:/);
    return mapBackendAsset(response);
  },

  async update(id: string, data: Partial<Asset>): Promise<Asset> {
    const response = await client.put<any>(`/assets/${id}`, data);
    // Invalidate specific asset and list caches
    apiCache.invalidate(`asset:${id}`);
    apiCache.invalidatePattern(/^assets:list:/);
    return mapBackendAsset(response);
  },

  async delete(id: string): Promise<void> {
    await client.delete(`/assets/${id}`);
    // Invalidate specific asset and list caches
    apiCache.invalidate(`asset:${id}`);
    apiCache.invalidatePattern(/^assets:list:/);
  },

  async exportCsv(): Promise<Blob> {
    return client.get<Blob>('/assets/export.csv');
  },
};

export const RiderAPI = {
  async list(): Promise<Rider[]> {
    // Cache riders list for 2 minutes
    return staleWhileRevalidate(
      'riders:list',
      () => client.get<Rider[]>('/riders'),
      120000 // 2 minutes
    );
  },

  async assign(riderId: number, assetId: string): Promise<any> {
    return client.post('/riders/assign', { rider_id: riderId, asset_id: assetId });
  },

  async unassign(riderId: number): Promise<any> {
    return client.post('/riders/unassign', { rider_id: riderId });
  },
};

export const ScheduleAPI = {
  async list(assetId?: string): Promise<OperationSchedule[]> {
    const endpoint = assetId 
      ? `/operations/schedules?asset_id=${assetId}` 
      : '/operations/schedules';
    return client.get<OperationSchedule[]>(endpoint);
  },

  async scheduleSwap(
    assetId: string, 
    scheduledAt: string, 
    riderId?: number, 
    note?: string
  ): Promise<OperationSchedule> {
    const response = await client.post<{ schedule: OperationSchedule }>(
      '/operations/schedule/swap',
      { asset_id: assetId, scheduled_at: scheduledAt, rider_id: riderId, note }
    );
    return response.schedule;
  },

  async scheduleCharge(
    assetId: string, 
    scheduledAt: string, 
    riderId?: number, 
    note?: string
  ): Promise<OperationSchedule> {
    const response = await client.post<{ schedule: OperationSchedule }>(
      '/operations/schedule/charge',
      { asset_id: assetId, scheduled_at: scheduledAt, rider_id: riderId, note }
    );
    return response.schedule;
  },

  async updateStatus(
    id: number, 
    status: 'pending' | 'completed' | 'cancelled'
  ): Promise<OperationSchedule> {
    const response = await client.patch<{ schedule: OperationSchedule }>(
      `/operations/schedules/${id}/status`,
      { status }
    );
    return response.schedule;
  },
};

// Backward compatibility exports
export const fetchAssets = (page?: number, perPage?: number) => AssetAPI.list(page, perPage);
export const fetchRiders = () => RiderAPI.list();
export const assignRider = (riderId: number, assetId: string) => RiderAPI.assign(riderId, assetId);
export const unassignRider = (riderId: number) => RiderAPI.unassign(riderId);
export const fetchSchedules = (assetId?: string) => ScheduleAPI.list(assetId);
export const scheduleSwap = (assetId: string, scheduledAt: string, riderId?: number, note?: string) => 
  ScheduleAPI.scheduleSwap(assetId, scheduledAt, riderId, note);
export const scheduleCharge = (assetId: string, scheduledAt: string, riderId?: number, note?: string) => 
  ScheduleAPI.scheduleCharge(assetId, scheduledAt, riderId, note);
export const updateScheduleStatus = (id: number, status: 'pending'|'completed'|'cancelled') => 
  ScheduleAPI.updateStatus(id, status);
export const exportAssetsCsv = () => AssetAPI.exportCsv();

// ============================================================================
// Revenue & Operations API
// ============================================================================

export interface RevenueBreakdown {
  gross_total: number;
  breakdown: {
    investor_roi: { amount: number; pct: number };
    rider_wages: { amount: number; pct: number };
    management_reserve: { amount: number; pct: number };
    maintenance_reserve: { amount: number; pct: number };
  };
}

export interface Ride {
  id: number;
  vehicle_id: number;
  distance_km: number;
  battery_start: number;
  battery_end: number;
  swaps_before: number;
  swaps_after: number;
  revenue: {
    gross: number;
    investor_roi: number;
    rider_wages: number;
    management_reserve: number;
    maintenance_reserve: number;
  } | null;
  started_at: string;
  ended_at: string;
}

export const RevenueAPI = {
  async getSummary(): Promise<RevenueBreakdown> {
    // Cache revenue summary for 1 minute
    return staleWhileRevalidate(
      'revenue:summary',
      () => client.get<RevenueBreakdown>('/revenue/summary'),
      60000 // 1 minute
    );
  },

  async getRides(limit = 25): Promise<{ rides: Ride[] }> {
    // Cache rides for 30 seconds
    return staleWhileRevalidate(
      `rides:list:${limit}`,
      () => client.get<{ rides: Ride[] }>(`/rides?limit=${limit}`),
      30000 // 30 seconds
    );
  },
};

// Backward compatibility
export const fetchRevenueSummary = () => RevenueAPI.getSummary();
export const fetchRides = (limit?: number) => RevenueAPI.getRides(limit);

// ============================================================================
// Capabilities & Permissions API
// ============================================================================

export interface CapabilitiesPayload {
  role: UserRole;
  capabilities: Record<string, boolean>;
  routes: Record<string, any>;
  user: CurrentUser;
}

export const CapabilitiesAPI = {
  async get(): Promise<CapabilitiesPayload> {
    // Cache capabilities for 5 minutes
    return staleWhileRevalidate(
      'capabilities',
      () => client.get<CapabilitiesPayload>('/capabilities'),
      300000 // 5 minutes
    );
  },

  async getMy(): Promise<any> {
    return client.get('/my-capabilities');
  },

  async check(capability: string): Promise<boolean> {
    const response = await client.get<{ has_capability: boolean }>(
      `/check-capability/${capability}`
    );
    return response.has_capability;
  },
};

// Backward compatibility
export const fetchCapabilities = () => CapabilitiesAPI.get();

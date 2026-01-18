// ============================================================================
// API Configuration & Constants
// ============================================================================

import { apiCache, staleWhileRevalidate } from '../utils/apiCache';

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

// Backward compatibility - exported for legacy code
export async function authFetch(url: string, options: RequestInit = {}) {
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

// ============================================================================
// Wallet API
// ============================================================================

export interface WalletData {
  id: number;
  user_id: number;
  wallet_address: string;
  trovotech_wallet_id: string;
  balance: number;
  currency: string;
  status: string;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  user_id: number;
  type: 'deposit' | 'withdrawal' | 'transfer_in' | 'transfer_out' | 'token_purchase' | 'payout_received';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  tx_hash: string | null;
  from_address: string;
  to_address: string;
  description: string;
  metadata: Record<string, any>;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletStats {
  balance: number;
  currency: string;
  total_deposits: number;
  total_withdrawals: number;
  pending_transactions: number;
  monthly_income: number;
  monthly_expense: number;
  net_monthly: number;
  transactions_by_type: Record<string, { count: number; total: number }>;
}

export interface TransactionsResponse {
  transactions: WalletTransaction[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export const WalletAPI = {
  async getMyWallet(): Promise<{ wallet: WalletData; has_wallet: boolean; recent_transactions: WalletTransaction[] }> {
    return staleWhileRevalidate(
      'wallet:me',
      () => client.get('/wallet/me'),
      30000 // 30 seconds - wallet data should be relatively fresh
    );
  },

  async getWallet(userId: number): Promise<{ wallet: WalletData; user_id: number }> {
    return staleWhileRevalidate(
      `wallet:${userId}`,
      () => client.get(`/wallet/${userId}`),
      30000
    );
  },

  async getBalance(userId?: number): Promise<{ balance: number; currency: string; has_wallet: boolean; wallet_address?: string; status?: string }> {
    const endpoint = userId ? `/wallet/${userId}/balance` : '/wallet/me';
    return staleWhileRevalidate(
      `wallet:balance:${userId || 'me'}`,
      () => client.get(endpoint),
      15000 // 15 seconds for balance
    );
  },

  async getTransactions(userId?: number, params: { type?: string; status?: string; per_page?: number; page?: number } = {}): Promise<TransactionsResponse> {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.per_page) queryParams.append('per_page', String(params.per_page));
    if (params.page) queryParams.append('page', String(params.page));

    const query = queryParams.toString();
    const endpoint = userId
      ? `/wallet/${userId}/transactions${query ? '?' + query : ''}`
      : `/wallet/me/transactions${query ? '?' + query : ''}`;

    return client.get(endpoint);
  },

  async getStats(userId?: number): Promise<{ stats: WalletStats; wallet_address: string; wallet_status: string }> {
    const endpoint = userId ? `/wallet/${userId}/stats` : '/wallet/me/stats';
    return staleWhileRevalidate(
      `wallet:stats:${userId || 'me'}`,
      () => client.get(endpoint),
      60000 // 1 minute
    );
  },

  async createWallet(): Promise<{ message: string; wallet: WalletData }> {
    const response = await client.post<{ message: string; wallet: WalletData }>('/wallet/create');
    // Invalidate wallet caches
    apiCache.invalidatePattern(/^wallet:/);
    return response;
  },

  async transfer(toAddress: string, amount: number, description?: string): Promise<{ message: string; transaction: WalletTransaction; new_balance: number }> {
    const response = await client.post<{ message: string; transaction: WalletTransaction; new_balance: number }>(
      '/wallet/transfer',
      { to_address: toAddress, amount, description }
    );
    // Invalidate wallet caches after transfer
    apiCache.invalidatePattern(/^wallet:/);
    return response;
  },

  async deposit(amount: number, paymentMethod?: string): Promise<{ message: string; transaction: WalletTransaction; new_balance: number }> {
    const response = await client.post<{ message: string; transaction: WalletTransaction; new_balance: number }>(
      '/wallet/deposit',
      { amount, payment_method: paymentMethod }
    );
    // Invalidate wallet caches after deposit
    apiCache.invalidatePattern(/^wallet:/);
    return response;
  },

  async withdraw(amount: number, bankAccount?: string, bankName?: string): Promise<{ message: string; transaction: WalletTransaction; new_balance: number }> {
    const response = await client.post<{ message: string; transaction: WalletTransaction; new_balance: number }>(
      '/wallet/withdraw',
      { amount, bank_account: bankAccount, bank_name: bankName }
    );
    // Invalidate wallet caches after withdrawal
    apiCache.invalidatePattern(/^wallet:/);
    return response;
  },
};

// Backward compatibility exports for wallet
export const getMyWallet = () => WalletAPI.getMyWallet();
export const getWalletBalance = (userId?: number) => WalletAPI.getBalance(userId);
export const getWalletTransactions = (userId?: number, params?: { type?: string; status?: string; per_page?: number; page?: number }) =>
  WalletAPI.getTransactions(userId, params);
export const getWalletStats = (userId?: number) => WalletAPI.getStats(userId);
export const createWallet = () => WalletAPI.createWallet();
export const transferFunds = (toAddress: string, amount: number, description?: string) =>
  WalletAPI.transfer(toAddress, amount, description);
export const depositFunds = (amount: number, paymentMethod?: string) =>
  WalletAPI.deposit(amount, paymentMethod);
export const withdrawFunds = (amount: number, bankAccount?: string, bankName?: string) =>
  WalletAPI.withdraw(amount, bankAccount, bankName);

// ============================================================================
// Payment API - Payment Processing & Bank Accounts
// ============================================================================

export interface Bank {
  code: string;
  name: string;
}

export interface PaymentMethod {
  id: number;
  type: 'bank_account' | 'card' | 'mobile_money';
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  display_name: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface PaymentRecord {
  id: number;
  reference: string;
  gateway: 'paystack' | 'flutterwave' | 'bank_transfer' | 'manual';
  type: 'funding' | 'withdrawal' | 'investment' | 'refund' | 'payout';
  amount: number;
  fee: number;
  net_amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  failure_reason: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface FundingResponse {
  success: boolean;
  reference: string;
  authorization_url: string;
  access_code?: string;
  amount: number;
  fee: number;
}

export interface WithdrawalResponse {
  success: boolean;
  reference: string;
  amount: number;
  fee: number;
  net_amount: number;
  transfer_code: string;
  message: string;
}

export const PaymentAPI = {
  // Get list of banks
  async getBanks(): Promise<Bank[]> {
    const response = await apiFetch('/payment-methods/banks');
    if (!response.ok) throw await createApiError(response);
    const data = await response.json();
    return data.banks;
  },

  // Verify a bank account
  async verifyBankAccount(accountNumber: string, bankCode: string): Promise<{ account_name: string; account_number: string }> {
    const response = await apiFetch('/payment-methods/verify-account', {
      method: 'POST',
      body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
    });
    if (!response.ok) throw await createApiError(response);
    return response.json();
  },

  // Get user's payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiFetch('/payment-methods');
    if (!response.ok) throw await createApiError(response);
    const data = await response.json();
    return data.payment_methods;
  },

  // Add a bank account
  async addBankAccount(accountNumber: string, bankCode: string): Promise<PaymentMethod> {
    const response = await apiFetch('/payment-methods', {
      method: 'POST',
      body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
    });
    if (!response.ok) throw await createApiError(response);
    const data = await response.json();
    return data.payment_method;
  },

  // Set payment method as default
  async setDefaultPaymentMethod(id: number): Promise<void> {
    const response = await apiFetch(`/payment-methods/${id}/default`, {
      method: 'PATCH',
    });
    if (!response.ok) throw await createApiError(response);
  },

  // Delete payment method
  async deletePaymentMethod(id: number): Promise<void> {
    const response = await apiFetch(`/payment-methods/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw await createApiError(response);
  },

  // Initialize wallet funding
  async fundWallet(amount: number, gateway: 'paystack' | 'flutterwave' = 'paystack'): Promise<FundingResponse> {
    const response = await apiFetch('/payments/fund-wallet', {
      method: 'POST',
      body: JSON.stringify({ amount, gateway }),
    });
    if (!response.ok) throw await createApiError(response);
    return response.json();
  },

  // Process withdrawal
  async withdraw(amount: number, paymentMethodId: number): Promise<WithdrawalResponse> {
    const response = await apiFetch('/payments/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, payment_method_id: paymentMethodId }),
    });
    if (!response.ok) throw await createApiError(response);
    return response.json();
  },

  // Get payment history
  async getPaymentHistory(limit: number = 20): Promise<PaymentRecord[]> {
    const response = await apiFetch(`/payments/history?limit=${limit}`);
    if (!response.ok) throw await createApiError(response);
    const data = await response.json();
    return data.payments;
  },

  // Calculate fee
  async calculateFee(amount: number, gateway: string, type: 'funding' | 'withdrawal'): Promise<{ amount: number; fee: number; net_amount: number }> {
    const response = await apiFetch(`/payments/calculate-fee?amount=${amount}&gateway=${gateway}&type=${type}`);
    if (!response.ok) throw await createApiError(response);
    return response.json();
  },

  // Verify payment (after callback)
  async verifyPayment(reference: string, gateway: 'paystack' | 'flutterwave'): Promise<{ success: boolean; amount: number; new_balance: number }> {
    const response = await apiFetch('/payments/verify', {
      method: 'POST',
      body: JSON.stringify({ reference, gateway }),
    });
    if (!response.ok) throw await createApiError(response);
    return response.json();
  },
};

// ============================================================================
// Investment API - Portfolio Management
// ============================================================================

export interface InvestableAsset {
  id: number;
  asset_id: string;
  type: 'vehicle' | 'battery' | 'charging_cabinet';
  model: string;
  status: string;
  soh: number;
  swaps: number;
  location: string;
  original_value: number;
  current_value: number;
  daily_swaps: number;
  is_tokenized: boolean;
  token_id: string | null;
  total_ownership_sold: number;
  ownership_remaining: number;
  min_investment: number;
  expected_roi: number;
  risk_level: 'low' | 'medium' | 'high';
  is_available_for_investment: boolean;
  estimated_monthly_revenue: number;
}

export interface InvestmentRecord {
  id: number;
  user_id: number;
  asset_id: number;
  amount: number;
  ownership_percentage: number;
  token_id: string | null;
  tx_hash: string | null;
  purchase_price: number;
  current_value: number;
  total_earnings: number;
  last_payout_at: string | null;
  status: 'pending' | 'active' | 'sold' | 'cancelled';
  created_at: string;
  updated_at: string;
  asset?: InvestableAsset;
}

export interface PortfolioSummary {
  total_invested: number;
  current_value: number;
  total_earnings: number;
  total_roi_percent: number;
  active_investments: number;
  investments: InvestmentRecord[];
}

export interface PortfolioPerformance {
  total_invested: number;
  current_value: number;
  total_earnings: number;
  unrealized_gains: number;
  realized_gains: number;
  overall_roi: number;
  best_performer: {
    asset_id: string;
    roi: number;
  } | null;
  worst_performer: {
    asset_id: string;
    roi: number;
  } | null;
  monthly_earnings: Array<{
    month: string;
    earnings: number;
  }>;
  investment_breakdown: {
    vehicles: number;
    batteries: number;
    cabinets: number;
  };
}

export interface InvestmentPurchaseData {
  asset_id: number;
  amount: number;
  ownership_percentage: number;
}

export interface InvestmentPurchaseResponse {
  message: string;
  investment: InvestmentRecord;
  transaction: WalletTransaction;
  new_balance: number;
}

export const InvestmentAPI = {
  // Get portfolio summary with all investments
  async getPortfolio(): Promise<PortfolioSummary> {
    return staleWhileRevalidate(
      'investment:portfolio',
      () => client.get<PortfolioSummary>('/invest/portfolio'),
      30000 // 30 seconds
    );
  },

  // Get portfolio performance metrics
  async getPerformance(): Promise<PortfolioPerformance> {
    return staleWhileRevalidate(
      'investment:performance',
      () => client.get<PortfolioPerformance>('/invest/portfolio/performance'),
      60000 // 1 minute
    );
  },

  // Get investment history
  async getHistory(params: { status?: string; page?: number; per_page?: number } = {}): Promise<{
    investments: InvestmentRecord[];
    total: number;
    current_page: number;
    last_page: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.per_page) queryParams.append('per_page', String(params.per_page));

    const query = queryParams.toString();
    return client.get(`/invest/history${query ? '?' + query : ''}`);
  },

  // Get available assets for investment
  async getAvailableAssets(params: { type?: string; risk_level?: string; page?: number } = {}): Promise<{
    assets: InvestableAsset[];
    total: number;
    current_page: number;
    last_page: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.risk_level) queryParams.append('risk_level', params.risk_level);
    if (params.page) queryParams.append('page', String(params.page));

    const query = queryParams.toString();
    return staleWhileRevalidate(
      `investment:assets:${query}`,
      () => client.get(`/invest/assets${query ? '?' + query : ''}`),
      60000 // 1 minute
    );
  },

  // Get single asset details
  async getAssetDetails(assetId: number): Promise<{ asset: InvestableAsset; user_investment: InvestmentRecord | null }> {
    return staleWhileRevalidate(
      `investment:asset:${assetId}`,
      () => client.get(`/invest/assets/${assetId}`),
      30000
    );
  },

  // Purchase investment in an asset
  async purchase(data: InvestmentPurchaseData): Promise<InvestmentPurchaseResponse> {
    const response = await client.post<InvestmentPurchaseResponse>('/invest/purchase', data);
    // Invalidate all investment and wallet caches after purchase
    apiCache.invalidatePattern(/^investment:/);
    apiCache.invalidatePattern(/^wallet:/);
    return response;
  },

  // Simulate payout (for demo purposes)
  async simulatePayout(): Promise<{
    message: string;
    payouts: Array<{
      investment_id: number;
      asset_id: string;
      earnings: number;
    }>;
    total_distributed: number;
  }> {
    const response = await client.post<{
      message: string;
      payouts: Array<{
        investment_id: number;
        asset_id: string;
        earnings: number;
      }>;
      total_distributed: number;
    }>('/invest/simulate-payout');
    // Invalidate caches after payout
    apiCache.invalidatePattern(/^investment:/);
    apiCache.invalidatePattern(/^wallet:/);
    return response;
  },
};

// Backward compatibility exports for investment
export const getPortfolio = () => InvestmentAPI.getPortfolio();
export const getPortfolioPerformance = () => InvestmentAPI.getPerformance();
export const getInvestmentHistory = (params?: { status?: string; page?: number; per_page?: number }) =>
  InvestmentAPI.getHistory(params);
export const getAvailableAssets = (params?: { type?: string; risk_level?: string; page?: number }) =>
  InvestmentAPI.getAvailableAssets(params);
export const getAssetDetails = (assetId: number) => InvestmentAPI.getAssetDetails(assetId);
export const purchaseInvestment = (data: InvestmentPurchaseData) => InvestmentAPI.purchase(data);
export const simulatePayout = () => InvestmentAPI.simulatePayout();

// ============================================================================
// Driver API - Trip & Earnings Tracking
// ============================================================================

export interface DriverTrip {
  id: number;
  trip_id: string;
  driver_id: number;
  vehicle_id: number | null;
  start_latitude: number | null;
  start_longitude: number | null;
  start_address: string | null;
  end_latitude: number | null;
  end_longitude: number | null;
  end_address: string | null;
  distance_km: number;
  duration_minutes: number;
  battery_start: number | null;
  battery_end: number | null;
  started_at: string | null;
  ended_at: string | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  base_fare: number;
  distance_fare: number;
  bonus: number;
  deductions: number;
  total_earnings: number;
  vehicle?: {
    id: number;
    asset_id: string;
    model: string;
    soh: number;
    location: string;
  } | null;
}

export interface DriverEarning {
  id: number;
  earning_id: string;
  driver_id: number;
  trip_id: number | null;
  swap_task_id: number | null;
  source_type: 'trip' | 'swap' | 'bonus' | 'penalty' | 'adjustment';
  description: string | null;
  gross_amount: number;
  commission: number;
  deductions: number;
  net_amount: number;
  currency: string;
  earned_at: string;
  paid_at: string | null;
  payment_status: 'pending' | 'processed' | 'paid' | 'failed';
  trip?: DriverTrip | null;
}

export interface DriverDashboardData {
  driver: {
    id: number;
    status: string;
    is_on_shift: boolean;
    shift_start: string | null;
  };
  vehicle: {
    id: number;
    asset_id: string;
    model: string;
    soh: number;
    location: string;
  } | null;
  active_trip: DriverTrip | null;
  today: {
    trips: number;
    earnings: number;
    distance: number;
  };
  this_week: {
    trips: number;
    earnings: number;
  };
  this_month: {
    trips: number;
    earnings: number;
  };
  lifetime: {
    total_trips: number;
    total_distance: number;
    total_earnings: number;
    pending_earnings: number;
  };
  recent_trips: Array<{
    id: number;
    trip_id: string;
    distance_km: number;
    duration_minutes: number;
    total_earnings: number;
    status: string;
    started_at: string | null;
    ended_at: string | null;
    vehicle: string | null;
  }>;
}

export interface EarningsSummary {
  summary: {
    today: number;
    this_week: number;
    this_month: number;
    lifetime: number;
    pending: number;
    paid: number;
  };
  breakdown: {
    trips: { total: number; count: number };
    swaps: { total: number; count: number };
    bonuses: { total: number; count: number };
  };
}

export interface DailyEarning {
  date: string;
  day: string;
  earnings: number;
  trips: number;
}

export interface StartTripData {
  vehicle_id?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  battery_start?: number;
}

export interface EndTripData {
  latitude?: number;
  longitude?: number;
  address?: string;
  distance_km: number;
  battery_end?: number;
}

export const DriverAPI = {
  // Get dashboard summary
  async getDashboard(): Promise<DriverDashboardData> {
    return staleWhileRevalidate(
      'driver:dashboard',
      () => client.get<DriverDashboardData>('/driver/dashboard'),
      15000 // 15 seconds
    );
  },

  // Get all trips
  async getTrips(params: { status?: string; from_date?: string; to_date?: string; page?: number; per_page?: number } = {}): Promise<{
    trips: DriverTrip[];
    total: number;
    current_page: number;
    last_page: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.from_date) queryParams.append('from_date', params.from_date);
    if (params.to_date) queryParams.append('to_date', params.to_date);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.per_page) queryParams.append('per_page', String(params.per_page));

    const query = queryParams.toString();
    return client.get(`/driver/trips${query ? '?' + query : ''}`);
  },

  // Get active trip
  async getActiveTrip(): Promise<{ has_active_trip: boolean; trip: DriverTrip | null }> {
    return staleWhileRevalidate(
      'driver:active_trip',
      () => client.get('/driver/trips/active'),
      5000 // 5 seconds
    );
  },

  // Start a new trip
  async startTrip(data: StartTripData): Promise<{ message: string; trip: DriverTrip }> {
    const response = await client.post<{ message: string; trip: DriverTrip }>('/driver/trips/start', data);
    apiCache.invalidatePattern(/^driver:/);
    return response;
  },

  // End active trip
  async endTrip(tripId: string | number, data: EndTripData): Promise<{ message: string; trip: DriverTrip; earning: DriverEarning }> {
    const response = await client.patch<{ message: string; trip: DriverTrip; earning: DriverEarning }>(
      `/driver/trips/${tripId}/end`,
      data
    );
    apiCache.invalidatePattern(/^driver:/);
    return response;
  },

  // Cancel active trip
  async cancelTrip(tripId: string | number, reason?: string): Promise<{ message: string; trip: DriverTrip }> {
    const response = await client.patch<{ message: string; trip: DriverTrip }>(
      `/driver/trips/${tripId}/cancel`,
      { reason }
    );
    apiCache.invalidatePattern(/^driver:/);
    return response;
  },

  // Get trip details
  async getTripDetails(tripId: string | number): Promise<{ trip: DriverTrip }> {
    return staleWhileRevalidate(
      `driver:trip:${tripId}`,
      () => client.get(`/driver/trips/${tripId}`),
      30000
    );
  },

  // Get earnings summary
  async getEarningsSummary(): Promise<EarningsSummary> {
    return staleWhileRevalidate(
      'driver:earnings:summary',
      () => client.get<EarningsSummary>('/driver/earnings'),
      30000
    );
  },

  // Get earnings history
  async getEarningsHistory(params: { source_type?: string; status?: string; from_date?: string; to_date?: string; page?: number; per_page?: number } = {}): Promise<{
    earnings: DriverEarning[];
    total: number;
    current_page: number;
    last_page: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.source_type) queryParams.append('source_type', params.source_type);
    if (params.status) queryParams.append('status', params.status);
    if (params.from_date) queryParams.append('from_date', params.from_date);
    if (params.to_date) queryParams.append('to_date', params.to_date);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.per_page) queryParams.append('per_page', String(params.per_page));

    const query = queryParams.toString();
    return client.get(`/driver/earnings/history${query ? '?' + query : ''}`);
  },

  // Get daily earnings for chart
  async getDailyEarnings(days: number = 7): Promise<{ daily_earnings: DailyEarning[]; total: number }> {
    return staleWhileRevalidate(
      `driver:earnings:daily:${days}`,
      () => client.get(`/driver/earnings/daily?days=${days}`),
      60000 // 1 minute
    );
  },

  // Get monthly report
  async getMonthlyReport(year: number, month: number): Promise<{
    period: { year: number; month: number; month_name: string };
    summary: {
      total_earnings: number;
      gross_earnings: number;
      commission: number;
      total_trips: number;
      total_distance: number;
      avg_trip_earnings: number;
    };
    breakdown: Array<{ type: string; count: number; total: number }>;
  }> {
    return staleWhileRevalidate(
      `driver:earnings:monthly:${year}:${month}`,
      () => client.get(`/driver/earnings/monthly/${year}/${month}`),
      300000 // 5 minutes
    );
  },

  // Request payout
  async requestPayout(): Promise<{
    message: string;
    amount: number;
    new_balance: number;
    transaction: WalletTransaction;
  }> {
    const response = await client.post<{
      message: string;
      amount: number;
      new_balance: number;
      transaction: WalletTransaction;
    }>('/driver/payouts/request');
    apiCache.invalidatePattern(/^driver:/);
    apiCache.invalidatePattern(/^wallet:/);
    return response;
  },

  // Clock in (start shift)
  async clockIn(): Promise<{ message: string; shift_start: string; status: string }> {
    const response = await client.post<{ message: string; shift_start: string; status: string }>('/driver/shift/start');
    apiCache.invalidatePattern(/^driver:/);
    return response;
  },

  // Clock out (end shift)
  async clockOut(): Promise<{
    message: string;
    shift_summary: {
      started_at: string;
      ended_at: string;
      duration_hours: number;
      trips_completed: number;
      earnings: number;
    };
  }> {
    const response = await client.post<{
      message: string;
      shift_summary: {
        started_at: string;
        ended_at: string;
        duration_hours: number;
        trips_completed: number;
        earnings: number;
      };
    }>('/driver/shift/end');
    apiCache.invalidatePattern(/^driver:/);
    return response;
  },

  // Get assigned vehicles
  async getAssignments(): Promise<{
    driver: any;
    rider: any;
    assigned_assets: Array<{
      asset: any;
      assignment_date: string;
      driver_status: string;
    }>;
  }> {
    return staleWhileRevalidate(
      'driver:assignments',
      () => client.get('/driver/assignments'),
      60000
    );
  },

  // Log a battery swap
  async logSwap(data: {
    asset_id: string;
    station_location: string;
    battery_before: number;
    battery_after: number;
    notes?: string;
  }): Promise<{ message: string; swap_event: any; bonus_earned: number }> {
    const response = await client.post<{ message: string; swap_event: any; bonus_earned: number }>('/driver/log-swap', data);
    apiCache.invalidatePattern(/^driver:/);
    return response;
  },

  // Get swap history
  async getSwaps(): Promise<{ swaps: Array<{
    id: string | number;
    task_number?: string;
    status: string;
    battery_before: number;
    battery_after: number;
    completed_at: string | null;
    created_at: string;
  }> }> {
    return staleWhileRevalidate(
      'driver:swaps',
      () => client.get('/driver/swaps'),
      30000
    );
  },

  // Report maintenance issue
  async reportMaintenance(data: {
    asset_id: string;
    issue_type: 'mechanical' | 'electrical' | 'battery' | 'body' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    photo_url?: string;
  }): Promise<{ message: string; request: any }> {
    return client.post('/driver/report-maintenance', data);
  },

  // Get maintenance reports
  async getMaintenanceReports(): Promise<{ reports: any[] }> {
    return staleWhileRevalidate(
      'driver:maintenance',
      () => client.get('/driver/maintenance-reports'),
      60000
    );
  },
};

// Backward compatibility exports for driver
export const getDriverDashboard = () => DriverAPI.getDashboard();
export const getDriverTrips = (params?: { status?: string; page?: number; per_page?: number }) => DriverAPI.getTrips(params);
export const getActiveTrip = () => DriverAPI.getActiveTrip();
export const startTrip = (data: StartTripData) => DriverAPI.startTrip(data);
export const endTrip = (tripId: string | number, data: EndTripData) => DriverAPI.endTrip(tripId, data);
export const getDriverEarnings = () => DriverAPI.getEarningsSummary();
export const getDriverEarningsHistory = (params?: { source_type?: string; status?: string; page?: number }) => DriverAPI.getEarningsHistory(params);
export const getDailyEarnings = (days?: number) => DriverAPI.getDailyEarnings(days);
export const requestDriverPayout = () => DriverAPI.requestPayout();
export const driverClockIn = () => DriverAPI.clockIn();
export const driverClockOut = () => DriverAPI.clockOut();

// ============================================================================
// Battery Swap API - Swap Station & Task Management
// ============================================================================

export interface SwapStation {
  id: number;
  station_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'maintenance' | 'offline';
  available_batteries: number;
  total_capacity: number;
  distance_km?: number;
  estimated_wait_minutes?: number;
  operating_hours: string;
  phone?: string;
}

export interface SwapTask {
  id: number;
  task_number: string;
  driver_id: number;
  vehicle_id: number;
  asset_id: number;
  swap_station_id: number;
  status: 'pending' | 'enroute_to_station' | 'arrived_at_station' | 'swapping' | 'swap_complete' | 'completed' | 'cancelled';
  battery_level_before: number | null;
  battery_level_after: number | null;
  soh_before: number | null;
  soh_after: number | null;
  distance_km: number | null;
  duration_minutes: number | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  station?: SwapStation;
  vehicle?: {
    id: number;
    asset_id: string;
    model: string;
    soh: number;
  };
}

export interface SwapRequest {
  station_id: number;
  vehicle_id?: number;
  battery_level_before?: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

export const SwapAPI = {
  // Get nearby swap stations
  async getNearbyStations(params: {
    latitude?: number;
    longitude?: number;
    radius_km?: number;
    limit?: number;
  } = {}): Promise<{ stations: SwapStation[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params.latitude) queryParams.append('latitude', String(params.latitude));
    if (params.longitude) queryParams.append('longitude', String(params.longitude));
    if (params.radius_km) queryParams.append('radius_km', String(params.radius_km));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const query = queryParams.toString();
    return staleWhileRevalidate(
      `swap:stations:nearby:${query}`,
      () => client.get(`/fleet/swap-stations/nearby${query ? '?' + query : ''}`),
      30000 // 30 seconds
    );
  },

  // Get all swap stations
  async getStations(): Promise<{ stations: SwapStation[] }> {
    return staleWhileRevalidate(
      'swap:stations:all',
      () => client.get('/swap-stations'),
      60000 // 1 minute
    );
  },

  // Get station details
  async getStationDetails(stationId: number): Promise<{ station: SwapStation }> {
    return staleWhileRevalidate(
      `swap:station:${stationId}`,
      () => client.get(`/swap-stations/${stationId}`),
      30000
    );
  },

  // Get driver's active swap task
  async getActiveSwapTask(): Promise<{ has_active_task: boolean; task: SwapTask | null }> {
    return staleWhileRevalidate(
      'swap:active_task',
      () => client.get('/fleet/drivers/me/active-task'),
      5000 // 5 seconds - frequently updated
    );
  },

  // Get driver's swap task history
  async getSwapHistory(params: {
    status?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<{
    tasks: SwapTask[];
    total: number;
    current_page: number;
    last_page: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.from_date) queryParams.append('from_date', params.from_date);
    if (params.to_date) queryParams.append('to_date', params.to_date);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.per_page) queryParams.append('per_page', String(params.per_page));

    const query = queryParams.toString();
    return client.get(`/fleet/drivers/me/swap-tasks${query ? '?' + query : ''}`);
  },

  // Request a new swap (create swap task)
  async requestSwap(data: SwapRequest): Promise<{
    message: string;
    task: SwapTask;
    estimated_wait: number;
  }> {
    const response = await client.post<{
      message: string;
      task: SwapTask;
      estimated_wait: number;
    }>('/fleet/swap-tasks', data);
    apiCache.invalidatePattern(/^swap:/);
    apiCache.invalidatePattern(/^driver:/);
    return response;
  },

  // Start swap task (driver arrived at station)
  async startSwapTask(taskId: number): Promise<{
    message: string;
    task: SwapTask;
  }> {
    const response = await client.post<{
      message: string;
      task: SwapTask;
    }>(`/fleet/swap-tasks/${taskId}/start`);
    apiCache.invalidatePattern(/^swap:/);
    return response;
  },

  // Update swap task status
  async updateSwapTaskStatus(
    taskId: number,
    status: SwapTask['status'],
    data?: {
      battery_level_after?: number;
      soh_after?: number;
      notes?: string;
    }
  ): Promise<{ message: string; task: SwapTask }> {
    const response = await client.put<{ message: string; task: SwapTask }>(
      `/fleet/swap-tasks/${taskId}/status`,
      { status, ...data }
    );
    apiCache.invalidatePattern(/^swap:/);
    apiCache.invalidatePattern(/^driver:/);
    return response;
  },

  // Cancel swap task
  async cancelSwapTask(taskId: number, reason?: string): Promise<{
    message: string;
    task: SwapTask;
  }> {
    const response = await client.put<{
      message: string;
      task: SwapTask;
    }>(`/fleet/swap-tasks/${taskId}/status`, {
      status: 'cancelled',
      cancel_reason: reason
    });
    apiCache.invalidatePattern(/^swap:/);
    return response;
  },

  // Complete swap task
  async completeSwapTask(
    taskId: number,
    data: {
      battery_level_after: number;
      soh_after?: number;
      notes?: string;
    }
  ): Promise<{
    message: string;
    task: SwapTask;
    bonus_earned?: number;
  }> {
    const response = await client.put<{
      message: string;
      task: SwapTask;
      bonus_earned?: number;
    }>(`/fleet/swap-tasks/${taskId}/status`, {
      status: 'completed',
      ...data
    });
    apiCache.invalidatePattern(/^swap:/);
    apiCache.invalidatePattern(/^driver:/);
    return response;
  },

  // Get swap statistics
  async getSwapStats(): Promise<{
    today: { count: number; avg_duration: number };
    this_week: { count: number; avg_duration: number };
    this_month: { count: number; avg_duration: number };
    lifetime: { count: number; total_bonuses: number };
  }> {
    return staleWhileRevalidate(
      'swap:stats',
      () => client.get('/fleet/drivers/me/swap-stats'),
      60000
    );
  },
};

// Backward compatibility exports for swap
export const getNearbySwapStations = (params?: { latitude?: number; longitude?: number; radius_km?: number }) =>
  SwapAPI.getNearbyStations(params);
export const getSwapStations = () => SwapAPI.getStations();
export const getActiveSwapTask = () => SwapAPI.getActiveSwapTask();
export const getSwapTaskHistory = (params?: { status?: string; page?: number }) => SwapAPI.getSwapHistory(params);
export const requestSwap = (data: SwapRequest) => SwapAPI.requestSwap(data);
export const startSwapTask = (taskId: number) => SwapAPI.startSwapTask(taskId);
export const completeSwapTask = (taskId: number, data: { battery_level_after: number; soh_after?: number }) =>
  SwapAPI.completeSwapTask(taskId, data);
export const cancelSwapTask = (taskId: number, reason?: string) => SwapAPI.cancelSwapTask(taskId, reason);


// ============================================================================
// Contact API - Public contact form submission
// ============================================================================

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: 'investment' | 'operator' | 'driver' | 'support' | 'other';
  message: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'responded' | 'archived';
  responded_at?: string;
  responded_by?: number;
  response_notes?: string;
  responder?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export const ContactAPI = {
  // Submit contact form (public - no auth required)
  async submit(data: ContactFormData): Promise<{ success: boolean; message: string; data?: { id: number } }> {
    const response = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to submit contact form');
    }

    return result;
  },

  // Admin endpoints - require auth
  async list(params?: {
    status?: string;
    subject?: string;
    search?: string;
    from_date?: string;
    to_date?: string;
    per_page?: number;
    page?: number;
  }): Promise<{
    success: boolean;
    data: {
      data: ContactMessage[];
      current_page: number;
      last_page: number;
      total: number;
    };
    stats: {
      total: number;
      new: number;
      read: number;
      responded: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return apiClient.get(`/admin/contacts?${searchParams.toString()}`);
  },

  async get(id: number): Promise<{ success: boolean; data: ContactMessage }> {
    return apiClient.get(`/admin/contacts/${id}`);
  },

  async updateStatus(id: number, status: string, responseNotes?: string): Promise<{ success: boolean; data: ContactMessage }> {
    return apiClient.patch(`/admin/contacts/${id}/status`, { status, response_notes: responseNotes });
  },

  async delete(id: number): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/admin/contacts/${id}`);
  },

  async bulkUpdateStatus(ids: number[], status: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/admin/contacts/bulk-status', { ids, status });
  },
};

// Convenience exports
export const submitContactForm = (data: ContactFormData) => ContactAPI.submit(data);

// ============================================================================
// Telemetry API - Real-time Vehicle Telemetry
// ============================================================================

export interface TelemetryData {
  id: number;
  asset_id: string;
  battery_level: number;
  km: number;
  latitude: number | null;
  longitude: number | null;
  speed: number;
  status: 'idle' | 'in_transit' | 'charging' | 'swapping';
  temperature: number | null;
  voltage: number | null;
  current: number | null;
  oem_source: string;
  recorded_at: string;
  created_at: string;
}

export interface LiveVehicle {
  vehicle_id: number;
  vehicle_registration: string;
  latitude: number;
  longitude: number;
  speed: number;
  battery_level: number;
  battery_temperature: number;
  odometer: number;
  status: 'active' | 'idle' | 'charging' | 'offline';
  driver_id: number | null;
  driver_name: string | null;
  last_updated: string;
  route_history: Array<{ lat: number; lng: number }>;
}

export interface TelemetryAlert {
  type: 'low_battery' | 'high_temperature' | 'offline';
  severity: 'info' | 'warning' | 'critical';
  asset_id: string;
  vehicle: string;
  message: string;
  value: number;
  timestamp: string;
}

export interface TelemetryStatistics {
  total_distance: number;
  average_speed: number;
  max_speed: number;
  average_battery: number;
  min_battery: number;
  max_battery: number;
  average_temperature: number;
  max_temperature: number;
  data_points: number;
  period_days: number;
}

export const TelemetryAPI = {
  // Get live telemetry for all vehicles (for operator dashboard)
  async getLiveTelemetry(params?: {
    vehicle_id?: number;
    operator_id?: number;
  }): Promise<{
    success: boolean;
    vehicles: LiveVehicle[];
    count: number;
    timestamp: string;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.vehicle_id) queryParams.append('vehicle_id', String(params.vehicle_id));
    if (params?.operator_id) queryParams.append('operator_id', String(params.operator_id));

    const query = queryParams.toString();
    return staleWhileRevalidate(
      `telemetry:live:${query}`,
      () => client.get(`/telemetry/live${query ? '?' + query : ''}`),
      5000 // 5 seconds - real-time data
    );
  },

  // Get telemetry history for a specific asset
  async getAssetTelemetry(assetId: string): Promise<TelemetryData[]> {
    return staleWhileRevalidate(
      `telemetry:asset:${assetId}`,
      () => client.get(`/telemetry/${assetId}`),
      30000 // 30 seconds
    );
  },

  // Get latest telemetry for a specific asset
  async getLatest(assetId: string): Promise<TelemetryData> {
    return staleWhileRevalidate(
      `telemetry:latest:${assetId}`,
      () => client.get(`/telemetry/${assetId}/latest`),
      5000 // 5 seconds
    );
  },

  // Get telemetry statistics for an asset
  async getStatistics(assetId: string, days: number = 7): Promise<{
    success: boolean;
    asset_id: string;
    statistics: TelemetryStatistics;
  }> {
    return staleWhileRevalidate(
      `telemetry:stats:${assetId}:${days}`,
      () => client.get(`/telemetry/${assetId}/statistics?days=${days}`),
      60000 // 1 minute
    );
  },

  // Get telemetry alerts
  async getAlerts(): Promise<{
    success: boolean;
    alerts: TelemetryAlert[];
    count: number;
  }> {
    return staleWhileRevalidate(
      'telemetry:alerts',
      () => client.get('/telemetry/alerts'),
      15000 // 15 seconds
    );
  },
};

// Backward compatibility exports for telemetry
export const getLiveTelemetry = (params?: { vehicle_id?: number; operator_id?: number }) =>
  TelemetryAPI.getLiveTelemetry(params);
export const getAssetTelemetry = (assetId: string) => TelemetryAPI.getAssetTelemetry(assetId);
export const getTelemetryLatest = (assetId: string) => TelemetryAPI.getLatest(assetId);
export const getTelemetryStatistics = (assetId: string, days?: number) =>
  TelemetryAPI.getStatistics(assetId, days);
export const getTelemetryAlerts = () => TelemetryAPI.getAlerts();

// ============================================================================
// Payout API - Revenue Distribution
// ============================================================================

export interface PayoutDistributionRequest {
  asset_id: number;
  amount: number;
  period_start: string;
  period_end: string;
}

export interface PayoutRecord {
  id: number;
  investment_id: number;
  asset_id: number;
  investor_id: number;
  amount: number;
  period_start: string;
  period_end: string;
  distribution_id: number;
  status: 'pending' | 'completed' | 'failed';
  blockchain_hash: string | null;
  processed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  asset?: { name: string };
  investment?: { ownership_percentage: number };
}

export interface PayoutDistributionRecord {
  id: number;
  asset_id: number;
  asset_name: string;
  amount: number;
  investor_count: number;
  period_start: string;
  period_end: string;
  distributed_at: string;
  status: 'processing' | 'completed' | 'failed';
}

export const PayoutAPI = {
  // Get assets ready for payout distribution
  async getAssetsForPayout(): Promise<Array<{
    id: number;
    name: string;
    registration_number: string;
    total_revenue: number;
    available_for_distribution: number;
    investor_count: number;
  }>> {
    return client.get('/payouts/assets');
  },

  // Distribute payout to investors
  async distributePayout(data: PayoutDistributionRequest): Promise<{
    message: string;
    distribution: PayoutDistributionRecord;
    investors_paid: number;
  }> {
    const response = await client.post<{
      message: string;
      distribution: PayoutDistributionRecord;
      investors_paid: number;
    }>('/payouts/distribute', data);
    // Invalidate related caches
    apiCache.invalidatePattern(/^investment:/);
    apiCache.invalidatePattern(/^wallet:/);
    return response;
  },

  // Get payout distribution history
  async getPayoutHistory(): Promise<PayoutDistributionRecord[]> {
    return staleWhileRevalidate(
      'payout:history',
      () => client.get('/payouts/history'),
      60000 // 1 minute
    );
  },

  // Get investor's payout history
  async getInvestorPayouts(): Promise<{
    payouts: PayoutRecord[];
    total_earnings: number;
  }> {
    return staleWhileRevalidate(
      'payout:investor',
      () => client.get('/payouts/my'),
      30000
    );
  },
};

// Backward compatibility exports for payout
export const getAssetsForPayout = () => PayoutAPI.getAssetsForPayout();
export const distributePayout = (data: PayoutDistributionRequest) => PayoutAPI.distributePayout(data);
export const getPayoutHistory = () => PayoutAPI.getPayoutHistory();
export const getInvestorPayouts = () => PayoutAPI.getInvestorPayouts();

// ============================================================================
// Export API - Data Export Features
// ============================================================================

export const ExportAPI = {
  // Export portfolio to CSV
  async exportPortfolioCsv(): Promise<Blob> {
    return client.get<Blob>('/export/portfolio.csv');
  },

  // Export transactions to CSV
  async exportTransactionsCsv(params?: {
    from_date?: string;
    to_date?: string;
    type?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);
    if (params?.type) queryParams.append('type', params.type);

    const query = queryParams.toString();
    return client.get<Blob>(`/export/transactions.csv${query ? '?' + query : ''}`);
  },

  // Export earnings report (for drivers)
  async exportEarningsCsv(params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);

    const query = queryParams.toString();
    return client.get<Blob>(`/export/earnings.csv${query ? '?' + query : ''}`);
  },

  // Export fleet report (for operators)
  async exportFleetReportCsv(): Promise<Blob> {
    return client.get<Blob>('/export/fleet.csv');
  },

  // Export payout report
  async exportPayoutsCsv(params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams();
    if (params?.from_date) queryParams.append('from_date', params.from_date);
    if (params?.to_date) queryParams.append('to_date', params.to_date);

    const query = queryParams.toString();
    return client.get<Blob>(`/export/payouts.csv${query ? '?' + query : ''}`);
  },
};

// Utility function to download blob as file
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ============================================================================
// Health Check API
// ============================================================================

export const HealthAPI = {
  async ping(): Promise<{ status: string }> {
    // Use raw fetch without auth for health check
    const response = await fetch(`${API_URL}/ping`);
    return response.json();
  },

  async health(): Promise<{
    status: string;
    services: Record<string, boolean>;
    timestamp: string;
  }> {
    const response = await fetch(`${API_URL}/health`);
    return response.json();
  },
};

// ============================================================================
// Helper functions (used by PaymentAPI)
// ============================================================================

async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = TokenManager.get();
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}

async function createApiError(response: Response): Promise<ApiError> {
  let message = `HTTP ${response.status}: ${response.statusText}`;
  let errors: Record<string, string[]> | undefined;

  try {
    const data = await response.json();
    message = data.message || message;
    errors = data.errors;
  } catch {}

  return { message, errors, status: response.status };
}

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  }

  async register(data: { name: string; email: string; password: string; password_confirmation: string }) {
    const response = await this.client.post('/register', data);
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/logout');
    } finally {
      localStorage.removeItem('auth_token');
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/user');
    return response.data;
  }

  // Vehicle endpoints
  async getVehicles(params?: { status?: string; page?: number }) {
    const response = await this.client.get('/vehicles', { params });
    return response.data;
  }

  async getVehicle(id: number) {
    const response = await this.client.get(`/vehicles/${id}`);
    return response.data;
  }

  // Fleet operations endpoints
  async getFleetOperations(params?: { page?: number }) {
    const response = await this.client.get('/fleet-operations', { params });
    return response.data;
  }

  async createFleetOperation(data: { vehicle_id: number }) {
    const response = await this.client.post('/fleet-operations', data);
    return response.data;
  }

  async updateFleetOperation(id: number, data: { status?: string }) {
    const response = await this.client.put(`/fleet-operations/${id}`, data);
    return response.data;
  }

  // Revenue endpoints
  async getRevenues(params?: { start_date?: string; end_date?: string; page?: number }) {
    const response = await this.client.get('/revenues', { params });
    return response.data;
  }

  async getRevenueSummary() {
    const response = await this.client.get('/revenues/summary');
    return response.data;
  }

  // Investment endpoints
  async getInvestments(params?: { page?: number }) {
    const response = await this.client.get('/investments', { params });
    return response.data;
  }

  async createInvestment(data: { asset_id: number; amount: number }) {
    const response = await this.client.post('/investments', data);
    return response.data;
  }

  // Wallet endpoints
  async getWallet() {
    const response = await this.client.get('/wallet');
    return response.data;
  }

  async getWalletTransactions(params?: { page?: number }) {
    const response = await this.client.get('/wallet/transactions', { params });
    return response.data;
  }

  // Analytics endpoints
  async getAnalytics(params?: { start_date?: string; end_date?: string }) {
    const response = await this.client.get('/analytics', { params });
    return response.data;
  }

  // Generic request method for custom endpoints
  async request<T = any>(method: string, url: string, data?: any) {
    const response = await this.client.request<T>({
      method,
      url,
      data,
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'investor';
  kyc_status?: string;
  phone?: string;
}

export interface Vehicle {
  id: number;
  vehicle_type: string;
  registration_number: string;
  status: string;
  current_location?: string;
  battery_level?: number;
}

export interface FleetOperation {
  id: number;
  vehicle_id: number;
  operator_id: number;
  status: string;
  start_time: string;
  end_time?: string;
  distance_km?: number;
}

export interface Revenue {
  id: number;
  vehicle_id: number;
  operation_id?: number;
  amount: number;
  date: string;
  breakdown?: {
    rides?: number;
    tips?: number;
    bonuses?: number;
  };
}

export interface Investment {
  id: number;
  investor_id: number;
  asset_id: number;
  amount: number;
  token_amount: number;
  status: string;
  created_at: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  currency: string;
  public_key?: string;
  trovotech_wallet_id?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

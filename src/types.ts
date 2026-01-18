
export enum Page {
  Landing,
  About,
  Contact,
  InvestorDashboard,
  OperatorDashboard,
  DriverDashboard,
  AdminDashboard,
  AdminLogin,
  ESGImpact,
  SLXMarketplace,
  Riders,
  TrovotechOnboarding,
  UserProfile,
}

export type AssetType = 'EV' | 'Battery' | 'Cabinet';
export type AssetStatus = 'Available' | 'In Use' | 'Charging' | 'Maintenance';

export interface Asset {
  id: string;
  type: AssetType;
  model: string;
  status: AssetStatus;
  soh: number; // State of Health (%)
  swaps: number; // Cumulative swaps
  location: string;
  originalValue: number; // in Naira
  dailySwaps: number;
}

export interface Token {
  id: string;
  investorId: string;
  assetId: string;
  fraction: number; // 0 to 1.0
  investAmount: number; // in Naira
  roiProjection: number; // in Naira
  mintedAt: Date;
}

export interface Payout {
  payoutId: string;
  tokenId: string;
  month: string; // "YYYY-MM"
  grossRevenue: number;
  investorShare: number;
}

export interface SLXListing {
  assetId: string;
  soh: number;
  salvageValue: number; // in Naira
  listedAt: Date;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleAssigned: string;
  status: 'active' | 'inactive' | 'on-trip';
  totalTrips: number;
  totalEarnings: number;
  rating: number;
  joinedDate: string;
}

export type ScheduleType = 'swap' | 'charge';
export type ScheduleStatus = 'pending' | 'completed' | 'cancelled';

export interface OperationSchedule {
  id: number;
  assetId: string;
  type: ScheduleType;
  scheduledAt: string; // ISO
  status: ScheduleStatus;
  riderId?: string;
  note?: string;
}

export interface Pagination<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

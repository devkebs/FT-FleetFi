/**
 * TrovoTech API Integration Layer
 * Handles wallet creation, token minting, payout distribution via backend proxy
 * Backend will communicate with TrovoTech's Bantu Token Service (BTS)
 */

const API_BASE_URL = 'http://localhost:8000/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// Types for TrovoTech operations
export interface WalletResponse {
  walletAddress: string;
  balance: number;
  trusteeRef?: string;
  createdAt: string;
}

export interface TokenMintRequest {
  assetId: string;
  assetType: 'EV' | 'Battery' | 'SwapCabinet' | 'BiogasSite';
  fractionOwned: number; // percentage 0-100
  investAmount: number; // in Naira
  investorWallet: string;
}

export interface TokenMintResponse {
  tokenId: string;
  assetId: string;
  assetName?: string;
  fractionOwned: number;
  investAmount: number;
  metadataHash: string;
  trusteeRef: string;
  telemetryURI?: string;
  txHash: string;
  mintedAt: string;
}

export interface PayoutRequest {
  tokenIds: string[]; // distribute to all token holders
  totalRevenue: number;
  period: string; // e.g., "2025-11"
  description: string;
}

export interface PayoutResponse {
  payoutId: string;
  distributions: {
    tokenId: string;
    investorWallet: string;
    amount: number;
  }[];
  txHash: string;
  completedAt: string;
}

export interface TelemetrySyncRequest {
  assetId: string;
  batteryLevel?: number;
  kilometers?: number;
  status: string;
  location?: { lat: number; lng: number };
  timestamp: string;
}

/**
 * Create a custodial wallet for an investor via TrovoTech
 * Backend will call TrovoTech API with issuer credentials
 */
export async function createWallet(): Promise<WalletResponse> {
  const response = await fetch(`${API_BASE_URL}/trovotech/wallet/create`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Wallet creation failed' }));
    throw new Error(error.message || 'Failed to create wallet');
  }

  return response.json();
}

/**
 * Get current wallet details for authenticated user
 */
export async function getWallet(): Promise<WalletResponse | null> {
  const response = await fetch(`${API_BASE_URL}/trovotech/wallet`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (response.status === 404) {
    return null; // No wallet yet
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch wallet' }));
    throw new Error(error.message);
  }

  return response.json();
}

/**
 * Mint a fractional asset token (ERC-1155 equivalent on Bantu)
 * Requires investor to have a wallet and sufficient funds in custody
 */
export async function mintAssetToken(request: TokenMintRequest): Promise<TokenMintResponse> {
  const response = await fetch(`${API_BASE_URL}/trovotech/token/mint`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Token minting failed' }));
    throw new Error(error.message || 'Failed to mint token');
  }

  return response.json();
}

/**
 * Get all tokens owned by the authenticated user
 */
export async function getMyTokens(): Promise<TokenMintResponse[]> {
  const response = await fetch(`${API_BASE_URL}/trovotech/tokens/my`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch tokens' }));
    throw new Error(error.message);
  }

  return response.json();
}

/**
 * Initiate payout distribution to token holders
 * Operator/Admin only - distributes revenue proportionally
 */
export async function initiatePayout(request: PayoutRequest): Promise<PayoutResponse> {
  const response = await fetch(`${API_BASE_URL}/trovotech/payout/initiate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Payout initiation failed' }));
    throw new Error(error.message || 'Failed to initiate payout');
  }

  return response.json();
}

/**
 * Sync telemetry data to blockchain metadata
 * Links IoT feed to asset tokens for verifiable ROI tracking
 */
export async function syncTelemetry(request: TelemetrySyncRequest): Promise<{ success: boolean; uri: string }> {
  const response = await fetch(`${API_BASE_URL}/trovotech/telemetry/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Telemetry sync failed' }));
    throw new Error(error.message);
  }

  return response.json();
}

/**
 * Get blockchain metadata for an asset (IPFS/TrovoTech vault)
 */
export async function getAssetMetadata(assetId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/trovotech/asset/${assetId}/metadata`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Metadata fetch failed' }));
    throw new Error(error.message);
  }

  return response.json();
}

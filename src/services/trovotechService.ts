/**
 * Trovotech API Service
 * 
 * Handles all API calls to the FleetFi backend for Trovotech integration
 */

import { apiClient as api } from './api';

export interface OnboardUserRequest {
  mobile: string;
  mobile_country_code: string;
  public_key?: string;
  referrer?: string;
}

export interface OnboardUserResponse {
  message: string;
  trovotech: {
    username: string | null;
    publicKey: string | null;
  };
  wallet: {
    address: string;
    balance: number;
    trovotech_username: string | null;
  };
  secret_key?: {
    value: string;
    warning: string;
  } | null;
}

export interface WalletInfo {
  address: string;
  address_short: string;
  balance: number;
  trovotech_username: string | null;
  created_at: string;
}

export interface WalletInfoResponse {
  wallet: WalletInfo;
  network: string;
}

export interface UpdateKycRequest {
  user_id: number;
  kyc_level: number;
  kyc_data: Record<string, any>;
}

export interface UpdateKycResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    kyc_level: number;
    kyc_verified: boolean;
  };
  trovotech_response: any;
}

export interface KeypairInstructions {
  message: string;
  methods: {
    frontend: {
      description: string;
      code: string;
      recommended: boolean;
    };
    nodejs_service: {
      description: string;
      endpoint: string;
      recommended: boolean;
    };
    php_sdk: {
      description: string;
      package: string;
      recommended: boolean;
    };
  };
  security_notes: string[];
}

/**
 * Onboard the current user to Trovotech
 * 
 * @param {OnboardUserRequest} data - Onboarding data
 * @returns {Promise<OnboardUserResponse>} Onboarding result
 */
export const onboardUserToTrovotech = async (
  data: OnboardUserRequest
): Promise<OnboardUserResponse> => {
  const response = await api.post<OnboardUserResponse>(
    '/trovotech/users/onboard',
    data
  );
  return response;
};

/**
 * Get wallet information for the current user
 * 
 * @returns {Promise<WalletInfoResponse>} Wallet information
 */
export const getUserWallet = async (): Promise<WalletInfoResponse> => {
  const response = await api.get<WalletInfoResponse>('/trovotech/users/wallet');
  return response;
};

/**
 * Update KYC status for a user (Admin/Operator only)
 * 
 * @param {UpdateKycRequest} data - KYC update data
 * @returns {Promise<UpdateKycResponse>} Update result
 */
export const updateUserKyc = async (
  data: UpdateKycRequest
): Promise<UpdateKycResponse> => {
  const response = await api.post<UpdateKycResponse>(
    '/trovotech/users/kyc/update',
    data
  );
  return response;
};

/**
 * Get keypair generation instructions
 * 
 * @returns {Promise<KeypairInstructions>} Instructions for generating keypairs
 */
export const getKeypairInstructions = async (): Promise<KeypairInstructions> => {
  const response = await api.get<KeypairInstructions>(
    '/trovotech/users/keypair-instructions'
  );
  return response;
};

/**
 * Check if user is onboarded to Trovotech
 * 
 * @returns {Promise<boolean>} Whether user has a Trovotech wallet
 */
export const isUserOnboarded = async (): Promise<boolean> => {
  try {
    await getUserWallet();
    return true;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
};

export const trovotechService = {
  onboardUserToTrovotech,
  getUserWallet,
  updateUserKyc,
  getKeypairInstructions,
  isUserOnboarded,
};

export default trovotechService;

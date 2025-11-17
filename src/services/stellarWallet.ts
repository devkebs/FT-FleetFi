/**
 * Stellar Wallet Service for Trovotech Integration
 * 
 * This service handles Stellar wallet generation and management
 * for the FleetFi platform's Trovotech blockchain integration.
 */

import * as StellarSdk from 'stellar-base';

export interface WalletKeypair {
  publicKey: string;
  secretKey: string;
}

export interface WalletValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Generate a new Stellar wallet keypair
 * 
 * @returns {WalletKeypair} Object containing public and secret keys
 */
export const generateWallet = (): WalletKeypair => {
  const keypair = StellarSdk.Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret()
  };
};

/**
 * Validate a Stellar public key
 * 
 * @param {string} publicKey - The public key to validate
 * @returns {WalletValidation} Validation result
 */
export const validatePublicKey = (publicKey: string): WalletValidation => {
  try {
    StellarSdk.Keypair.fromPublicKey(publicKey);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Invalid public key format' 
    };
  }
};

/**
 * Validate a Stellar secret key
 * 
 * @param {string} secretKey - The secret key to validate
 * @returns {WalletValidation} Validation result
 */
export const validateSecretKey = (secretKey: string): WalletValidation => {
  try {
    StellarSdk.Keypair.fromSecret(secretKey);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: 'Invalid secret key format' 
    };
  }
};

/**
 * Get the network passphrase for the current environment
 * 
 * @param {boolean} isSandbox - Whether to use testnet or mainnet
 * @returns {string} Network passphrase
 */
export const getNetworkPassphrase = (isSandbox: boolean = true): string => {
  return isSandbox 
    ? 'Bantu Testnet ; January 2022'
    : 'Bantu Public Network ; January 2022';
};

/**
 * Format a public key for display (shortened version)
 * 
 * @param {string} publicKey - The full public key
 * @returns {string} Shortened format (e.g., "GXXXXXX...XXXXXX")
 */
export const formatPublicKeyShort = (publicKey: string): string => {
  if (!publicKey || publicKey.length < 16) {
    return publicKey;
  }
  return `${publicKey.substring(0, 8)}...${publicKey.substring(publicKey.length - 8)}`;
};

/**
 * Copy text to clipboard
 * 
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Download content as a text file
 * 
 * @param {string} content - Content to download
 * @param {string} filename - Name of the file
 */
export const downloadAsFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Security recommendations for wallet management
 */
export const WALLET_SECURITY_TIPS = [
  'Never share your secret key with anyone',
  'Store your secret key in a secure location (password manager, hardware wallet)',
  'Make multiple backup copies of your secret key',
  'Never take screenshots of your secret key',
  'Write down your secret key on paper and store it safely',
  'Your public key is safe to share - it\'s your wallet address',
  'If you lose your secret key, you lose access to your wallet forever',
  'FleetFi will never ask for your secret key'
];

export default {
  generateWallet,
  validatePublicKey,
  validateSecretKey,
  getNetworkPassphrase,
  formatPublicKeyShort,
  copyToClipboard,
  downloadAsFile,
  WALLET_SECURITY_TIPS
};

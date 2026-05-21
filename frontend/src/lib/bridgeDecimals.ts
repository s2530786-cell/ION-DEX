/**
 * Bridge token decimals and chain-specific mapping
 * 
 * ION native: 9 decimals (like TON)
 * BSC tokens: varies (USDT=18, wION=18, BNB=18)
 * 
 * Lock: BSC side — tokens locked in Vault contract
 * Release: ION side — equivalent tokens minted/unlocked
 */

export interface ChainToken {
  symbol: string;
  decimals: number;
  address?: string;
  minBridge: string;   // minimum bridge amount (human-readable)
  maxBridge: string;   // maximum bridge amount
  bridgeFee: number;   // fee percentage (e.g. 0.1 = 0.1%)
}

export const BSC_TOKENS: Record<string, ChainToken> = {
  ION: {
    symbol: 'wION',
    decimals: 18,
    address: '0xe1ab61f7b093435204df32f5b3a405de55445ea8',
    minBridge: '1000',
    maxBridge: '100000000',
    bridgeFee: 0.1,
  },
  USDT: {
    symbol: 'USDT',
    decimals: 18,
    address: '0x55d398326f99059fF775485246999027B3197955',
    minBridge: '10',
    maxBridge: '1000000',
    bridgeFee: 0.1,
  },
};

export const ION_TOKENS: Record<string, ChainToken> = {
  ION: {
    symbol: 'ION',
    decimals: 9,
    minBridge: '1000',
    maxBridge: '100000000',
    bridgeFee: 0.1,
  },
};

/** Status of a bridge transaction */
export type BridgeTxStatus = 
  | 'pending'      // submitted, waiting for confirmations
  | 'locked'       // BSC side: tokens locked in vault
  | 'locked_confirming' // waiting for enough BSC confirmations
  | 'releasing'    // ION side: tokens being released
  | 'completed'    // fully bridged
  | 'failed';      // reverted or expired

export interface BridgeTxState {
  txHash: string;
  direction: 'bsc-ion' | 'ion-bsc';
  amount: string;
  token: string;
  sourceDecimals: number;
  targetDecimals: number;
  status: BridgeTxStatus;
  sourceConfirmations: number;
  requiredConfirmations: number;
  lockAddress?: string;
  releaseTxHash?: string;
  timestamp: number;
}

/** Required BSC confirmations for bridge finality */
export const BSC_REQUIRED_CONFIRMATIONS = 12;

/** Required ION confirmations */
export const ION_REQUIRED_CONFIRMATIONS = 1;

/**
 * Convert amount between chains accounting for decimal differences.
 * e.g. 1000 ION (9 decimals) → 1000 wION (18 decimals)
 */
export function convertDecimals(
  amount: string,
  sourceDecimals: number,
  targetDecimals: number
): string {
  const diff = targetDecimals - sourceDecimals;
  if (diff === 0) return amount;
  if (diff > 0) {
    // Pad with zeros (smaller → larger decimals)
    return amount + '0'.repeat(diff);
  }
  // Truncate (larger → smaller decimals)
  return amount.slice(0, amount.length + diff) || '0';
}

/** Calculate bridge fee amount */
export function calculateBridgeFee(amount: string, feePercent: number): string {
  const num = parseFloat(amount);
  if (!num) return '0';
  return (num * feePercent / 100).toFixed(6);
}

/** Validate bridge amount against min/max */
export function validateBridgeAmount(
  amount: string,
  token: ChainToken
): string | null {
  const num = parseFloat(amount);
  if (!num || num <= 0) return 'Enter an amount';
  if (num < parseFloat(token.minBridge)) return `Minimum: ${token.minBridge} ${token.symbol}`;
  if (num > parseFloat(token.maxBridge)) return `Maximum: ${token.maxBridge} ${token.symbol}`;
  return null;
}

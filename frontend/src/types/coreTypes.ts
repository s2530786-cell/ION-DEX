/**
 * @file types/core.ts
 * @description Foundational atomic types for the ION DEX ecosystem.
 * Enforces strict address branding and string-based BigInt representation to prevent precision loss.
 */

/** 品牌类型：防止将普通 string 误传为地址 */
export type Address = string; 

/** 严谨：所有金额在 API 中统一使用 string (因为 JS Number 最大只有 2^53-1) */
export type BigIntString = string; 

/** 核心代币定义 */
export interface Token {
  address: Address;
  symbol: string;
  decimals: number;
  name?: string;
  logoURI?: string;
  balance?: BigIntString; // 余额需后端注入或前端实时查询
}

/** 路由步骤定义 */
export interface RouteStep {
  poolAddress: Address;
  protocol: 'UniV2' | 'UniV3' | 'ION-Native' | 'Curve';
  tokenIn: Address;
  tokenOut: Address;
  fee: number; // 费用点数 (如 300 表示 0.03%)
}

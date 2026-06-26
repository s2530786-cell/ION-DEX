/**
 * @file core.ts
 * @description Core domain types for ION DEX.
 */

export type Address = string;
export type BigIntString = string;

export interface Token {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export interface RouteStep {
  sourceId: string;
  sourceName: string;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: BigIntString;
  amountOut: BigIntString;
  fee: number;
}

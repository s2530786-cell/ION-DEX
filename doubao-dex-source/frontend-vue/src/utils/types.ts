export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  balance: string
  usdValue: number
  price: number
}

export interface LiquidityPool {
  pair: string
  tokenA: string
  tokenB: string
  reserveA: string
  reserveB: string
  totalSupply: string
  apr: number
  tvl: number
}

export interface StakePool {
  id: number
  pair: string
  apr: string
  staked: string
  rewards: string
  poolAddress: string
}

export interface Order {
  id: number
  user: string
  isBuy: boolean
  price: string
  amount: string
  filled: string
  finished: boolean
}

export interface TradeEvent {
  chain_type: string
  tx_hash: string
  block_number: number
  event_name: string
  event_data: string
  create_time: string
}

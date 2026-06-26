/**
 * @file types/components.ts
 * @description Standardized Props interfaces for the 7 core Swap components.
 */
import { Token, Address, BigIntString, RouteStep } from './core';
import { QuoteResponse } from './api';

/** 1. SwapPanel - 主编排器 */
export interface SwapPanelProps {
  initialTokenIn?: Token;
  initialTokenOut?: Token;
}

/** 2. TokenSelectModal - 过滤器 */
export interface TokenSelectProps {
  isOpen: boolean;
  onSelect: (token: Token) => void;
  excludeAddress?: Address;
}

/** 3. PriceChart - 数据透视 */
export interface PriceChartProps {
  pairAddress: Address;
  timeframe: '1H' | '4H' | '1D' | '1W';
}

/** 4. SlippageSetting - 策略配置 */
export interface SlippageSettingProps {
  modelValue: number; // 0.001 - 0.05
  onUpdate: (val: number) => void;
}

/** 5. ConfirmSwapModal - 终极防线 */
export interface ConfirmSwapProps {
  quote: QuoteResponse;
  tokenIn: Token;
  tokenOut: Token;
  inputAmount: BigIntString;
  onConfirm: () => Promise<void>;
}

/** 6. SwapRoutePanel - 路由虚拟化 */
export interface RoutePanelProps {
  route: RouteStep[];
  totalFee: number;
}

/** 7. WrapUnwrapPanel - 包装工具 */
export interface WrapUnwrapProps {
  mode: 'wrap' | 'unwrap';
  token: Token;
}

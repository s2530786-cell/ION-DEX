#!/bin/bash

# 设置名称
PROJECT_NAME="ion-dex-frontend"

echo "🚀 正在初始化 ION DEX 前端工程: $PROJECT_NAME..."

# 1. 创建 Vue + TypeScript 项目 (使用 Vite)
npm create vite@latest $PROJECT_NAME -- --template vue-ts
cd $PROJECT_NAME

# 2. 安装核心依赖
echo "📦 安装核心依赖 (Ethers, Zod, Pinia, VueUse)..."
npm install ethers zod pinia @vueuse/core
npm install -D sass

# 3. 创建目录结构
mkdir -p src/types src/stores src/components

# 4. 创建类型契约文件 (Single Source of Truth)
echo "📝 写入类型契约..."

cat << 'EOF' > src/types/core.ts
export type Address = string;
export type BigIntString = string;
export interface Token { address: Address; symbol: string; decimals: number; logoURI?: string; balance?: BigIntString; }
export interface RouteStep { poolAddress: Address; tokenIn: Address; tokenOut: Address; fee: number; }
EOF

cat << 'EOF' > src/types/api.ts
import { Address, BigIntString, RouteStep } from './core';
export interface ApiResponse<T> { data: T; error?: { code: string; message: string; revertReason?: string; }; traceId: string; }
export interface QuoteResponse { expectedOutput: BigIntString; minimumReceived: BigIntString; route: RouteStep[]; priceImpact: number; gasEstimate: BigIntString; simulationPassed: boolean; }
EOF

cat << 'EOF' > src/types/components.ts
import { Token, Address, BigIntString } from './core';
import { QuoteResponse } from './api';
export interface ConfirmSwapProps { quote: QuoteResponse; tokenIn: Token; tokenOut: Token; inputAmount: BigIntString; onConfirm: () => Promise<void>; }
EOF

# 5. 创建 Pinia Store 骨架
echo "🏗️ 创建 Pinia Store..."
cat << 'EOF' > src/stores/swap.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { QuoteResponse } from '../types/api';

export const useSwapStore = defineStore('swap', () => {
  const quote = ref<QuoteResponse | null>(null);
  const inputAmount = ref<string>('0');
  
  return { quote, inputAmount };
});
EOF

echo "✅ 初始化完成！"
echo "------------------------------------------"
echo "下一步操作:"
echo "1. cd $PROJECT_NAME"
echo "2. npm run dev"
echo "------------------------------------------"

<template>
  <div class="ion-add-liquidity">
    <div class="panel-header">
      <button class="back-btn" @click="emit('back')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>
      <h2>Add Liquidity</h2>
    </div>

    <div class="liquidity-workspace">
      <div class="workspace-left">
        <FeeTierSelector 
          v-model="feeTier" 
          :distributions="{ 100: 2, 500: 82, 3000: 15, 10000: 1 }"
          class="mb-24"
        />

        <PriceRangeSlider 
          :currentPrice="currentPrice"
          :token0Symbol="token0.symbol"
          :token1Symbol="token1.symbol"
          :tickSpacing="tickSpacing"
          @updateRange="handleRangeUpdate"
        />
      </div>

      <div class="workspace-right">
        <h4>Deposit Amounts</h4>
        
        <div class="deposit-card" :class="{ 'is-disabled': isToken0Disabled }">
          <div class="card-header">
            <span>Input Amount</span>
            <span class="balance">Balance: {{ formatBalance(balance0, token0.decimals) }}</span>
          </div>
          <div class="input-row">
            <input 
              type="text" 
              v-model="amount0" 
              @input="handleInput($event, '0')"
              :disabled="isToken0Disabled"
              placeholder="0.0" 
            />
            <span class="token-badge">{{ token0.symbol }}</span>
          </div>
        </div>

        <div class="plus-sign">+</div>

        <div class="deposit-card" :class="{ 'is-disabled': isToken1Disabled }">
          <div class="card-header">
            <span>Input Amount</span>
            <span class="balance">Balance: {{ formatBalance(balance1, token1.decimals) }}</span>
          </div>
          <div class="input-row">
            <input 
              type="text" 
              v-model="amount1" 
              @input="handleInput($event, '1')"
              :disabled="isToken1Disabled"
              placeholder="0.0" 
            />
            <span class="token-badge">{{ token1.symbol }}</span>
          </div>
        </div>

        <div class="action-zone">
          <button 
            v-if="needApproveToken0"
            class="action-btn approve-btn"
            :disabled="isApproving0"
            @click="handleApprove('0')"
          >
            <span v-if="isApproving0" class="spinner"></span>
            {{ isApproving0 ? `Approving ${token0.symbol}...` : `Approve ${token0.symbol}` }}
          </button>

          <button 
            v-if="needApproveToken1"
            class="action-btn approve-btn"
            :disabled="isApproving1"
            @click="handleApprove('1')"
          >
            <span v-if="isApproving1" class="spinner"></span>
            {{ isApproving1 ? `Approving ${token1.symbol}...` : `Approve ${token1.symbol}` }}
          </button>

          <button 
            class="action-btn submit-btn"
            :class="submitButtonState.class"
            :disabled="submitButtonState.disabled"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting" class="spinner"></span>
            {{ submitButtonState.text }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { parseUnits, formatUnits, Contract } from 'ethers';
import type { PoolToken } from '@/types/pool';
import { useWalletStore } from '@/stores/wallet';
import { ERC20_ABI } from '@/constants/abis';
import FeeTierSelector from './FeeTierSelector.vue';
import PriceRangeSlider from './PriceRangeSlider.vue';

const emit = defineEmits(['back', 'success']);
const walletStore = useWalletStore();

// Mock injection of current token pair and price context (in production passed from Route or parent)
const token0 = ref<PoolToken>({ address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 });
const token1 = ref<PoolToken>({ address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 });
const currentPrice = ref<number>(3000.00); // 1 WETH = 3000 USDC

// Core parameter states
const feeTier = ref(500); // Default 0.05%
const tickSpacing = computed(() => {
  if (feeTier.value === 100) return 2;
  if (feeTier.value === 500) return 10;
  if (feeTier.value === 3000) return 60;
  return 200;
});

// Price range states
const minPrice = ref<number>(2700);
const maxPrice = ref<number>(3300);

// Input amounts (string format to prevent precision loss)
const amount0 = ref('');
const amount1 = ref('');
const lastActiveInput = ref<'0' | '1'>('0');

// On-chain state machine data
const balance0 = ref('5000000000'); // Mock 5000 USDC
const balance1 = ref('2000000000000000000'); // Mock 2 WETH
const allowance0 = ref('0');
const allowance1 = ref('0');

// Loading state control
const isApproving0 = ref(false);
const isApproving1 = ref(false);
const isSubmitting = ref(false);

const V3_POSITION_MANAGER = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'; // Uniswap V3 Position Manager example

// ------------------------------------------------------------------
// Rigid Logic 1: Single-asset deposit mode boundary check
// ------------------------------------------------------------------
const isToken0Disabled = computed(() => currentPrice.value >= maxPrice.value);
const isToken1Disabled = computed(() => currentPrice.value <= minPrice.value);

// ------------------------------------------------------------------
// Rigid Logic 2: Concentrated Liquidity Calculus Sync Logic
// ------------------------------------------------------------------
// Based on V3 core formula: Δx/Δy = (1/sqrt(P) - 1/sqrt(P_max)) / (sqrt(P) - sqrt(P_min))
const syncAmounts = () => {
  if (isToken0Disabled.value) {
    amount0.value = '0';
    return;
  }
  if (isToken1Disabled.value) {
    amount1.value = '0';
    return;
  }

  const p = currentPrice.value;
  const pMin = minPrice.value;
  const pMax = maxPrice.value;

  const sqrtP = Math.sqrt(p);
  const sqrtMin = Math.sqrt(pMin);
  const sqrtMax = Math.sqrt(pMax);

  // Ratio represents: units of Token1 required per unit of Token0
  const ratio = (sqrtP * sqrtMin * (sqrtMax - sqrtP)) / (sqrtMax - sqrtMin);

  if (lastActiveInput.value === '0' && amount0.value) {
    const val0 = parseFloat(amount0.value);
    if (!isNaN(val0)) {
      amount1.value = (val0 * ratio).toFixed(token1.value.decimals);
    }
  } else if (lastActiveInput.value === '1' && amount1.value) {
    const val1 = parseFloat(amount1.value);
    if (!isNaN(val1)) {
      amount0.value = (val1 / ratio).toFixed(token0.value.decimals);
    }
  }
};

const handleInput = (e: Event, type: '0' | '1') => {
  const target = e.target as HTMLInputElement;
  let val = target.value.replace(/[^0-9.]/g, '');
  const parts = val.split('.');
  if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
  
  const token = type === '0' ? token0.value : token1.value;
  if (parts.length === 2 && parts[1].length > token.decimals) {
    val = parts[0] + '.' + parts[1].substring(0, token.decimals);
  }

  if (type === '0') {
    amount0.value = val;
  } else {
    amount1.value = val;
  }
  
  lastActiveInput.value = type;
  target.value = val;
  syncAmounts();
};

const handleRangeUpdate = (range: { min: number, max: number }) => {
  minPrice.value = range.min;
  maxPrice.value = range.max;
  syncAmounts();
};

// Listen to range and fee tier changes to recalibrate deposit amounts
watch([minPrice, maxPrice, feeTier], () => {
  syncAmounts();
});

// ------------------------------------------------------------------
// Rigid Logic 3: ERC20 Allowance Defense State Machine
// ------------------------------------------------------------------
const needApproveToken0 = computed(() => {
  if (!walletStore.isConnected || !amount0.value || parseFloat(amount0.value) === 0) return false;
  const parsedAmount = parseUnits(amount0.value, token0.value.decimals);
  return parsedAmount > BigInt(allowance0.value);
});

const needApproveToken1 = computed(() => {
  if (!walletStore.isConnected || !amount1.value || parseFloat(amount1.value) === 0) return false;
  const parsedAmount = parseUnits(amount1.value, token1.value.decimals);
  return parsedAmount > BigInt(allowance1.value);
});

const handleApprove = async (type: '0' | '1') => {
  if (!walletStore.signer) return;
  const token = type === '0' ? token0.value : token1.value;
  const isApproving = type === '0' ? isApproving0 : isApproving1;
  const allowanceRef = type === '0' ? allowance0 : allowance1;

  isApproving.value = true;
  try {
    const contract = new Contract(token.address, ERC20_ABI, walletStore.signer);
    const tx = await contract.approve(V3_POSITION_MANAGER, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    await tx.wait(1);
    allowanceRef.value = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; 
  } catch (err) {
    console.error(`Approve token ${token.symbol} failed`, err);
  } finally {
    isApproving.value = false;
  }
};

// ------------------------------------------------------------------
// Rigid Logic 4: Top-level Submission Guard
// ------------------------------------------------------------------
const submitButtonState = computed(() => {
  if (!walletStore.isConnected) return { text: 'Connect Wallet', disabled: false, class: 'primary' };
  if (needApproveToken0.value || needApproveToken1.value) return { text: 'Allowance Cleared Required', disabled: true, class: 'disabled' };
  if (isSubmitting.value) return { text: 'Creating Position...', disabled: true, class: 'disabled' };

  if (amount0.value && parseFloat(amount0.value) > 0) {
    const a0 = parseUnits(amount0.value, token0.value.decimals);
    if (a0 > BigInt(balance0.value)) return { text: `Insufficient ${token0.symbol} Balance`, disabled: true, class: 'error' };
  }
  if (amount1.value && parseFloat(amount1.value) > 0) {
    const a1 = parseUnits(amount1.value, token1.value.decimals);
    if (a1 > BigInt(balance1.value)) return { text: `Insufficient ${token1.symbol} Balance`, disabled: true, class: 'error' };
  }

  return { text: 'Preview & Supply', disabled: false, class: 'ready' };
});

const handleSubmit = async () => {
  if (!walletStore.isConnected) {
    walletStore.connect();
    return;
  }
  isSubmitting.value = true;
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    emit('success');
  } catch (err) {
    console.error("Create liquidity position failed", err);
  } finally {
    isSubmitting.value = false;
  }
};

const formatBalance = (bal: string, decimals: number) => {
  return parseFloat(formatUnits(bal, decimals)).toFixed(4);
};
</script>

<style scoped>
.ion-add-liquidity {
  width: 100%; max-width: 960px; background: #131313;
  border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 28px;
  padding: 24px; color: #fff; font-family: 'Inter', sans-serif;
  margin: 0 auto; box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}

.panel-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.panel-header h2 { margin: 0; font-size: 20px; font-weight: 600; }
.back-btn { background: none; border: none; color: #888; cursor: pointer; transition: 0.2s; padding: 0; }
.back-btn:hover { color: #fff; }

.liquidity-workspace { display: grid; grid-template-columns: 1fr 400px; gap: 40px; }
.workspace-left { min-width: 0; display: flex; flex-direction: column; }
.workspace-right { display: flex; flex-direction: column; }
.workspace-right h4 { margin: 0 0 16px 0; font-size: 15px; font-weight: 500; color: #aaa; }

.mb-24 { margin-bottom: 24px; }

.deposit-card {
  background: #1b1b1b; border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px; padding: 16px; transition: all 0.2s;
}
.deposit-card.is-disabled { opacity: 0.3; cursor: not-allowed; background: #151515; }
.deposit-card:not(.is-disabled):hover { border-color: rgba(0, 255, 163, 0.2); }

.deposit-card .card-header { display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-bottom: 8px; }
.deposit-card .input-row { display: flex; justify-content: space-between; align-items: center; }
.deposit-card input {
  background: transparent; border: none; color: #fff; font-size: 24px; font-weight: 600;
  outline: none; width: 100%;
}
.token-badge { background: #2a2a2a; padding: 6px 12px; border-radius: 12px; font-size: 14px; font-weight: 600; }

.plus-sign { text-align: center; color: #444; font-size: 20px; margin: 8px 0; font-weight: bold; }

.action-zone { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }

.action-btn {
  width: 100%; padding: 16px; border-radius: 16px; font-size: 16px;
  font-weight: 600; border: none; cursor: pointer; transition: all 0.2s;
  display: flex; justify-content: center; align-items: center; gap: 10px;
}
.approve-btn { background: rgba(0, 255, 163, 0.1); color: #00ffa3; border: 1px solid rgba(0, 255, 163, 0.2); }
.approve-btn:hover:not(:disabled) { background: rgba(0, 255, 163, 0.2); }

.submit-btn.primary { background: rgba(0, 255, 163, 0.1); color: #00ffa3; border: 1px solid rgba(0, 255, 163, 0.2); }
.submit-btn.ready { background: #00ffa3; color: #000; }
.submit-btn.ready:hover { background: #00e693; }
.submit-btn.disabled { background: #222; color: #555; cursor: not-allowed; }
.submit-btn.error { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.3); }

.spinner {
  width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1);
  border-top-color: currentColor; border-radius: 50%; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>

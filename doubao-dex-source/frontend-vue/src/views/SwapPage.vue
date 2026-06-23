<template>
  <div class="swap-page">
    <div class="swap-card ion-glass rounded-2xl p-6">
      <h2 class="text-xl font-bold mb-4 ion-neon-cyan">Swap</h2>
      <div class="input-group mb-3">
        <label class="text-white/60 text-sm">From</label>
        <div class="flex bg-white/5 rounded-lg p-3 items-center">
          <input v-model="amountIn" placeholder="0.0" class="bg-transparent outline-none flex-1 text-white" />
          <select v-model="tokenIn" class="bg-transparent text-white">
            <option value="ION">ION</option>
            <option value="BNB">BNB</option>
            <option value="USDT">USDT</option>
          </select>
        </div>
      </div>
      <div class="text-center my-2 text-2xl">↓</div>
      <div class="input-group mb-4">
        <label class="text-white/60 text-sm">To</label>
        <div class="flex bg-white/5 rounded-lg p-3 items-center">
          <input :value="amountOut" disabled placeholder="0.0" class="bg-transparent outline-none flex-1 text-white" />
          <select v-model="tokenOut" class="bg-transparent text-white">
            <option value="USDT">USDT</option>
            <option value="ION">ION</option>
            <option value="BNB">BNB</option>
          </select>
        </div>
      </div>
      <div class="text-white/60 text-sm mb-4">Slippage: 0.5% | Fee: 0.3%</div>
      <button @click="doSwap" class="w-full py-3 rounded-lg bg-gradient-to-r from-ion-green to-ion-cyan font-bold hover:brightness-125">
        Swap
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWeb3Store } from '@/stores/web3'
import { ethers } from 'ethers'

const store = useWeb3Store()
const amountIn = ref('')
const tokenIn = ref('ION')
const tokenOut = ref('USDT')

const amountOut = computed(() => {
  if (!amountIn.value) return ''
  const inVal = parseFloat(amountIn.value)
  return (inVal * 0.997).toFixed(6)
})

async function doSwap() {
  if (!store.signer || !amountIn.value) return
  const dexAddr = import.meta.env.VITE_DEX_CONTRACT
  const abi = ['function swap(address tokenIn,address tokenOut,uint256 amountIn) external returns(uint256)']
  const contract = new ethers.Contract(dexAddr, abi, store.signer)
  const tx = await contract.swap(tokenIn.value, tokenOut.value, ethers.parseEther(amountIn.value))
  await tx.wait()
  alert('Swap successful')
}
</script>

<style scoped>
.swap-page { max-width: 420px; margin: 40px auto; padding: 0 16px; }
</style>

<template>
  <div class="bridge-page p-4 max-w-md mx-auto">
    <h2 class="text-2xl font-bold mb-6 ion-neon-cyan">Bridge</h2>
    <div class="ion-glass rounded-2xl p-6">
      <div class="mb-4">
        <label class="text-white/60 text-sm">From Chain</label>
        <select v-model="fromChain" class="w-full p-3 bg-white/5 rounded-lg mt-1 text-white">
          <option value="BSC">BSC</option>
          <option value="ETH">Ethereum</option>
          <option value="ION">ION</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="text-white/60 text-sm">To Chain</label>
        <select v-model="toChain" class="w-full p-3 bg-white/5 rounded-lg mt-1 text-white">
          <option value="ION">ION</option>
          <option value="BSC">BSC</option>
          <option value="ETH">Ethereum</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="text-white/60 text-sm">Token</label>
        <select v-model="token" class="w-full p-3 bg-white/5 rounded-lg mt-1 text-white">
          <option value="ION">ION</option>
          <option value="BNB">BNB</option>
          <option value="USDT">USDT</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="text-white/60 text-sm">Amount</label>
        <input v-model="amount" placeholder="0.0" class="w-full p-3 bg-white/5 rounded-lg mt-1 text-white" />
      </div>
      <button @click="doBridge" class="w-full py-3 rounded-lg bg-gradient-to-r from-ion-purple to-ion-cyan font-bold">
        Bridge
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWeb3Store } from '@/stores/web3'
import { ethers } from 'ethers'

const store = useWeb3Store()
const fromChain = ref('BSC')
const toChain = ref('ION')
const token = ref('ION')
const amount = ref('')

async function doBridge() {
  if (!store.signer || !amount.value) return
  const vaultAddr = import.meta.env.VITE_VAULT_CONTRACT
  const abi = ['function lock(address token,uint256 amount,bytes32 recipient) external']
  const contract = new ethers.Contract(vaultAddr, abi, store.signer)
  const tx = await contract.lock(token.value, ethers.parseEther(amount.value), ethers.ZeroHash)
  await tx.wait()
  alert('Bridge initiated')
}
</script>

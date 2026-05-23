<template>
  <div class="batch-page p-4 max-w-lg mx-auto">
    <h2 class="text-2xl font-bold mb-6 ion-neon-cyan">Batch Transfer & Collect</h2>
    <div class="flex gap-2 mb-6">
      <button :class="{ active: tab === 'transfer' }" @click="tab = 'transfer'" class="flex-1 py-2 rounded bg-white/10">Transfer</button>
      <button :class="{ active: tab === 'collect' }" @click="tab = 'collect'" class="flex-1 py-2 rounded bg-white/10">Collect</button>
    </div>

    <div v-if="tab === 'transfer'" class="ion-glass rounded-2xl p-6">
      <textarea v-model="transferText" placeholder="address,amount&#10;0x...,100&#10;0x...,200" rows="6" class="w-full p-3 bg-white/5 rounded-lg mb-4 text-white font-mono"></textarea>
      <button @click="doBatchTransfer" class="w-full py-3 rounded-lg bg-gradient-to-r from-ion-green to-ion-cyan font-bold">Execute Batch Transfer</button>
    </div>

    <div v-if="tab === 'collect'" class="ion-glass rounded-2xl p-6">
      <input v-model="mainAddr" placeholder="Main collection address" class="w-full p-3 bg-white/5 rounded-lg mb-3 text-white" />
      <textarea v-model="collectText" placeholder="Addresses to collect from (one per line)" rows="6" class="w-full p-3 bg-white/5 rounded-lg mb-4 text-white font-mono"></textarea>
      <button @click="doCollect" class="w-full py-3 rounded-lg bg-gradient-to-r from-ion-purple to-ion-pink font-bold">Batch Collect</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ethers } from 'ethers'
import { useWeb3Store } from '@/stores/web3'

const store = useWeb3Store()
const tab = ref('transfer')
const transferText = ref('')
const mainAddr = ref('')
const collectText = ref('')

const batchAbi = [
  'function batchErc20(address token,address[] calldata tos,uint256[] calldata amounts) external',
  'function batchCollect(address token,address mainAddr,address[] calldata fromAddrs) external',
  'function batchNative(address[] calldata tos,uint256[] calldata amounts) external payable',
]

async function doBatchTransfer() {
  if (!store.signer || !transferText.value) return
  const lines = transferText.value.trim().split('\n').filter(x => x)
  const tos: string[] = []
  const amts: bigint[] = []
  for (const line of lines) {
    const [addr, amt] = line.split(',')
    tos.push(addr.trim())
    amts.push(ethers.parseEther(amt.trim()))
  }
  const batchAddr = import.meta.env.VITE_BATCH_CONTRACT
  const contract = new ethers.Contract(batchAddr, batchAbi, store.signer)
  const tx = await contract.batchErc20('0x...', tos, amts)
  await tx.wait()
  alert('Batch transfer successful')
}

async function doCollect() {
  if (!store.signer || !collectText.value) return
  const addrs = collectText.value.trim().split('\n').filter(x => x)
  const batchAddr = import.meta.env.VITE_BATCH_CONTRACT
  const contract = new ethers.Contract(batchAddr, batchAbi, store.signer)
  const tx = await contract.batchCollect('token-contract', mainAddr.value, addrs)
  await tx.wait()
  alert('Collection complete')
}
</script>

<style scoped>
button.active { background: #4f46e5; color: #fff; }
</style>

<template>
  <div class="pool-page p-4 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-6 ion-neon-cyan">Liquidity Pools</h2>
    <div class="pool-grid grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="pool in pools" :key="pool.pair" class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card">
        <div class="flex justify-between mb-2">
          <span class="font-bold">{{ pool.pair }}</span>
          <span class="text-ion-green">{{ pool.apr }}</span>
        </div>
        <div class="text-white/60 text-sm mb-3">TVL: {{ pool.tvl }}</div>
        <div class="flex gap-2">
          <button @click="addLiquidity(pool)" class="flex-1 py-2 rounded-lg bg-ion-cyan/20 border border-ion-cyan/40 text-sm">Add</button>
          <button @click="removeLiquidity(pool)" class="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-sm">Remove</button>
        </div>
      </div>
    </div>

    <!-- Add Liquidity Modal -->
    <div v-if="showAddModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="showAddModal=false">
      <div class="ion-glass rounded-2xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold mb-4">Add Liquidity: {{ activePool?.pair }}</h3>
        <input v-model="addAmountA" placeholder="Token A amount" class="w-full p-3 bg-white/5 rounded-lg mb-3 text-white" />
        <input v-model="addAmountB" placeholder="Token B amount" class="w-full p-3 bg-white/5 rounded-lg mb-4 text-white" />
        <button @click="confirmAdd" class="w-full py-3 rounded-lg bg-gradient-to-r from-ion-green to-ion-cyan font-bold">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWeb3Store } from '@/stores/web3'
import { ethers } from 'ethers'

const store = useWeb3Store()
const showAddModal = ref(false)
const activePool = ref<any>(null)
const addAmountA = ref('')
const addAmountB = ref('')

const pools = ref([
  { pair: 'ION/USDT', apr: '18.65%', tvl: '$128.56K', addr: '0x...' },
  { pair: 'BNB/USDT', apr: '15.32%', tvl: '$396.28K', addr: '0x...' },
  { pair: 'ETH/USDT', apr: '12.88%', tvl: '$520.15K', addr: '0x...' },
])

function addLiquidity(pool: any) {
  activePool.value = pool
  showAddModal.value = true
}

async function confirmAdd() {
  if (!store.signer || !activePool.value) return
  const lpAddr = import.meta.env.VITE_LP_POOL_CONTRACT
  const abi = ['function addLiquidity(uint256 amountA,uint256 amountB) external returns(uint256)']
  const contract = new ethers.Contract(lpAddr, abi, store.signer)
  const tx = await contract.addLiquidity(ethers.parseEther(addAmountA.value), ethers.parseEther(addAmountB.value))
  await tx.wait()
  showAddModal.value = false
  alert('Liquidity added')
}

function removeLiquidity(pool: any) {
  alert('Remove liquidity - requires LP token approval')
}
</script>

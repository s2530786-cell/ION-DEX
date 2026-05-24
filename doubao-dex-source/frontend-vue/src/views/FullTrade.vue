<template>
  <div class="trade-page flex gap-4 p-4">
    <div class="w-1/2">
      <div class="ion-glass rounded-xl p-4 mb-4">
        <h3 class="text-ion-green font-bold mb-3">Buy</h3>
        <input v-model="buyPrice" placeholder="Price" class="w-full p-2 bg-white/5 rounded mb-2 text-white" />
        <input v-model="buyAmount" placeholder="Amount" class="w-full p-2 bg-white/5 rounded mb-3 text-white" />
        <button @click="placeBuy" class="w-full py-2 rounded bg-ion-green/30 border border-ion-green/50">Limit Buy</button>
      </div>
      <div class="ion-glass rounded-xl p-4">
        <h3 class="text-red-400 font-bold mb-3">Sell</h3>
        <input v-model="sellPrice" placeholder="Price" class="w-full p-2 bg-white/5 rounded mb-2 text-white" />
        <input v-model="sellAmount" placeholder="Amount" class="w-full p-2 bg-white/5 rounded mb-3 text-white" />
        <button @click="placeSell" class="w-full py-2 rounded bg-red-500/30 border border-red-500/50">Limit Sell</button>
      </div>
    </div>
    <div class="w-1/2">
      <div class="ion-glass rounded-xl p-4 mb-4">
        <h3 class="font-bold mb-2 ion-neon-cyan">Order Depth</h3>
        <div v-for="i in depthBuy" :key="i[0]" class="text-ion-green text-sm">{{ i[0] }} | {{ i[1] }}</div>
        <div v-for="i in depthSell" :key="i[0]" class="text-red-400 text-sm">{{ i[0] }} | {{ i[1] }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ethers } from 'ethers'
import { useWeb3Store } from '@/stores/web3'

const BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const store = useWeb3Store()
const buyPrice = ref('')
const buyAmount = ref('')
const sellPrice = ref('')
const sellAmount = ref('')
const depthBuy = ref<number[][]>([])
const depthSell = ref<number[][]>([])

const orderAbi = ['function placeOrder(bool isBuy,uint256 price,uint256 amount) external']

async function loadDepth() {
  try {
    const k = await axios.get(`${BASE_API}/price/kline/data`, {
      params: { chain: store.chain, contract: 'token-addr', period: '1m' }
    })
    depthBuy.value = k.data.depth_buy || []
    depthSell.value = k.data.depth_sell || []
  } catch { /* fallback silent */ }
}

async function placeBuy() {
  if (!store.signer) return
  const contract = new ethers.Contract(
    import.meta.env.VITE_ORDERBOOK_CONTRACT, orderAbi, store.signer
  )
  await contract.placeOrder(true, ethers.parseEther(buyPrice.value), ethers.parseEther(buyAmount.value))
  loadDepth()
}

async function placeSell() {
  if (!store.signer) return
  const contract = new ethers.Contract(
    import.meta.env.VITE_ORDERBOOK_CONTRACT, orderAbi, store.signer
  )
  await contract.placeOrder(false, ethers.parseEther(sellPrice.value), ethers.parseEther(sellAmount.value))
  loadDepth()
}

onMounted(loadDepth)
</script>

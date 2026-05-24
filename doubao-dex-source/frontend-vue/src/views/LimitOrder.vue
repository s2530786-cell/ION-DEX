<template>
  <div class="order-page p-4 max-w-2xl mx-auto">
    <h2 class="text-2xl font-bold mb-6 ion-neon-pink">Limit Orders</h2>
    <div class="ion-glass rounded-2xl p-6 mb-6">
      <div class="flex gap-2 mb-4">
        <button :class="{ active: type === 'buy' }" @click="type = 'buy'" class="flex-1 py-2 rounded bg-ion-green/20 border border-ion-green/40">Buy</button>
        <button :class="{ active: type === 'sell' }" @click="type = 'sell'" class="flex-1 py-2 rounded bg-red-500/20 border border-red-500/40">Sell</button>
      </div>
      <input v-model="price" placeholder="Limit Price (USD)" class="w-full p-3 bg-white/5 rounded-lg mb-3 text-white" />
      <input v-model="amount" placeholder="Amount" class="w-full p-3 bg-white/5 rounded-lg mb-4 text-white" />
      <button @click="placeOrder" class="w-full py-3 rounded-lg bg-gradient-to-r from-ion-pink to-ion-purple font-bold">Place Order</button>
    </div>

    <div class="ion-glass rounded-2xl p-6">
      <h3 class="font-bold mb-4">My Orders</h3>
      <div v-for="item in orderList" :key="item.id" class="flex justify-between py-2 border-b border-white/10">
        <span>{{ item.event_name }}</span>
        <span>{{ JSON.parse(item.event_data || '{}').amount / 1e18 }}</span>
        <button @click="cancelOrder(item)" class="text-red-400 text-sm">Cancel</button>
      </div>
      <div v-if="orderList.length === 0" class="text-white/40 text-center py-4">No orders</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ethers } from 'ethers'
import axios from 'axios'
import { useWeb3Store } from '@/stores/web3'

const BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const store = useWeb3Store()
const type = ref('buy')
const price = ref('')
const amount = ref('')
const orderList = ref<any[]>([])

const orderAbi = [
  'function placeOrder(bool isBuy,uint256 price,uint256 amount) external',
  'function cancelOrder(uint256 orderId) external',
]

async function loadOrders() {
  if (!store.address) return
  try {
    const res = await axios.get(`${BASE_API}/order/list`, {
      params: { wallet: store.address, chain: store.chain }
    })
    orderList.value = res.data.data || []
  } catch {
    orderList.value = []
  }
}

async function placeOrder() {
  if (!store.signer || !price.value || !amount.value) return
  const orderAddr = import.meta.env.VITE_ORDERBOOK_CONTRACT
  const contract = new ethers.Contract(orderAddr, orderAbi, store.signer)
  const p = ethers.parseEther(price.value)
  const a = ethers.parseEther(amount.value)
  const tx = await contract.placeOrder(type.value === 'buy', p, a)
  await tx.wait()
  loadOrders()
}

async function cancelOrder(item: any) {
  if (!store.signer) return
  const orderAddr = import.meta.env.VITE_ORDERBOOK_CONTRACT
  const contract = new ethers.Contract(orderAddr, orderAbi, store.signer)
  const id = JSON.parse(item.event_data || '{}').orderId
  if (id !== undefined) {
    await contract.cancelOrder(id)
    loadOrders()
  }
}

onMounted(loadOrders)
</script>

<style scoped>
button.active { color: #fff; }
</style>

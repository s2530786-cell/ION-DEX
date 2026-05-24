<template>
  <nav class="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
    <div class="flex items-center gap-3">
      <span class="text-xl font-bold ion-neon-cyan">ION DEX</span>
    </div>
    <div class="flex items-center gap-4">
      <router-link to="/" class="text-white/70 hover:text-white transition">Home</router-link>
      <router-link to="/swap" class="text-white/70 hover:text-white transition">Swap</router-link>
      <router-link to="/pool" class="text-white/70 hover:text-white transition">Pool</router-link>
      <router-link to="/stake" class="text-white/70 hover:text-white transition">Stake</router-link>
      <router-link to="/bridge" class="text-white/70 hover:text-white transition">Bridge</router-link>
      <router-link to="/limit-order" class="text-white/70 hover:text-white transition">Orders</router-link>
    </div>
    <div>
      <button v-if="!store.isConnected" @click="connect" class="px-4 py-2 rounded-lg bg-gradient-to-r from-ion-cyan to-ion-purple text-white font-bold">
        Connect Wallet
      </button>
      <span v-else class="text-white/80 text-sm">{{ store.address.slice(0, 6) }}...{{ store.address.slice(-4) }}</span>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useWeb3Store } from '@/stores/web3'

const store = useWeb3Store()

async function connect() {
  await store.connect()
  await store.login()
}
</script>

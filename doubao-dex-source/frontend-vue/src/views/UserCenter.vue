<template>
  <div class="user-wrap p-4 max-w-md mx-auto">
    <h2 class="text-2xl font-bold mb-6 ion-neon-cyan">User Center</h2>
    <div class="ion-glass rounded-2xl p-6">
      <p class="mb-4 text-white/80">Wallet: {{ addr || 'Not connected' }}</p>
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <span>Theme</span>
          <select v-model="theme" @change="save" class="bg-white/10 p-2 rounded text-white">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div class="flex justify-between items-center">
          <span>Language</span>
          <select v-model="lang" @change="save" class="bg-white/10 p-2 rounded text-white">
            <option value="en">English</option>
            <option value="zh">中文</option>
          </select>
        </div>
        <div class="flex justify-between items-center">
          <span>Slippage (%)</span>
          <input v-model.number="slippage" @change="save" class="bg-white/10 p-2 rounded text-white w-24 text-right" />
        </div>
        <div class="flex justify-between items-center">
          <span>Gas Mode</span>
          <select v-model="gasMode" @change="save" class="bg-white/10 p-2 rounded text-white">
            <option value="fast">Fast</option>
            <option value="standard">Standard</option>
            <option value="slow">Slow</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useWeb3Store } from '@/stores/web3'

const BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const store = useWeb3Store()
const addr = ref('')
const theme = ref('dark')
const lang = ref('en')
const slippage = ref(0.5)
const gasMode = ref('standard')

async function load() {
  try {
    const res = await axios.get(`${BASE_API}/user/profile`, {
      params: { chain: store.chain },
      headers: { Authorization: `Bearer ${store.token}` }
    })
    const d = res.data.data
    addr.value = d.wallet_address
    theme.value = d.theme || 'dark'
    lang.value = d.lang || 'en'
    slippage.value = d.default_slippage || 0.5
    gasMode.value = d.default_gas_mode || 'standard'
  } catch {
    addr.value = store.address
  }
}

async function save() {
  try {
    await axios.post(`${BASE_API}/user/setting`, {
      theme: theme.value, lang: lang.value, slippage: slippage.value, gas_mode: gasMode.value
    }, {
      params: { chain: store.chain },
      headers: { Authorization: `Bearer ${store.token}` }
    })
  } catch { /* ignore */ }
}

onMounted(load)
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="visible = false">
    <div class="ion-glass rounded-2xl p-6 w-full max-w-md">
      <h3 class="text-lg font-bold mb-4 ion-neon-purple">Bridge</h3>
      <p class="text-white/60 mb-4">Cross-chain bridge powered by ION Relay</p>
      <div class="space-y-3 mb-4">
        <div class="flex justify-between p-3 bg-white/5 rounded-lg">
          <span>From</span>
          <select v-model="fromChain" class="bg-transparent text-white">
            <option value="BSC">BSC</option>
            <option value="ETH">Ethereum</option>
            <option value="ION">ION</option>
          </select>
        </div>
        <div class="flex justify-between p-3 bg-white/5 rounded-lg">
          <span>To</span>
          <select v-model="toChain" class="bg-transparent text-white">
            <option value="ION">ION</option>
            <option value="BSC">BSC</option>
            <option value="ETH">Ethereum</option>
          </select>
        </div>
      </div>
      <button @click="visible = false" class="w-full py-2 rounded bg-gradient-to-r from-ion-purple to-ion-cyan font-bold">Bridge Now</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()
const fromChain = ref('BSC')
const toChain = ref('ION')
</script>

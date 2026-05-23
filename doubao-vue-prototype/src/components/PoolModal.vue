<template>
  <div v-if="visible" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="closeModal">
    <div class="w-[500px] ion-glass rounded-2xl p-6 ion-liquid-border">
      <div class="flex items-center gap-4 mb-5">
        <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-ion-cyan to-ion-purple animate-spinSlow"></div>
        <div>
          <h3 class="text-xl font-bold ion-neon-cyan">Pool 流动性池</h3>
          <p class="text-white/60 text-sm">Liquidity Mining Pool</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-5">
        <div>
          <p class="text-white/60 text-sm">Total TVL</p>
          <p class="text-xl ion-neon-cyan">$1,234,567</p>
        </div>
        <div>
          <p class="text-white/60 text-sm">Pool APR</p>
          <p class="text-xl ion-neon-pink">25.50%</p>
        </div>
      </div>
      <div class="mb-5 space-y-2">
        <div class="p-3 bg-white/5 rounded-lg">ION / USDT Pool</div>
        <div class="p-3 bg-white/5 rounded-lg">ION / BNB Pool</div>
      </div>
      <div class="flex gap-4">
        <button class="flex-1 py-2 rounded-lg bg-gradient-to-r from-ion-green to-ion-cyan ion-hover-card">Add Liquidity</button>
        <button class="flex-1 py-2 rounded-lg bg-gradient-to-r from-ion-purple to-ion-pink ion-hover-card">Remove Liquidity</button>
      </div>
      <button @click="closeModal" class="mt-4 w-full py-2 border border-white/20 rounded-lg hover:bg-white/10 transition">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible'])
const closeModal = () => { emit('update:visible', false) }
</script>

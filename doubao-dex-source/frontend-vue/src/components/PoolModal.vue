<template>
  <div v-if="visible" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="visible = false">
    <div class="ion-glass rounded-2xl p-6 w-full max-w-md">
      <h3 class="text-lg font-bold mb-4 ion-neon-cyan">Liquidity Pool</h3>
      <div class="space-y-3">
        <div v-for="pool in pools" :key="pool.pair" class="flex justify-between p-3 bg-white/5 rounded-lg">
          <span>{{ pool.pair }}</span>
          <span class="text-ion-green">{{ pool.apr }}</span>
        </div>
      </div>
      <button @click="visible = false" class="w-full mt-4 py-2 rounded bg-white/10 text-white/80">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void }>()
const pools = [
  { pair: 'ION/USDT', apr: '18.65%' },
  { pair: 'BNB/USDT', apr: '15.32%' },
  { pair: 'ETH/USDT', apr: '12.88%' },
]
</script>

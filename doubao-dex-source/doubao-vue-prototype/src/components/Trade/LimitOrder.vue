<template>
  <div class="w-80 ion-glass rounded-2xl p-5 ion-liquid-border ion-hover-card">
    <div class="flex gap-3 mb-5">
      <span class="px-3 py-1 rounded bg-white/5 text-white/60">Swap</span>
      <span class="px-3 py-1 rounded bg-ion-purple/20 ion-neon-purple border border-ion-purple/40">Limit</span>
    </div>
    <div class="space-y-4 mb-5">
      <div class="p-3 bg-white/5 rounded-lg">
        <p class="text-sm text-white/50 mb-1">委托价格</p>
        <input placeholder="输入价格" class="w-full bg-transparent outline-none text-white">
      </div>
      <div class="p-3 bg-white/5 rounded-lg">
        <p class="text-sm text-white/50 mb-1">委托数量</p>
        <input placeholder="输入数量" class="w-full bg-transparent outline-none text-white">
      </div>
      <div class="flex gap-2">
        <button class="flex-1 py-2 rounded bg-ion-green/20 text-ion-neon-green">25%</button>
        <button class="flex-1 py-2 rounded bg-ion-green/20 text-ion-neon-green">50%</button>
        <button class="flex-1 py-2 rounded bg-ion-green/20 text-ion-neon-green">75%</button>
        <button class="flex-1 py-2 rounded bg-ion-green/20 text-ion-neon-green">100%</button>
      </div>
    </div>
    <div class="flex gap-3">
      <button class="flex-1 py-3 rounded-lg bg-red-500/30 text-red-400 hover:brightness-125">卖出</button>
      <button class="flex-1 py-3 rounded-lg bg-ion-green/30 ion-neon-green hover:brightness-125">买入</button>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

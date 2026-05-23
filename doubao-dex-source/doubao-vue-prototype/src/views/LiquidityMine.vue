<template>
  <div class="min-h-screen p-4 relative pb-8">
    <BackgroundBg />
    <HeaderNav />
    <div class="mt-5 flex flex-col gap-5 scene-3d">
      <div class="grid grid-cols-2 gap-4 scene-3d-child">
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card depth-panel-left glow-cyan">
          <p class="text-white/60 text-sm">我的LP份额</p>
          <p class="text-xl font-bold ion-neon-cyan">1258.60</p>
        </div>
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card depth-panel-right glow-green">
          <p class="text-white/60 text-sm">待领取挖矿收益</p>
          <p class="text-xl font-bold ion-neon-green">96.88 ION</p>
        </div>
      </div>
      <div class="ion-glass rounded-2xl p-5 ion-liquid-border ion-hover-card scene-3d-child" style="transform: translateZ(10px);">
        <h3 class="text-lg font-bold mb-4">可参与资金池</h3>
        <div class="space-y-3">
          <div class="p-4 bg-white/5 rounded-lg flex justify-between items-center card-3d">
            <div>
              <p>ION / USDT 流动池</p>
              <p class="text-sm text-white/50">年化收益 25.5%</p>
            </div>
            <button class="px-4 py-2 rounded bg-ion-cyan/20 ion-neon-cyan">加入质押</button>
          </div>
          <div class="p-4 bg-white/5 rounded-lg flex justify-between items-center card-3d">
            <div>
              <p>ION / BNB 流动池</p>
              <p class="text-sm text-white/50">年化收益 22.8%</p>
            </div>
            <button class="px-4 py-2 rounded bg-ion-purple/20 ion-neon-purple">加入质押</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BackgroundBg from '@/components/BackgroundBg.vue'
import HeaderNav from '@/components/HeaderNav.vue'
</script>

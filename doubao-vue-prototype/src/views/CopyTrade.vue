<template>
  <div class="min-h-screen p-4 relative pb-8">
    <BackgroundBg />
    <HeaderNav />
    <div class="mt-5 flex flex-col gap-5 scene-3d">
      <div class="grid grid-cols-4 gap-4 scene-3d-child">
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card depth-panel-left glow-cyan">
          <p class="text-white/60 text-sm">在线交易员</p>
          <p class="text-2xl font-bold ion-neon-cyan">128</p>
        </div>
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card depth-panel-center glow-purple">
          <p class="text-white/60 text-sm">今日跟单总额</p>
          <p class="text-2xl font-bold ion-neon-purple">$689,231</p>
        </div>
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card depth-panel-center glow-green">
          <p class="text-white/60 text-sm">平均收益率</p>
          <p class="text-2xl font-bold ion-neon-green">18.6%</p>
        </div>
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card depth-panel-right glow-pink">
          <p class="text-white/60 text-sm">我的跟单仓位</p>
          <p class="text-2xl font-bold ion-neon-pink">3 笔</p>
        </div>
      </div>
      <div class="ion-glass rounded-2xl p-5 ion-liquid-border ion-hover-card scene-3d-child" style="transform: translateZ(10px);">
        <h3 class="text-lg font-bold mb-4">热门交易员</h3>
        <div class="space-y-4">
          <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 card-3d">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-ion-cyan to-ion-purple"></div>
              <div>
                <p>顶级操盘手01</p>
                <p class="text-xs text-white/50">月收益 +32.8%</p>
              </div>
            </div>
            <button class="px-4 py-1 rounded bg-ion-green/20 ion-neon-green text-sm">一键跟单</button>
          </div>
          <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg hover:bg-white/10 card-3d">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-ion-purple to-ion-pink"></div>
              <div>
                <p>波段猎手</p>
                <p class="text-xs text-white/50">月收益 +25.3%</p>
              </div>
            </div>
            <button class="px-4 py-1 rounded bg-ion-green/20 ion-neon-green text-sm">一键跟单</button>
          </div>
        </div>
      </div>
      <div class="scene-3d-child" style="transform: translateZ(-10px);">
        <TradeHistory />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BackgroundBg from '@/components/BackgroundBg.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import TradeHistory from '@/components/Trade/TradeHistory.vue'
</script>

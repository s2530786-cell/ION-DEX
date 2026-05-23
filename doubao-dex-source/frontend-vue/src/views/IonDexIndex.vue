<template>
  <div class="min-h-screen relative pb-6">
    <BackgroundBg />
    <HeaderNav />

    <div class="flex gap-5 p-4 mt-5">
      <!-- Left: Swap -->
      <div class="w-80 ion-glass rounded-2xl p-5 ion-liquid-border ion-hover-card">
        <div class="flex gap-3 mb-5">
          <span class="px-3 py-1 rounded bg-ion-cyan/20 ion-neon-cyan border border-ion-cyan/40">Swap</span>
          <span class="px-3 py-1 rounded bg-white/5 text-white/60">Limit</span>
        </div>
        <div class="mb-4">
          <div class="flex justify-between p-3 bg-white/5 rounded-lg mb-2">
            <input placeholder="Token Pair" class="bg-transparent outline-none w-full text-white" />
            <span>▼</span>
          </div>
          <div class="flex justify-between p-3 bg-white/5 rounded-lg">
            <input placeholder="Price" class="bg-transparent outline-none w-full text-white" />
            <span>▼</span>
          </div>
        </div>
        <button class="w-full py-3 rounded-lg bg-gradient-to-r from-ion-green to-ion-cyan font-bold hover:brightness-125 transition-all ion-hover-card">
          Swap Now
        </button>
      </div>

      <!-- Center: Kline Chart -->
      <div class="flex-1 ion-glass rounded-2xl p-5 ion-liquid-border ion-hover-card">
        <div ref="kLineChart" class="w-full h-full min-h-[400px]"></div>
      </div>

      <!-- Right: Data Panel -->
      <div class="w-72 flex flex-col gap-4">
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card">
          <p class="text-white/60 text-sm">Total TVL</p>
          <p class="text-2xl font-bold ion-neon-cyan">$2,856,932</p>
        </div>
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card">
          <p class="text-white/60 text-sm">Current APR</p>
          <p class="text-2xl font-bold ion-neon-purple">28.65%</p>
        </div>
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card">
          <p class="text-white/60 text-sm">Burn Data</p>
          <p class="text-2xl font-bold ion-neon-pink">87.26M ION</p>
        </div>
      </div>
    </div>

    <!-- Bottom Action Buttons -->
    <div class="flex justify-center gap-4 px-4 mt-6">
      <button @click="showPoolModal = true" class="w-1/5 py-3 ion-glass rounded-xl ion-liquid-border ion-hover-card">Pool</button>
      <button class="w-1/5 py-3 ion-glass rounded-xl ion-liquid-border ion-hover-card">Copy Trade</button>
      <button @click="showBridgeModal = true" class="w-1/5 py-3 ion-glass rounded-xl ion-liquid-border ion-hover-card">Bridge</button>
      <button class="w-1/5 py-3 ion-glass rounded-xl ion-liquid-border ion-hover-card">Burn</button>
      <button class="w-1/5 py-3 ion-glass rounded-xl ion-liquid-border ion-hover-card">Domain</button>
    </div>

    <PoolModal v-model:visible="showPoolModal" />
    <BridgeModal v-model:visible="showBridgeModal" />
    <BurnPanel />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import BackgroundBg from '@/components/BackgroundBg.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import PoolModal from '@/components/PoolModal.vue'
import BridgeModal from '@/components/BridgeModal.vue'
import BurnPanel from '@/components/BurnPanel.vue'

const kLineChart = ref<HTMLDivElement | null>(null)
const showPoolModal = ref(false)
const showBridgeModal = ref(false)
let chartInstance: echarts.ECharts | null = null

onMounted(() => {
  if (!kLineChart.value) return
  chartInstance = echarts.init(kLineChart.value)
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, axisLine: { lineStyle: { color: '#ffffff30' } } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: '#ffffff30' } }, splitLine: { lineStyle: { color: '#ffffff15' } } },
    series: [
      {
        name: 'ION Price',
        type: 'line',
        smooth: true,
        data: [12, 20, 15, 28, 22, 35, 30, 42, 38, 50],
        lineStyle: { color: '#00ffff' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(0,255,255,0.3)' }, { offset: 1, color: 'rgba(0,255,255,0)' }]) }
      },
      {
        name: 'Market Trend',
        type: 'line',
        smooth: true,
        data: [8, 15, 22, 18, 30, 25, 38, 32, 45, 40],
        lineStyle: { color: '#ff00ff' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(255,0,255,0.25)' }, { offset: 1, color: 'rgba(255,0,255,0)' }]) }
      }
    ]
  }
  chartInstance.setOption(option)

  // Resize observer
  const ro = new ResizeObserver(() => chartInstance?.resize())
  ro.observe(kLineChart.value)
})

onUnmounted(() => {
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.bg-gradient-to-r { background-image: linear-gradient(to right, var(--ion-green), var(--ion-cyan)); }
</style>

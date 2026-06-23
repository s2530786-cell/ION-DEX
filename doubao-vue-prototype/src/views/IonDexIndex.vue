<template>
  <div class="min-h-screen relative pb-6">
    <BackgroundBg />
    <HeaderNav />

    <!-- 首页 3D 主场景 -->
    <div class="scene-3d">
      <div class="flex gap-5 p-4 mt-5 scene-3d-child">

        <!-- 左侧 Swap - 后景层 -->
        <div class="w-80 ion-glass rounded-2xl p-5 ion-liquid-border ion-hover-card depth-panel-left glow-cyan">
          <div class="flex gap-3 mb-5">
            <span class="px-3 py-1 rounded bg-ion-cyan/20 ion-neon-cyan border border-ion-cyan/40">Swap</span>
            <span class="px-3 py-1 rounded bg-white/5 text-white/60">Limit</span>
          </div>
          <div class="mb-4">
            <div class="flex justify-between p-3 bg-white/5 rounded-lg mb-2">
              <input placeholder="Token Pair" class="bg-transparent outline-none w-full text-white">
              <span>▼</span>
            </div>
            <div class="flex justify-between p-3 bg-white/5 rounded-lg">
              <input placeholder="Price" class="bg-transparent outline-none w-full text-white">
              <span>▼</span>
            </div>
          </div>
          <button class="w-full py-3 rounded-lg bg-gradient-to-r from-ion-green to-ion-cyan font-bold glow-green ion-hover-card">
            Swap Now
          </button>
        </div>

        <!-- 中间K线 - 主焦平面 -->
        <div class="flex-1 ion-glass rounded-2xl p-5 ion-liquid-border ion-hover-card depth-panel-center glow-purple">
          <div ref="kLineChart" class="w-full h-full min-h-[400px]"></div>
        </div>

        <!-- 右侧数据面板 - 前景层 -->
        <div class="w-72 flex flex-col gap-4 depth-panel-right">
          <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card glow-cyan">
            <p class="text-white/60 text-sm">Total TVL</p>
            <p class="text-2xl font-bold ion-neon-cyan">$2,856,932</p>
          </div>
          <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card glow-purple">
            <p class="text-white/60 text-sm">Current APR</p>
            <p class="text-2xl font-bold ion-neon-purple">28.65%</p>
          </div>
          <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card glow-pink">
            <p class="text-white/60 text-sm">Burn Data</p>
            <p class="text-2xl font-bold ion-neon-pink">87.26M ION</p>
          </div>
        </div>
      </div>

      <!-- 底部功能按钮 - 俯视倾斜层 -->
      <div class="flex justify-center gap-4 px-4 mt-6 scene-3d-child depth-panel-bottom">
        <button @click="showPoolModal = true"
          class="w-1/5 py-3 ion-glass rounded-xl ion-liquid-border ion-hover-card card-3d glow-cyan">
          Pool
        </button>
        <button @click="$router.push('/copy-trade')"
          class="w-1/5 py-3 ion-glass rounded-xl ion-liquid-border ion-hover-card card-3d glow-purple">
          Copy Trade
        </button>
        <button @click="showBridgeModal = true"
          class="w-1/5 py-3 ion-glass rounded-xl ion-liquid-border ion-hover-card card-3d glow-green">
          Bridge
        </button>
        <button @click="$router.push('/burn')"
          class="w-1/5 py-3 ion-glass rounded-xl ion-liquid-border ion-hover-card card-3d glow-pink">
          Burn
        </button>
        <button @click="$router.push('/domain')"
          class="w-1/5 py-3 ion-glass rounded-xl ion-liquid-border ion-hover-card card-3d glow-cyan">
          Domain
        </button>
      </div>
    </div>

    <PoolModal v-model:visible="showPoolModal" />
    <BridgeModal v-model:visible="showBridgeModal" />
    <BurnPanel />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import BackgroundBg from '@/components/BackgroundBg.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import PoolModal from '@/components/PoolModal.vue'
import BridgeModal from '@/components/BridgeModal.vue'
import BurnPanel from '@/components/BurnPanel.vue'

const $router = useRouter()
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
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#ffffff30' } }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#ffffff30' } },
      splitLine: { lineStyle: { color: '#ffffff15' } }
    },
    series: [
      {
        name: 'ION Price',
        type: 'line',
        smooth: true,
        data: [12, 20, 15, 28, 22, 35, 30, 42, 38, 50],
        lineStyle: { color: '#00ffff', width: 2, shadowBlur: 10, shadowColor: 'rgba(0,255,255,0.3)' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0,255,255,0.3)' },
            { offset: 1, color: 'rgba(0,255,255,0)' }
          ])
        }
      },
      {
        name: 'Market Trend',
        type: 'line',
        smooth: true,
        data: [8, 15, 22, 18, 30, 25, 38, 32, 45, 40],
        lineStyle: { color: '#ff00ff', width: 2, shadowBlur: 10, shadowColor: 'rgba(255,0,255,0.3)' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255,0,255,0.25)' },
            { offset: 1, color: 'rgba(255,0,255,0)' }
          ])
        }
      }
    ]
  }
  chartInstance.setOption(option)
  window.addEventListener('resize', handleResize)
})

const handleResize = () => { chartInstance?.resize() }

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <div class="min-h-screen p-4 relative pb-8">
    <BackgroundBg />
    <HeaderNav />
    <div class="mt-5 flex flex-col gap-5 scene-3d">
      <div class="grid grid-cols-3 gap-4 scene-3d-child">
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card depth-panel-left glow-green">
          <p class="text-white/60 text-sm">累计销毁总量</p>
          <p class="text-xl font-bold ion-neon-green">87,264,192 ION</p>
        </div>
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card depth-panel-center glow-pink">
          <p class="text-white/60 text-sm">24小时销毁</p>
          <p class="text-xl font-bold ion-neon-pink">289,612 ION</p>
        </div>
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card depth-panel-right glow-cyan">
          <p class="text-white/60 text-sm">流通剩余总量</p>
          <p class="text-xl font-bold ion-neon-cyan">12.68亿 ION</p>
        </div>
      </div>
      <div class="ion-glass rounded-2xl p-5 ion-liquid-border ion-hover-card scene-3d-child glow-green">
        <h3 class="text-lg font-bold mb-4">销毁走势曲线</h3>
        <div ref="fullBurnChart" class="w-full h-[350px]"></div>
      </div>
      <div class="scene-3d-child" style="transform: translateZ(-15px);">
        <div class="ion-glass rounded-2xl p-5 ion-liquid-border">
          <h3 class="text-lg font-bold mb-4">最新销毁记录</h3>
          <EmptyData />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import BackgroundBg from '@/components/BackgroundBg.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import EmptyData from '@/components/Common/EmptyData.vue'

const fullBurnChart = ref<HTMLDivElement | null>(null)
let chartIns: echarts.ECharts | null = null
const resizeFn = () => chartIns?.resize()

onMounted(() => {
  if (!fullBurnChart.value) return
  chartIns = echarts.init(fullBurnChart.value)
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { axisLine: { lineStyle: { color: '#ffffff30' } } },
    yAxis: { axisLine: { lineStyle: { color: '#ffffff30' } }, splitLine: { lineStyle: { color: '#ffffff15' } } },
    series: [{
      name: '月度销毁量',
      type: 'line',
      smooth: true,
      data: [1200000, 2500000, 1800000, 3600000, 4200000, 6800000, 8726000],
      lineStyle: { color: '#00ff88', width: 2, shadowBlur: 10, shadowColor: 'rgba(0,255,136,0.3)' },
      areaStyle: { color: 'rgba(0,255,136,0.2)' }
    }]
  }
  chartIns.setOption(option)
  window.addEventListener('resize', resizeFn)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeFn)
  chartIns?.dispose()
})
</script>

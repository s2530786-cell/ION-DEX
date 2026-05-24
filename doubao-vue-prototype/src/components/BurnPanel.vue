<template>
  <div class="mx-4 mt-5 ion-glass rounded-2xl p-5 ion-liquid-border">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-8 h-8 bg-gradient-to-r from-ion-pink to-ion-purple rounded"></div>
      <h3 class="text-lg font-bold">Burn 销毁数据追踪</h3>
    </div>
    <div class="grid grid-cols-2 gap-5 mb-5">
      <div>
        <p class="text-white/60 text-sm">Total Burned</p>
        <p class="text-xl ion-neon-green">87,264,192 ION</p>
      </div>
      <div>
        <p class="text-white/60 text-sm">Daily Burned</p>
        <p class="text-xl ion-neon-pink">289,612 ION</p>
      </div>
    </div>
    <div ref="burnChart" class="w-full h-[220px]"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const burnChart = ref<HTMLDivElement | null>(null)
let burnChartIns: echarts.ECharts | null = null

const resizeHandler = () => { burnChartIns?.resize() }

onMounted(() => {
  if (!burnChart.value) return
  burnChartIns = echarts.init(burnChart.value)
  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    xAxis: { axisLine: { lineStyle: { color: '#ffffff30' } } },
    yAxis: {
      axisLine: { lineStyle: { color: '#ffffff30' } },
      splitLine: { lineStyle: { color: '#ffffff15' } }
    },
    series: [
      {
        name: '销毁量',
        type: 'area',
        smooth: true,
        data: [5000, 12000, 8000, 22000, 18000, 30000, 289612],
        itemStyle: { color: '#00ff88' },
        areaStyle: { color: 'rgba(0,255,136,0.2)' }
      },
      {
        name: '流通销毁',
        type: 'area',
        smooth: true,
        data: [3000, 9000, 15000, 11000, 25000, 21000, 190000],
        itemStyle: { color: '#ff00ff' },
        areaStyle: { color: 'rgba(255,0,255,0.18)' }
      }
    ]
  }
  burnChartIns.setOption(option)
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
  burnChartIns?.dispose()
  burnChartIns = null
})
</script>

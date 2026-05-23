<template>
  <div class="kline-wrap p-4">
    <div class="tab-bar mb-4 flex gap-2">
      <button :class="{ active: period === '1m' }" @click="period = '1m'" class="px-3 py-1 rounded bg-white/5">M</button>
      <button :class="{ active: period === '1h' }" @click="period = '1h'" class="px-3 py-1 rounded bg-white/5">H</button>
      <button :class="{ active: period === '1d' }" @click="period = '1d'" class="px-3 py-1 rounded bg-white/5">D</button>
    </div>

    <div class="flex gap-4">
      <div class="flex-1" style="height: 500px">
        <v-chart :option="klineOption" autoresize />
      </div>
      <div class="w-72 depth-box overflow-auto" style="height: 500px">
        <h4 class="font-bold mb-2 ion-neon-cyan">Depth</h4>
        <div class="buy-list">
          <div v-for="(item, i) in depthBuy" :key="i" class="flex justify-between px-2 py-1 text-sm text-ion-green">
            <span>{{ item[0].toFixed(6) }}</span>
            <span>{{ item[1].toFixed(4) }}</span>
          </div>
        </div>
        <div class="sell-list mt-4">
          <div v-for="(item, i) in depthSell" :key="i" class="flex justify-between px-2 py-1 text-sm text-red-400">
            <span>{{ item[0].toFixed(6) }}</span>
            <span>{{ item[1].toFixed(4) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { use } from 'echarts/core'
import { CandlestickChart, BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import axios from 'axios'
import { useWeb3Store } from '@/stores/web3'

use([CandlestickChart, BarChart, LineChart, GridComponent, TooltipComponent, DataZoomComponent])

const BASE_API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const store = useWeb3Store()
const period = ref('1m')
const depthBuy = ref<number[][]>([])
const depthSell = ref<number[][]>([])

const klineOption = ref({
  tooltip: { trigger: 'axis' },
  grid: [{ left: 10, right: 10, top: 40, height: '60%' }, { left: 10, right: 10, top: '70%', height: '20%' }],
  xAxis: [{ type: 'category', data: [], boundaryGap: false }, { gridIndex: 1, type: 'category', data: [], boundaryGap: false }],
  yAxis: [{ scale: true }, { gridIndex: 1 }],
  series: [
    { type: 'candlestick', data: [], itemStyle: { color: '#ef4444', color0: '#22c55e' } },
    { type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: [], itemStyle: { color: '#4f46e5' } }
  ]
})

async function loadKline() {
  try {
    const res = await axios.get(`${BASE_API}/price/kline/data`, {
      params: { chain: store.chain, contract: 'your-token-contract', period: period.value }
    })
    const data = res.data
    const k = data.kline || []
    klineOption.value.xAxis[0].data = k.map((i: number[]) => new Date(i[0]).toLocaleString())
    klineOption.value.series[0].data = k.map((i: number[]) => [i[1], i[2], i[3], i[4]])
    klineOption.value.series[1].data = k.map((i: number[]) => i[5])
    depthBuy.value = data.depth_buy || []
    depthSell.value = data.depth_sell || []
  } catch {
    // use demo data if API unavailable
    const demo = [
      [Date.now() - 86400000, 0.88, 0.90, 0.87, 0.89, 5200],
      [Date.now() - 43200000, 0.89, 0.91, 0.88, 0.90, 6800],
      [Date.now(), 0.90, 0.92, 0.89, 0.91, 7500],
    ]
    klineOption.value.xAxis[0].data = demo.map((i) => new Date(i[0]).toLocaleString())
    klineOption.value.series[0].data = demo.map((i) => [i[1], i[2], i[3], i[4]])
    klineOption.value.series[1].data = demo.map((i) => i[5])
  }
}

watch(period, loadKline)
onMounted(loadKline)
</script>

<style scoped>
.kline-wrap { background: #111827; color: #fff; min-height: 600px; }
.tab-bar button.active { background: #4f46e5; color: #fff; }
</style>

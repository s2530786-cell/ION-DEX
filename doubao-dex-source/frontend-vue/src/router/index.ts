import { createRouter, createWebHistory } from 'vue-router'
import IonDexIndex from '@/views/IonDexIndex.vue'

const routes = [
  { path: '/', name: 'Home', component: IonDexIndex },
  { path: '/swap', name: 'Swap', component: () => import('@/views/SwapPage.vue') },
  { path: '/pool', name: 'Pool', component: () => import('@/views/PoolPage.vue') },
  { path: '/stake', name: 'Stake', component: () => import('@/views/StakePage.vue') },
  { path: '/bridge', name: 'Bridge', component: () => import('@/views/BridgePage.vue') },
  { path: '/limit-order', name: 'LimitOrder', component: () => import('@/views/LimitOrder.vue') },
  { path: '/batch-transfer', name: 'BatchTransfer', component: () => import('@/views/BatchTransferPage.vue') },
  { path: '/kline', name: 'Kline', component: () => import('@/views/KlineDepth.vue') },
  { path: '/user', name: 'User', component: () => import('@/views/UserCenter.vue') },
  { path: '/trade', name: 'Trade', component: () => import('@/views/FullTrade.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})

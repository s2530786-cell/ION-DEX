import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import IonDexIndex from '@/views/IonDexIndex.vue'
import CopyTrade from '@/views/CopyTrade.vue'
import DomainManage from '@/views/DomainManage.vue'
import BurnDetail from '@/views/BurnDetail.vue'
import LiquidityMine from '@/views/LiquidityMine.vue'
import SettingPage from '@/views/SettingPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: IonDexIndex },
  { path: '/copy-trade', name: 'CopyTrade', component: CopyTrade },
  { path: '/domain', name: 'Domain', component: DomainManage },
  { path: '/burn', name: 'Burn', component: BurnDetail },
  { path: '/mine', name: 'Mine', component: LiquidityMine },
  { path: '/settings', name: 'Settings', component: SettingPage },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

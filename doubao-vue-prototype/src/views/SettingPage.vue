<template>
  <div class="min-h-screen p-4 relative pb-8">
    <BackgroundBg />
    <HeaderNav />
    <div class="mt-5 scene-3d">
      <div class="scene-3d-child" style="max-width: 48rem; margin: 0 auto;">
        <div class="ion-glass rounded-2xl p-6 ion-liquid-border glow-cyan">
          <h3 class="text-xl font-bold mb-6">系统设置</h3>
          <div class="space-y-5">
            <div class="flex justify-between items-center py-3 border-b border-white/10 card-3d">
              <div>
                <p>界面深色模式</p>
                <p class="text-sm text-white/50">适配暗黑赛博风格</p>
              </div>
              <span class="w-12 h-6 rounded-full bg-ion-cyan/30 relative cursor-pointer">
                <span class="absolute right-1 top-1 w-4 h-4 rounded-full bg-white"></span>
              </span>
            </div>
            <div class="flex justify-between items-center py-3 border-b border-white/10 card-3d">
              <div>
                <p>交易滑点设置</p>
                <p class="text-sm text-white/50">当前默认 0.5%</p>
              </div>
              <button class="px-3 py-1 rounded bg-white/10 text-sm">修改</button>
            </div>
            <div class="flex justify-between items-center py-3 border-b border-white/10 card-3d">
              <div>
                <p>消息推送通知</p>
                <p class="text-sm text-white/50">交易、销毁异动提醒</p>
              </div>
              <span class="w-12 h-6 rounded-full bg-ion-purple/30 relative cursor-pointer">
                <span class="absolute right-1 top-1 w-4 h-4 rounded-full bg-white"></span>
              </span>
            </div>
            <div class="flex justify-between items-center py-3 card-3d">
              <div>
                <p>清除本地缓存</p>
                <p class="text-sm text-white/50">重置页面本地数据</p>
              </div>
              <button class="px-3 py-1 rounded bg-red-500/20 text-red-400 text-sm">清空</button>
            </div>
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

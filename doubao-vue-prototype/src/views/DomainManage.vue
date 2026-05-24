<template>
  <div class="min-h-screen p-4 relative pb-8">
    <BackgroundBg />
    <HeaderNav />
    <div class="mt-5 flex flex-col gap-5 scene-3d">
      <div class="scene-3d-child">
        <div class="ion-glass rounded-2xl p-5 ion-liquid-border">
          <h3 class="text-lg font-bold mb-4 ion-neon-purple">.ION 域名注册</h3>
          <div class="flex gap-3">
            <input class="flex-1 p-3 bg-white/5 rounded-lg outline-none text-white" placeholder="输入域名名称">
            <button class="px-6 py-3 rounded-lg bg-gradient-to-r from-ion-cyan to-ion-purple ion-hover-card glow-cyan">查询注册</button>
          </div>
        </div>
      </div>
      <div class="scene-3d-child" style="transform: translateZ(-15px);">
        <div class="ion-glass rounded-2xl p-5 ion-liquid-border">
          <h3 class="text-lg font-bold mb-4">已拥有域名</h3>
          <EmptyData />
        </div>
      </div>
      <div class="grid grid-cols-3 gap-4 scene-3d-child depth-panel-bottom">
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card card-3d text-center cursor-pointer glow-cyan">
          <p class="text-xl mb-2">🔗</p>
          <p>域名绑定</p>
        </div>
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card card-3d text-center cursor-pointer glow-purple">
          <p class="text-xl mb-2">📤</p>
          <p>域名转让</p>
        </div>
        <div class="ion-glass rounded-xl p-4 ion-liquid-border ion-hover-card card-3d text-center cursor-pointer glow-green">
          <p class="text-xl mb-2">⏳</p>
          <p>续费管理</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BackgroundBg from '@/components/BackgroundBg.vue'
import HeaderNav from '@/components/HeaderNav.vue'
import EmptyData from '@/components/Common/EmptyData.vue'
</script>

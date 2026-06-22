<template>
  <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <!-- 背景黑色 -->
    <div class="absolute inset-0 bg-[#0a0a12]"></div>

    <!-- 极光效果 -->
    <div class="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-gradient-to-br from-ion-cyan/5 to-transparent blur-[120px] animate-auroraMove"></div>
    <div class="absolute top-[30%] right-[-10%] w-[50%] h-[40%] rounded-full bg-gradient-to-bl from-ion-purple/5 to-transparent blur-[100px] animate-auroraMove" style="animation-delay: 2s;"></div>
    <div class="absolute bottom-[-10%] left-[20%] w-[40%] h-[30%] rounded-full bg-gradient-to-tr from-ion-green/5 to-transparent blur-[80px] animate-auroraMove" style="animation-delay: 4s;"></div>

    <!-- 星空粒子 -->
    <div class="absolute inset-0">
      <div v-for="n in 30" :key="n"
        class="absolute w-[2px] h-[2px] bg-white rounded-full animate-starTwinkle"
        :style="{
          top: Math.random() * 100 + '%',
          left: Math.random() * 100 + '%',
          opacity: Math.random() * 0.6 + 0.2,
          animationDelay: (Math.random() * 5) + 's',
          width: (Math.random() > 0.7 ? 3 : 1) + 'px',
          height: (Math.random() > 0.7 ? 3 : 1) + 'px'
        }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

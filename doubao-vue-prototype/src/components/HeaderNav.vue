<template>
  <header class="relative z-10 flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/[0.06] backdrop-blur-md">
    <!-- Logo -->
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-ion-cyan to-ion-purple animate-spinSlow"></div>
      <span class="text-xl font-bold ion-neon-cyan">ION DEX</span>
    </div>

    <!-- 导航链接 -->
    <nav class="flex items-center gap-6 text-sm text-white/70">
      <span class="hover:text-white cursor-pointer transition">Swap</span>
      <span class="hover:text-white cursor-pointer transition">Pool</span>
      <span class="hover:text-white cursor-pointer transition">Bridge</span>
      <span class="hover:text-white cursor-pointer transition">Burn</span>
      <span class="hover:text-white cursor-pointer transition">Copy Trade</span>
      <span class="hover:text-white cursor-pointer transition">Domain</span>
    </nav>

    <!-- 连接钱包 -->
    <button class="px-5 py-2 rounded-lg bg-gradient-to-r from-ion-cyan to-ion-purple font-medium text-sm hover:brightness-125 transition-all ion-hover-card">
      Connect Wallet
    </button>
  </header>
</template>

<script setup lang="ts">
</script>

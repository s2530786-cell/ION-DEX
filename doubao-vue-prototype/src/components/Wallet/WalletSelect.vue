<template>
  <div v-if="visible" class="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]" @click.self="closeModal">
    <div class="w-[420px] ion-glass rounded-2xl p-6 ion-liquid-border">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold ion-neon-cyan">连接钱包</h3>
        <span @click="closeModal" class="cursor-pointer text-white/60 hover:text-white text-xl">×</span>
      </div>
      <div class="space-y-3">
        <div class="p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer ion-hover-card border border-transparent hover:border-ion-cyan/30">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-ion-green to-ion-cyan"></div>
            <div>
              <p class="font-medium">MetaMask</p>
              <p class="text-sm text-white/50">以太坊系通用钱包</p>
            </div>
          </div>
        </div>
        <div class="p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer ion-hover-card border border-transparent hover:border-ion-purple/30">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-ion-purple to-ion-pink"></div>
            <div>
              <p class="font-medium">Trust Wallet</p>
              <p class="text-sm text-white/50">多链通用钱包</p>
            </div>
          </div>
        </div>
        <div class="p-4 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer ion-hover-card border border-transparent hover:border-ion-green/30">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-ion-cyan to-ion-pink"></div>
            <div>
              <p class="font-medium">WalletConnect</p>
              <p class="text-sm text-white/50">扫码快速连接</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible'])
const closeModal = () => { emit('update:visible', false) }
</script>

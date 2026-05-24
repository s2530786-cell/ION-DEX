<template>
  <div v-if="visible" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="closeModal">
    <div class="w-[480px] ion-glass rounded-2xl p-6 ion-liquid-border relative">
      <span @click="closeModal" class="absolute top-4 right-4 cursor-pointer text-white/60 hover:text-white text-xl">×</span>
      <div class="flex items-center gap-4 mb-6">
        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-ion-cyan to-ion-purple animate-spinSlow"></div>
        <h3 class="text-xl font-bold ion-neon-purple">Cross Chain Bridge</h3>
      </div>
      <div class="flex items-center justify-around mb-6">
        <div class="text-center">
          <p class="text-white/60 text-sm">Source Chain</p>
          <p class="ion-neon-cyan">ION Chain</p>
        </div>
        <div class="text-2xl ion-neon-green">⇄</div>
        <div class="text-center">
          <p class="text-white/60 text-sm">Target Chain</p>
          <p class="ion-neon-purple">BSC Chain</p>
        </div>
      </div>
      <div class="mb-6">
        <p class="text-white/60 text-sm mb-2">Transfer Amount</p>
        <input class="w-full p-3 bg-white/5 rounded-lg outline-none text-white" placeholder="Enter amount">
      </div>
      <button class="w-full py-3 rounded-lg bg-gradient-to-r from-ion-cyan to-ion-purple font-bold ion-hover-card">
        Confirm Transfer
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['update:visible'])
const closeModal = () => { emit('update:visible', false) }
</script>

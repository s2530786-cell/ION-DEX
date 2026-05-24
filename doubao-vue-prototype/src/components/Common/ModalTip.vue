<template>
  <div v-if="visible" class="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]" @click.self="closeModal">
    <div class="w-[380px] ion-glass rounded-xl p-6 ion-liquid-border">
      <div class="text-center mb-5">
        <span class="text-3xl mb-3 inline-block">{{ iconType === 'success' ? '✅' : iconType === 'warn' ? '⚠️' : '❌' }}</span>
        <h4 class="text-xl font-bold">{{ title }}</h4>
        <p class="text-white/60 mt-2">{{ desc }}</p>
      </div>
      <div class="flex gap-3">
        <button v-if="showCancel" @click="closeModal" class="flex-1 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition">
          取消
        </button>
        <button @click="confirmHandle" class="flex-1 py-2 rounded-lg bg-gradient-to-r from-ion-cyan to-ion-purple ion-hover-card">
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  title: string
  desc: string
  iconType: 'success' | 'warn' | 'error'
  showCancel?: boolean
}>()
const emit = defineEmits(['update:visible', 'confirm'])

const closeModal = () => { emit('update:visible', false) }
const confirmHandle = () => { emit('confirm'); closeModal() }
</script>

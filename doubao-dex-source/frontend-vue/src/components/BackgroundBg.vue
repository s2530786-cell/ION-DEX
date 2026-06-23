<template>
  <div class="fixed inset-0 bg-black/40 z-0 overflow-hidden pointer-events-none">
    <div class="absolute inset-0 bg-gradient-to-br from-ion-cyan/5 via-transparent to-ion-purple/5"></div>
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-ion-cyan/10 rounded-full blur-3xl animate-auroraMove"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ion-purple/10 rounded-full blur-3xl animate-auroraMove" style="animation-delay: 4s"></div>
    <div class="absolute top-1/2 left-1/2 w-64 h-64 bg-ion-green/5 rounded-full blur-3xl animate-auroraMove" style="animation-delay: 2s"></div>
  </div>
</template>

<style scoped>
@keyframes auroraFloat {
  0% { transform: translateY(0) scale(1.1); }
  100% { transform: translateY(-20px) scale(1); }
}
.animate-auroraMove { animation: auroraFloat 8s ease-in-out infinite alternate; }
</style>

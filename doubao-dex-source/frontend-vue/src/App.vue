<template>
  <div id="ion-dex-app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useWeb3Store } from '@/stores/web3'

const store = useWeb3Store()

onMounted(() => {
  store.init()
})
</script>

<style>
#ion-dex-app {
  min-height: 100vh;
  background: #0a0a12;
  color: #fff;
}
</style>

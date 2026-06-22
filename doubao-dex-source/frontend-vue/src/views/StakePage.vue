<template>
  <div class="stake-page p-4 max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-6 ion-neon-purple">LP Staking</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="pool in stakePools" :key="pool.id" class="ion-glass rounded-xl p-4 ion-liquid-border">
        <div class="flex justify-between mb-2">
          <span class="font-bold">{{ pool.pair }}</span>
          <span class="text-ion-green">APR {{ pool.apr }}</span>
        </div>
        <div class="text-white/60 text-sm mb-1">Staked: {{ pool.staked }} LP</div>
        <div class="text-white/60 text-sm mb-3">Rewards: {{ pool.rewards }} ION</div>
        <div class="flex gap-2">
          <button @click="stake(pool)" class="flex-1 py-2 rounded-lg bg-ion-cyan/20 border border-ion-cyan/40 text-sm">Stake</button>
          <button @click="unstake(pool)" class="flex-1 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/40 text-sm">Unstake</button>
          <button @click="claimReward(pool)" class="flex-1 py-2 rounded-lg bg-ion-green/20 border border-ion-green/40 text-sm">Claim</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWeb3Store } from '@/stores/web3'
import { ethers } from 'ethers'

const store = useWeb3Store()

const stakePools = ref([
  { id: 1, pair: 'ION/USDT', apr: '28.5%', staked: '0', rewards: '0', addr: '0x...' },
  { id: 2, pair: 'BNB/USDT', apr: '22.3%', staked: '0', rewards: '0', addr: '0x...' },
])

async function stake(pool: any) {
  const amt = prompt('Enter LP amount to stake:')
  if (!amt || !store.signer) return
  const stakeAddr = import.meta.env.VITE_STAKING_CONTRACT
  const abi = ['function stake(uint256 amount) external']
  const contract = new ethers.Contract(stakeAddr, abi, store.signer)
  const tx = await contract.stake(ethers.parseEther(amt))
  await tx.wait()
  alert('Staked successfully')
}

async function unstake(pool: any) {
  if (!store.signer) return
  const amt = prompt('Enter LP amount to unstake:')
  if (!amt) return
  const stakeAddr = import.meta.env.VITE_STAKING_CONTRACT
  const abi = ['function unstake(uint256 amount) external']
  const contract = new ethers.Contract(stakeAddr, abi, store.signer)
  const tx = await contract.unstake(ethers.parseEther(amt))
  await tx.wait()
  alert('Unstaked')
}

async function claimReward(pool: any) {
  if (!store.signer) return
  const stakeAddr = import.meta.env.VITE_STAKING_CONTRACT
  const abi = ['function claimReward() external']
  const contract = new ethers.Contract(stakeAddr, abi, store.signer)
  const tx = await contract.claimReward()
  await tx.wait()
  alert('Reward claimed')
}
</script>

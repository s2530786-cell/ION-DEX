import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ethers } from 'ethers'

export const useWeb3Store = defineStore('web3', () => {
  const address = ref('')
  const chain = ref('BSC')
  const provider = ref<any>(null)
  const signer = ref<any>(null)
  const token = ref('')
  const isConnected = computed(() => !!address.value)

  async function init() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      provider.value = new ethers.providers.Web3Provider((window as any).ethereum)
    }
  }

  async function connect() {
    if (!provider.value) return
    const accounts = await provider.value.send('eth_requestAccounts', [])
    address.value = accounts[0]
    signer.value = provider.value.getSigner()
    const net = await provider.value.getNetwork()
    if (net.chainId === 56) chain.value = 'BSC'
    else if (net.chainId === 1) chain.value = 'ETH'
    else chain.value = 'ION'
  }

  async function login() {
    if (!signer.value) return
    const message = `ION DEX Login ${Date.now()}`
    const sig = await signer.value.signMessage(message)
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: address.value, signature: sig, message })
    })
    const data = await res.json()
    if (data.code === 0) token.value = data.token
  }

  return { address, chain, provider, signer, token, isConnected, init, connect, login }
})

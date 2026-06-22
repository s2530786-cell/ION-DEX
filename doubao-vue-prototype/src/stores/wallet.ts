import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface ChainInfo {
  chainId: number
  name: string
  symbol: string
  rpcUrl: string
  scanUrl: string
}

export interface AccountAsset {
  symbol: string
  balance: string
  decimals: number
  address: string
}

export const useWalletStore = defineStore('wallet', () => {
  const isConnected = ref<boolean>(false)
  const accountAddress = ref<string>('')
  const currentChain = ref<ChainInfo | null>(null)
  const assetList = ref<AccountAsset[]>([])
  const walletModalVisible = ref<boolean>(false)
  const approveCache = ref<Record<string, boolean>>({})

  // 真实 ION chainId = 997（测试网），BSC = 56
  const chainConfig: Record<number, ChainInfo> = {
    997: {
      chainId: 997,
      name: 'ION Chain',
      symbol: 'ION',
      rpcUrl: 'https://api.mainnet.ice.io/http/v2/jsonRPC',
      scanUrl: 'https://explorer.ice.io'
    },
    56: {
      chainId: 56,
      name: 'Binance Smart Chain',
      symbol: 'BNB',
      rpcUrl: 'https://bsc-dataseed.binance.org',
      scanUrl: 'https://bscscan.com'
    }
  }

  const shortAddress = computed(() => {
    if (!accountAddress.value) return ''
    const addr = accountAddress.value
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  })

  function setWalletInfo(addr: string, chainId: number) {
    accountAddress.value = addr
    currentChain.value = chainConfig[chainId] || null
    isConnected.value = !!addr
  }

  function disconnectWallet() {
    isConnected.value = false
    accountAddress.value = ''
    currentChain.value = null
    assetList.value = []
    approveCache.value = {}
  }

  function updateAssetList(list: AccountAsset[]) {
    assetList.value = list
  }

  function setApproveStatus(tokenAddr: string, status: boolean) {
    approveCache.value[tokenAddr] = status
  }

  function switchChain(chainId: number) {
    currentChain.value = chainConfig[chainId] || null
  }

  function toggleWalletModal(show: boolean) {
    walletModalVisible.value = show
  }

  return {
    isConnected, accountAddress, currentChain, assetList,
    walletModalVisible, approveCache, shortAddress, chainConfig,
    setWalletInfo, disconnectWallet, updateAssetList,
    setApproveStatus, switchChain, toggleWalletModal
  }
})

import { ethers, Contract, JsonRpcProvider } from 'ethers'
import type { ChainInfo } from '@/stores/wallet'

// 合约实例缓存池
const contractCacheMap = new Map<string, Contract>()

/**
 * 创建只读合约实例
 */
export function createReadContract(
  contractAddr: string,
  abi: any[],
  chain: ChainInfo
): Contract {
  const cacheKey = `${chain.chainId}-${contractAddr}`
  if (contractCacheMap.has(cacheKey)) {
    return contractCacheMap.get(cacheKey)!
  }
  const provider = new JsonRpcProvider(chain.rpcUrl)
  const contract = new Contract(contractAddr, abi, provider)
  contractCacheMap.set(cacheKey, contract)
  return contract
}

/**
 * 创建可签名交互合约实例
 */
export function createWriteContract(
  contractAddr: string,
  abi: any[],
  signer: ethers.Signer
): Contract {
  return new Contract(contractAddr, abi, signer)
}

/**
 * 获取代币余额
 */
export async function getTokenBalance(
  tokenAddr: string,
  userAddr: string,
  abi: any[],
  chain: ChainInfo
): Promise<string> {
  try {
    const contract = createReadContract(tokenAddr, abi, chain)
    const decimals = await contract.decimals()
    const balance = await contract.balanceOf(userAddr)
    return ethers.formatUnits(balance, decimals)
  } catch {
    return '0'
  }
}

/**
 * 代币授权
 */
export async function tokenApprove(
  tokenAddr: string,
  spender: string,
  amount: string,
  abi: any[],
  signer: ethers.Signer
): Promise<string> {
  const contract = new Contract(tokenAddr, abi, signer)
  const tx = await contract.approve(spender, ethers.parseEther(amount))
  await tx.wait()
  return tx.hash
}

/**
 * 查询授权额度
 */
export async function getAllowance(
  tokenAddr: string,
  owner: string,
  spender: string,
  abi: any[],
  chain: ChainInfo
): Promise<string> {
  try {
    const contract = createReadContract(tokenAddr, abi, chain)
    const decimals = await contract.decimals()
    const allowance = await contract.allowance(owner, spender)
    return ethers.formatUnits(allowance, decimals)
  } catch {
    return '0'
  }
}

/**
 * 通用合约调用
 */
export async function contractCall(
  contractAddr: string,
  abi: any[],
  method: string,
  params: any[] = [],
  chain: ChainInfo,
  signer?: ethers.Signer
) {
  let contract: Contract
  if (signer) {
    contract = new Contract(contractAddr, abi, signer)
  } else {
    contract = createReadContract(contractAddr, abi, chain)
  }
  return await contract[method](...params)
}

/**
 * 清理合约缓存
 */
export function clearContractCache() {
  contractCacheMap.clear()
}

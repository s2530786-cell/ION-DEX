/**
 * ionSwap — ION 原生链 swap 编排层
 *
 * 把已验证的三块拼成一条端到端链路：
 *   connectIonWallet (ionWalletService)
 *     → getJettonWalletAddress (ionJettonResolver)   推导 jetton wallet 地址
 *     → buildSwapTx (ionSwapBuilder)                  构造字节级正确的 BOC
 *     → sendIonTransaction (ionWalletService)         钱包签名 + 上链
 *
 * ⚠️ 现状（2026-06-26 实测）：ION 原生链上尚无已部署的 DEX Router。
 *    dex-core-v2 合约逻辑已沙箱验证全绿，但未部署到主网。
 *    因此本编排层「代码就绪」，但需要 IonDexConfig.routerAddress 填入
 *    真实部署地址后才能真正路由。未配置时 executeIonSwap 会明确报错，
 *    绝不静默发出一笔无处可达的交易。
 *
 * 零 mock。所有地址推导走真实 ION 主网 indexer/get-method。
 */

import {
  connectIonWallet,
  sendIonTransaction,
  getIonWalletProvider,
  ionToNano,
} from './ionWalletService';
import { getJettonWalletAddress } from './ionJettonResolver';
import { buildSwapTx, DEFAULT_FWD_GAS, type SwapParams } from './ionSwapBuilder';

/**
 * ION DEX 部署配置。Router 上主网后在这里填真实地址。
 * 未配置 = swap 不可用（明确报错，不静默）。
 */
export interface IonDexConfig {
  /** DEX Router 合约地址（ION 原生链，EQ/UQ friendly）。部署后填。 */
  routerAddress: string | null;
}

// 占位：等 dex-core-v2 部署到 ION 主网后填入真实 Router 地址。
export const ION_DEX_CONFIG: IonDexConfig = {
  routerAddress: null,
};

export interface IonSwapRequest {
  /** 卖出代币的 Jetton Master 地址 */
  fromJettonMaster: string;
  /** 买入代币的 Jetton Master 地址 */
  toJettonMaster: string;
  /** 卖出数量（人类可读，如 "1.5"） */
  amount: string;
  /** 卖出代币精度（nano 换算用），默认 9 */
  fromDecimals?: number;
  /** 最小买入量（最小单位），滑点保护。默认 1n（无保护，仅测试用） */
  minOut?: bigint;
  /** 截止时间（unix 秒）。默认 now + 600s */
  deadline?: number;
  /** 随交易附带的 ION（gas + forward），默认 0.3 */
  attachedTon?: string;
}

export interface IonSwapResult {
  txResult: string;
  /** 构造交易时实际用到的地址，便于排查 */
  detail: {
    userAddress: string;
    userFromJettonWallet: string;
    routerFromJettonWallet: string;
    routerToJettonWallet: string;
    amountNano: string;
  };
}

/** 把人类可读数量转成最小单位（支持任意精度）。 */
function toAtomic(amount: string, decimals: number): bigint {
  const [whole, frac = ''] = amount.split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  const base = 10n ** BigInt(decimals);
  return BigInt(whole || '0') * base + BigInt(fracPadded || '0');
}

/**
 * 执行一笔 ION 原生链 swap。
 *
 * 流程全真实、零 mock：
 *  1. 连钱包拿用户地址
 *  2. 用 indexer 推导三个 jetton wallet 地址（用户卖出侧 / Router 卖出侧 / Router 买入侧）
 *  3. 构造字节级正确的 swap BOC
 *  4. 钱包签名上链
 *
 * @throws routerAddress 未配置时直接报错（DEX 尚未部署）
 */
export async function executeIonSwap(
  req: IonSwapRequest,
  config: IonDexConfig = ION_DEX_CONFIG
): Promise<IonSwapResult> {
  if (!config.routerAddress) {
    throw new Error(
      'ION DEX 尚未部署 Router 到主网，swap 暂不可用。' +
      '（链路代码已就绪，部署后在 ION_DEX_CONFIG.routerAddress 填入真实地址即可启用）'
    );
  }
  const router = config.routerAddress;

  // 1) 连钱包
  const { address: userAddress } = await connectIonWallet();

  // 2) 推导三个 jetton wallet 地址（并行）
  const [userFromJettonWallet, routerFromJettonWallet, routerToJettonWallet] = await Promise.all([
    getJettonWalletAddress(req.fromJettonMaster, userAddress),
    getJettonWalletAddress(req.fromJettonMaster, router),
    getJettonWalletAddress(req.toJettonMaster, router),
  ]);

  // 3) 构造 swap BOC
  const decimals = req.fromDecimals ?? 9;
  const amountNano = toAtomic(req.amount, decimals);
  const deadline = req.deadline ?? Math.floor(Date.now() / 1000) + 600;

  const swapParams: SwapParams = {
    jettonAmount: amountNano,
    routerJettonWallet: routerFromJettonWallet,
    otherTokenWallet: routerToJettonWallet,
    receiver: userAddress,
    refundAddress: userAddress,
    minOut: req.minOut ?? 1n,
    deadline,
    fwdGas: DEFAULT_FWD_GAS,
    responseAddress: userAddress,
  };

  const tx = buildSwapTx(swapParams, userFromJettonWallet, req.attachedTon ?? '0.3');

  // 4) 钱包签名上链
  const txResult = await sendIonTransaction(tx);

  return {
    txResult,
    detail: {
      userAddress,
      userFromJettonWallet,
      routerFromJettonWallet,
      routerToJettonWallet,
      amountNano: amountNano.toString(),
    },
  };
}

/** swap 链路是否就绪可用（钱包已装 + Router 已配置）。 */
export function isIonSwapReady(config: IonDexConfig = ION_DEX_CONFIG): boolean {
  return Boolean(config.routerAddress) && getIonWalletProvider() !== null;
}

// 给 UI 用的 nano 换算便捷导出
export { ionToNano };
